<template>
    <div class="globalPop">
        <!-- 面板 -->
        <div v-if="popType === 'BaseInfo'"></div>
        <!-- 基础数据弹窗 -->
        <div class="poiPop" ref="poi-box" v-else>
            <div class="title nullBg" ref="poi-title" :title="normal.name">
                <label v-if="!loud.loudStatus">{{ normal.name || '' }}</label>
                <label v-if="loud.loudStatus && !loud.noData">设备所在地：{{ loud.name || '' }}</label>
                <label v-if="loud.loudStatus && loud.noData">暂无数据</label>
            </div>
            <div class="popTab">
                <div class="title" v-if="!loud.loudStatus || (loud.loudStatus && !loud.noData)">基本信息</div>
                <div class="popTab-box">
                    <div v-if="!loud.loudStatus">
                        <ul v-if="normal.traffic">
                            <li v-for="(item, key) in normal.list" :key="key" v-show="item.paramTitle !== '名称' && item.paramVal.indexOf('font') === -1" :title="item.paramVal">{{item.paramTitle}}：{{item.paramVal}}</li>
                        </ul>
                        <ul v-else>
                            <li v-for="(item, key) in normal.list" :key="key" v-show="item.paramTitle !== '名称'" :title="item.paramVal">{{item.paramTitle}}：{{formatVal(item.paramTitle, item.paramVal)}}</li>
                        </ul>
                    </div>
                    <div v-if="loud.loudStatus && !loud.noData">
                        <ul>
                            <li v-for="(item, index) in loud['defaultList']" :key="index">{{item}}</li>
                        </ul>
                        <ul v-show="loud.type !== '大喇叭'">
                            <li>最新信息：</li>
                            <ul>
                                <div v-if="!loud.nMessage">
                                    <div v-for="(item, key) in loud.sourceList" :key="key" v-show="!!item" :title="item">
                                        {{item}}
                                    </div>
                                </div>
                                <div v-else>
                                    <label>暂无最新信息！</label>
                                </div>
                            </ul>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              GlobalSearchPop list
 * ----------------------------------------------------------------------------
 * formatVal                - 组装列表内容
 * packData                 - 组装基础数据
 * packLoudData             - 组装大喇叭数据
 */
import { mapActions, mapState } from 'vuex';
export default {
    name: 'GlobalPop',
    props: ['detail', 'popType'],
    data() {
        return {
            normal: {
                list: [],
                name: '',
                traffic: false // 客运站
            },
            loud: { // 大喇叭数据
                loudStatus: false,
                name: '',
                type: '', // 类型
                defaultList: {}, // 默认展示的信息
                sourceList: {}, // 源消息
                nMessage: false,
                noData: false
            }
        }
    },
    computed: {
        ...mapState({
            removeSelectPoint: state => state.selectPoint.remove,
            code: state => state.sys.code
        })
    },
    watch: {
        detail() {
            this.packData(); // 组装数据
        }
    },
    methods: {
        ...mapActions(['updateParam']),

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
            this.loud.loudStatus = false;
            const data = this.detail.data;
            if (data.detailMap.hasOwnProperty('address')) {
                this.packLoudData(data); // 组装大喇叭数据
                return;
            }
            let detailLen = 0;
            let name = '';
            let len = data.detailMap.length;
            data.detailMap.every(ele => {
                if (ele.paramTitle.indexOf('名') !== -1) {
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
            const detail = data.detailMap;
            this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: 'normal&loud' } ]); // 高亮poi
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
        }
    },
    mounted() {
        this.packData();
    },
    destroyed() {
    }
};
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';
.globalPop {
    // position: absolute;
    left: 0px;
    text-align: left;
    background: #fff;
    // padding-bottom: 11px;
    // 基础数据弹窗样式
    .poiPop {
        width: 420px;
        height: auto;
        z-index: @pop-index;
        background: #fff;
        .nullBg {
            background: #fff;
        }
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
            border: 1px solid #ccc;
            margin: 3px 7px 3px 3px;
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
                    max-height: 300px;
                    overflow-y: auto;
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
                }
            }
        }
    }
}
.big {
    .globalPop .poiPop {
        width: 570px;
    }
}
</style>
