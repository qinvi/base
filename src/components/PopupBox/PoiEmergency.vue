<template>
    <div class="poiPop" ref="poi-box">
        <a class="close" @click="close()" v-show="!childDetails || popParams.close"></a>
        <div class="title" ref="poi-title" :style="{cursor: (!childDetails || popParams.noWinDrag) ? 'move' : 'default'}">
            <label :title="title">{{ title || '--' }}</label>
        </div>
        <div class="popTab popTaBorder">
            <div class="popTab-box">
                <ul>
                    <li v-for="(val, key, index) of topContent" :key="index" :title="val">{{ key }}：{{ val || '--' }}</li>
                </ul>
            </div>
        </div>
        <div class="popTable">
            <table>
                <thead>
                    <tr>
                        <td v-for="(val, key, index) of content" :key="index">{{ val || '--' }}</td>
                    </tr>
                </thead>
            </table>
        </div>
        <div class="popTable" id="emergencyList">
            <table>
                <tbody>
                    <tr v-for="(item, index) in tableContent" :key="index">
                        <td v-for="(val, key, index) in content" :key="index" :title="item[val]">{{ item[val] || '--' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import IScroll from 'iscroll';
export default {
    name: 'PoiEmergency',
    props: [ 'childDetails', 'popParams' ],
    data() {
        return {
            topContent: null,
            tableContent: {},
            title: '',
            emergency: {
                list: [],
                name: '',
                curType: '' // 当前高亮的应急物资类型
            },
            keysTab: [] // 应急物资类型array
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            normalSelect: state => state.normalPoiDetail.selectPoiType,
            normalType: state => state.normalPoiDetail.type,
            detail: state => state.normalPoiDetail.data
        })
    },
    watch: {
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) {
                this.close();
            }
        },
        childDetails() {
            this.packData();
        },
        detail() {
            this.packData(); // 组装数据
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.content = {
                materiallName: '物资名称',
                materialExist: '已有物资名称',
                size: '物资型号',
                materialNum: '物资数量',
                numberUnit: '数量单位'
            };
            this.scroll = null;
            this.activeCode = '';
        },

        /**
         * 改变应急物资的类型窗口
         *
         * @param {string} type 应急物资类型
         */
        exChangeType(type) {
            this.emergency.curType = type;
        },

        /**
         * 组装数据
         */
        packData() {
            const data = (this.childDetails) ? this.childDetails.data : this.detail.data;
            if (this.childDetails && this.popParams.showSelect) {
                this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: `normal&${data.poiType}` } ]); // 高亮poi
            }
            this.activeCode = data.areaCode;
            // let detail = data.detailMap; // 过去结构
            let keys = Object.keys(data.multiMap) // 现在结构
            let detail = data.multiMap[keys[0]]
            // 判断key值是否存在储备地址或者应急储备地址
            for (let key in detail[0]) {
                if (key.indexOf('储备地址') !== -1) {
                    this.title = detail[0][key];
                    delete detail[0][key];
                }
            }
            this.topContent = detail[0];
            this.tableContent = detail[1];
            this.setScroll();
            // detail[1].forEach((ele) => {
            //     ele['已有物资名称'] = ele['已有物资名称'].replace(/[、,，]|\s+/g, ',');
            // });
        },

        setScroll() {
            this.$nextTick(() => {
                /* eslint-disable */
                if (this.scroll) this.scroll.refresh();
                else {
                    /* eslint-disable */
                    this.$nextTick(() => {
                        this.scroll = new IScroll('#emergencyList', {
                            mouseWheel: true,
                            scrollbars: true,
                            disableMouse: true,
                            interactiveScrollbars: true,
                            disablePointer: true,
                            click: false
                        });
                    });
                }
            })
        },

        /**
         * 关闭
         */
        close() {
            const t = this.callbackActiveType();
            if (t.normal === this.normalSelect) this.removeSelectPoint('normal', this.normalSelect);
            if (this.normalType === 'emergency') this.updateParam([ 'normalPoiDetail', { type: '' } ]);
        }
    },
    created() {
        this.initConstData();
    },
    mounted() {
        if (!this.childDetails || this.popParams.noWinDrag) WD.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        this.packData();
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WD.zIndex + 1
            WD.zIndex += 1
        }
    },
    destroyed() {
        this.close();
    }
};
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';

.poiPop {
    width: 427px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    transition: box-shadow 0.3s;
    padding-bottom: 3px;
    .title {
        cursor: move;
        height: 26px;
        line-height: 26px;
        text-align: left;
        padding-left: 5px;
        padding-right: 23px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .popTab {
        // border: 1px solid #ccc;
        margin: 3px;
        height: auto;
        overflow: hidden;
        .popTab-box {
            width: 100%;
            ul {
                width: 98%;
                margin: auto;
                margin-top: 3px;
                margin-bottom: 3px;
                min-height: 30px;
                max-height: 300px;
                overflow-y: auto;
            }
            li {
                height: 22px;
                line-height: 22px;
                width: 49%;
                margin-right: 1%;
                text-align: left;
                float: left;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
    }
    #emergencyList {
        position: relative;
        max-height: 100px;
        overflow: hidden;
    }
    .popTable {
        table {
            thead tr, tbody tr{
                display: -webkit-flex;
                display: flex;
                td {
                    border-left: 1px solid #e0eaf5;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
            }
            tbody {
                position: relative;
                overflow: initial;
                tr { background: #fff; }
            }
            tr td {
                font-style: normal;

                vertical-align: middle;
                text-align: center;
                word-break: break-all;
                font-weight: 400;
                &:nth-child(1) {
                    -webkit-flex: 1 1.5 70px;
                            flex: 1 1.5 70px;
                }
                &:nth-child(2) {
                    -webkit-flex: 1 1.5 70px;
                            flex: 1 1.5 70px;
                }
                &:nth-child(3) {
                    -webkit-flex: 1.3 1.3 55px;
                            flex: 1.3 1.3 55px;
                }
                &:nth-child(4) {
                    -webkit-flex: 1.3 1.3 55px;
                            flex: 1.3 1.3 55px;
                }
                &:nth-child(5) {
                    -webkit-flex: 1.3 1.3 55px;
                            flex: 1.3 1.3 55px;
                }
            }
        }
    }
}

/*big*/
.big {
    .poiPop {
        width: 570px;
    }
}

</style>
