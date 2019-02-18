<template>
    <div class="poiPop" ref="poi-box">
        <a class="close" @click="close()" v-show="!childDetails || popParams.close"></a>
        <div class="title nullBg" ref="poi-title" :title="normal.name" :style="{cursor: (!childDetails || popParams.noWinDrag) ? 'move' : 'default'}">
            <label v-if="!loud.loudStatus && !expertList">{{ normal.name || '--' }}</label>
            <label v-else-if="!!expertList">专家详情（共{{expertNameList.length}}人）</label> 
            <label v-if="loud.loudStatus && !loud.noData">设备所在地：{{ loud.name || '' }}</label>
            <label v-if="loud.loudStatus && loud.noData">暂无数据</label>
        </div>
        <div class="popTab">
            <div class="title" v-if="(!loud.loudStatus || (loud.loudStatus && !loud.noData)) && !expertList">基本信息</div>
            <div class="mantab" :class="{ 'more' : morebtn}" v-else-if="!!expertList">
                <ul>
                    <li v-for="itemname in expertNameList" :key ="itemname"  :class="{'active' : activeName == itemname}" @click="switchExpert(itemname)">{{itemname}}</li>
                </ul>
                <span  @click="morebtn = !morebtn" v-if="expertNameList.length > 8"></span>
            </div>
            <div class="popTab-box">
                <div v-if="!loud.loudStatus">
                    <ul v-if="normal.traffic && !expertList">
                        <li v-for="(item, key) in normal.list" :key="key" v-show="item.paramTitle !== '名称' && item.paramVal.indexOf('font') === -1" :title="item.paramVal">{{item.paramTitle}}：{{item.paramVal.trim() || '--'}}</li>
                    </ul>
                    <ul v-else-if="!!expertList">
                        <li v-for="(item, key) in activeExpert" :key="key" v-if="item.paramTitle !== '名称'" :title="item.paramVal">{{item.paramTitle}}：{{formatVal(item.paramTitle, item.paramVal.trim() || '--')}}</li>
                    </ul>
                    <ul v-else>
                        <li v-for="(item, key) in normal.list" :key="key" v-if="item.paramTitle !== '名称'" :title="item.paramVal">{{item.paramTitle}}：{{formatVal(item.paramTitle, item.paramVal.trim() || '--')}}</li>
                    </ul>
                </div>
                <div v-if="loud.loudStatus && !loud.noData">
                    <ul>
                        <li v-for="(item, index) in loud['defaultList']" :key="index">{{item}}</li>
                    </ul>
                    <div class="dalaba"><!--v-show="loud.type !== '大喇叭'"-->
                        <span>最新信息： </span>
                        <span v-if="!loud.nMessage">
                            <span v-for="(item, key) in loud.sourceList" :key="key" v-if="!!item" :title="item">
                                {{item}}
                            </span>
                        </span>
                        <span v-else>
                            <label>暂无最新信息！</label>
                        </span>                        
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'PoiNormal',
    props: [ 'childDetails', 'popParams' ],
    data() {
        return {
            normal: {
                list: [],
                name: '',
                traffic: false, // 客运站
                poiType: ''
            },
            loud: { // 大喇叭数据
                loudStatus: false,
                name: '',
                type: '', // 类型
                defaultList: {}, // 默认展示的信息
                sourceList: {}, // 源消息
                nMessage: false,
                noData: false
            },
            expertNameList: [],
            activeName: '',
            activeExpert: [],
            morebtn: false,
            expertList: null
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            detail: state => state.normalPoiDetail.data,
            normalSelect: state => state.normalPoiDetail.selectPoiType,
            normalType: state => state.normalPoiDetail.type,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            sysTime: state => state.time.sysTime,
            removeSelectPoint: state => state.selectPoint.remove
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
            this.activeCode = '';
            this.morebtn = false;
        },

        /**
         * 组装列表内容
         *
         * @param {string} title 字段名称
         * @param {string} val 字段值
         */
        formatVal(title, val) {
            return title === '经度' || title === '纬度' ? Number(val).toFixed(4) : val;
        },

        /**
         * 组装基础数据
         */
        packData() {
            this.expertList = null;
            this.loud.loudStatus = false;
            const data = (this.childDetails) ? this.childDetails.data : this.detail.data;
            this.normal.poiType = data.poiType;
            this.activeCode = data.areaCode;
            if (this.childDetails && this.popParams.showSelect) this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: `normal&${data.poiType}` } ]); // 高亮poi
            if (data.detailMap && data.detailMap.hasOwnProperty('address')) {
                this.packLoudData(data); // 组装大喇叭数据
                return;
            }
            if (!!data.expertMap) {
                this.packExpert(data); // 专家数据做特殊处理
                return;
            }
            let name = '';
            let len = data.detailMap.length;
            let detailLen = 0;
            data.detailMap.every(ele => {
                if (ele.paramTitle.indexOf('名称') !== -1) {
                    name = ele.paramVal;
                    if (ele.paramTitle === '名称') detailLen = len;
                }
                if (detailLen === len) this.normal.name = name;
                else ++detailLen;
                return (detailLen !== len);
            });
            this.normal.traffic = (data.poiType.indexOf('HZ_TRAFFIC') !== -1);
            this.normal.list = data.detailMap;
        },

        /**
         * 组装大喇叭数据
         *
         * @param {object} data 大喇叭数据
         */
        packLoudData(data) {
            console.info('-----------')
            const detail = data.detailMap;
            this.loud.loudStatus = true;
            this.loud.noData = !detail.termType;
            this.loud.name = detail.address;
            this.loud.type = detail.termType;
            let t = {};
            t.termType = '设备类型：' + detail.termType;
            t.termId = '设备编号：' + detail.termId;
            t.status = '当前状态：' + detail.status;
            t.lonlat = '经纬度：' + data.lon + ' ，' + data.lat;
            t.operator = '维护人员：' + detail.operator;
            t.serviceTel = '联系电话：' + detail.serviceTel;
            this.loud.defaultList = t;
            let flag = true;
            Object.keys(detail).forEach(ele => {
                if (ele.indexOf('message') !== -1 && !!detail[ele]) flag = false;
            });
            this.loud.nMessage = flag;
            const { message1, message2, message3, message4, message5 } = detail;
            this.loud.sourceList = [message1, message2, message3, message4, message5];
        },

        /**
         * 组装专家数据
         * @param {object} data 专家数据
         */
        packExpert(data) {
            this.expertList = data.expertMap;
            this.expertNameList = Object.keys(this.expertList);
            this.activeName = this.expertNameList[0];
            this.activeExpert = Object.values(this.expertList)[0];
        },
        /**
         * 切换专家tab
         * @param {string} key 专家名
         */
        switchExpert(key) {
            this.activeName = key;
            for (let key in this.expertList) {
                if (key === this.activeName) {
                    this.activeExpert = this.expertList[key];
                }
            }
        },
        /**
         * 关闭
         */
        close() {
            const t = this.callbackActiveType();
            if (t.normal === this.normalSelect) this.removeSelectPoint('normal', this.normalSelect);
            this.removeSelectPoint('monitor', this.normalSelect);
            if (this.normalType === 'normal') this.updateParam([ 'normalPoiDetail', { type: '' } ]);
        }
    },
    mounted() {
        this.initConstData();
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
@import "../../assets/css/common.less";
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
    .nullBg {
        background: #fff;
    }
    .title {
        cursor: move;
        .height();
        text-align: left;
        padding-left: 5px;
        padding-right: 23px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        label {
            cursor: pointer;
            margin: 2px;
            padding: 0 5px;
            border-radius: 5px;
            &.active {
                background: #1f7ed0;
                color: #fff;
            }
         }
    }
    .popTab {
        border: 1px solid #ccc;
        margin: 3px;
        height: auto;
        overflow: hidden;
        .title {
            cursor: auto;
        }
        .popTab-box {
            width: 100%;
            ul {
                width: 98%;
                margin: auto;
                margin-top: 3px;
                margin-bottom: 3px;
                min-height: 30px;
                // max-height: 300px;
                // overflow-y: auto;
            }
            li {
                // height: 22px;
                line-height: 22px;
                width: 49%;
                margin-right: 1%;
                text-align: left;
                float: left;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;

                &:nth-child(even) {
                    // text-indent: 10px;
                }
            }
            .dalaba li{
                width: 100%;
                
            }
        }
        .mantab {
            background: #ecf2fc;
            .height();
            padding-right: 30px; 
            position: relative;
            overflow: hidden;
            ul li {
                float: left;
                cursor: pointer;
                width: 36px;
                text-align: center;
                margin: 5px 2px;
                padding: 0 4px;
                border-radius: 5px;
                line-height: 16px;
                &.active {
                    background: #1f7ed0;
                    color: #fff;
                }
            }
            span {
                cursor: pointer;
                position: absolute;
                top: 5px;
                right: 10px;
                font-size: 16px;
                display: block;
                width: 8px;
                height: 8px;
                border-right: 2px solid #999;
                border-bottom: 2px solid #999;
                transition: all .5s;
                transform: rotate(45deg);
                
            }
            &.more {
                height: auto!important;
                span {
                    transform: rotate(-135deg);
                    top: 10px;
                }
                
            }
        }
    }
}
.big {
    .poiPop {
        width: 570px; // 600
        .title {
            .height(@height-big);
        }

        .popTab {
            .popTab-box {
                ul {
                    li {
                        line-height: @height-big;
                    }
                }
            }
            .mantab {
                .height(@height-big);
                ul li {
                    width: 56px;
                    line-height: 22px;
                    font-size: 18px;
                }
            }
        }
    }
}
</style>
