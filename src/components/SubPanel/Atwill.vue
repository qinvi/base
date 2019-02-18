<template>
    <div>
        <div class="atwill hover">
            <ul class="tools clearfix">
                <li v-for="(item, key) of handles" :key="key" :class="[ 'tools-item', 'icon-econtrol-' + key, item.status ? 'selected' : '' ]" @click="select(item, key)"></li>
            </ul>
            <ul class="circle-box clearfix" v-if="handles.circle.status">
                <li v-for="(item, key) of circleTypes" :key="key">
                    <input :id="item.val" :value="item.val" v-model="circleType" name="circleType" class="radio" type="radio"/>
                    <label :for="item.val">{{ item.text }}</label>
                </li>
            </ul>
        </div>
        <div class="analysis-out" id="analysis-out" :style="computeZindex">
            <v-analysis v-if="analysisStatus" :count="count" @close="closeAnalysis"></v-analysis>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Analysis from './AtwillAnalysis';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    name: 'Atwill',
    components: {
        'v-analysis': Analysis
    },
    data() {
        return {
            handles: {
                circle: { text: '圆', type: 'circle', status: false },
                box: { text: '矩形', type: 'box', status: false },
                polygon: { text: '任意面', type: 'polygon', status: false },
                undo: { text: '撤销' },
                delete: { text: '删除' }
            },
            circleTypes: [{ text: '自定义', val: 9999 }, { text: '100公里', val: 100 }, { text: '300公里', val: 300 }, { text: '500公里', val: 500 }],
            circleType: 9999,
            analysisStatus: false,
            count: {}
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            fullScreen: state => state.target.fullScreen,
            targetType: state => state.target.belong,
            toggle: state => state.atwill.toggle
        }),
        computeZindex() {
            let t = '';
            if (this.targetType === 'atwill') {
                if (this.fullScreen) {
                    this.lastZindex = Number(window.getComputedStyle(document.getElementById('analysis-out'), null).getPropertyValue('z-index'));
                    t = { 'zIndex': WinDrag.zIndex + 1 };
                } else {
                    t = { 'zIndex': WinDrag.zIndex + 1 };
                }
            } else {
                t = { 'zIndex': WinDrag.zIndex }
            }
            return t;
        }
    },
    watch: {
        circleType(type) {
            if (this.last.type === 'circle') {
                if (this.circleType === 9999) {
                    this.initHandle('circle', true);
                } else {
                    this.initHandle('fixCircle', true, this.circleType);
                }
                this.cancelZoom(false);
            }
        },
        toggle() {
            if (this.last) {
                this.initHandle(this.last.type, false);
                this.last.status = false;
                this.last = null;
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.lastZindex = '';
            // 画笔 - 集合
            this.drawParam = null;

            // 画笔 - 对象
            this.handle = null;

            // 影响分析 - 边界信息
            this.wkts = [];

            // 保存上次选中的画笔对象
            this.last = null;

            // 接口URL
            this.urls = {
                atwillTotal: sysconfig.TESTPATH + '/atwill/getAtwillTotal'
            };
        },

        /**
         * 选择工具
         * @param {object} item 工具对象
         * @param {string} type 操作类型
         */
        select(item, type) {
            this.analysisStatus = false;
            this.circleType = 9999;
            if (type === 'undo') {
                lmap.draw.undo(this.drawParam.layer);
                this.wkts = this.wkts.splice(0, this.wkts.length - 1);
                if (utils.isEmptyArray(this.wkts)) {
                    this.analysisStatus = false;
                } else {
                    this.analysis(this.wkts.join('#'));
                }
            } else if (type === 'delete') {
                lmap.draw.clear(this.drawParam.layer);
                this.wkts = [];
                this.analysisStatus = false;
            } else {
                if (!!this.last && this.last.type !== item.type) {
                    this.last.status = false;
                }
                const status = (item.status = !item.status);
                this.last = status ? item : null;
                this.initHandle(item.type, status);
            }
        },

        /**
         * 初始化画笔
         * @param {string} type 画笔类型
         * @param {boolean} status 是否初始化
         * @param {number} radius 圆半径
         */
        initHandle(type, status, radius) {
            if (!!this.handle) {
                lmap.draw.cancel(lmap.map, this.handle);
                this.handle = null;
            }
            if (status) {
                if (!this.drawParam) {
                    this.initLayer();
                }
                if (type === 'circle' || type === 'fixCircle') {
                    this.cancelZoom(false);
                } else {
                    this.cancelZoom(true);
                }
                const event = {
                    start: () => console.info(type + ' start...'),
                    end: e => this.end(e.feature, this.last.type)
                };
                let style = {};
                const eventParam = { map: lmap.map };

                if (!!radius) {
                    let view = this.drawParam.map.getView();
                    let projection = view.getProjection();
                    let resolutionAtEquator = view.getResolution();
                    let center = lmap.map.getView().getCenter();
                    let pointResolution = ol.proj.getPointResolution(projection, resolutionAtEquator, center);
                    let resolutionFactor = resolutionAtEquator / pointResolution;

                    this.drawParam.radius = radius * 1000;
                    const ww = window.innerWidth;
                    const extend = lmap.util.getExtent(lmap.map);
                    const w = ol.extent.getWidth(extend);
                    const pixel = (this.drawParam.radius / ol.proj.METERS_PER_UNIT.m) * resolutionFactor;
                    // const pixel1 = ww / w * radius * 1000;
                    const pixel1 = ww / w * pixel

                    style = { circle: { radius: pixel1 } };
                } else {
                    this.drawParam.radius = null;
                }
                this.handle = lmap.draw.initHandle(this.drawParam, type, event, eventParam, style);
            } else {
                this.cancelZoom(true);
            }
        },

        /**
         * 画笔结束回调事件
         * @param {object} feature 返回的矢量对象
         * @param {string} type 画笔类型
         */
        end(feature, type) {
            this.saveWKT(lmap.polygon.getWKT(feature, type));
            // this.initHandle(this.last.type, false);
            // this.last.status = false;
            // this.last = null;
        },

        /**
         * 缓存WKT
         * @param {string} wkt 缓存
         */
        saveWKT(wkt) {
            this.wkts.push(wkt);
            this.analysis(this.wkts.join('#'));
        },

        /**
         * 后台过滤合并影响区域
         * @param {string} wkt 圈选范围信息
         */
        analysis(wkt) {
            this.getAreaTown(wkt);
        },

        /**
         * 根据圈选信息查询影响分析
         * @param {string} wkt 圈选范围信息
         */
        getAreaTown(wkt) {
            let param = { wkt: wkt, code: this.code };
            utils.POST(this.urls.atwillTotal, param).then(json => {
                const { totalMap, townList, acreage: area, gdp, population: pop, cacheId } = json.data;
                const list = {};
                for (let town of townList) {
                    list[town.code] = town.name;
                }
                this.count = {
                    target: {
                        count: {
                            LCD_LED: totalMap.LCD_LED,
                            SMS_USER: totalMap.SMS_USER,
                            TYFON: totalMap.TYFON
                        },
                        list,
                        wkt
                    },
                    town: totalMap.townCont,
                    area,
                    pop,
                    gdp,
                    cacheId
                };
                this.analysisStatus = true;
            });
        },

        cancelZoom(status) {
            lmap.map.getInteractions().forEach(status ? on : off);
            function off(element, index, array) {
                if (element instanceof ol.interaction.MouseWheelZoom) {
                    element.setActive(false);
                }
            }
            function on(element, index, array) {
                if (element instanceof ol.interaction.MouseWheelZoom) {
                    element.setActive(true);
                }
            }
        },

        /**
         * 关闭影响分析
         */
        closeAnalysis() {
            this.analysisStatus = false;
        },

        /**
         * 初始化图层
         */
        initLayer() {
            let drawParam = lmap.layer.initDrawParam(lmap.map, 'drawImpact');
            this.drawParam = drawParam;
        },

        /**
         * 删除图层
         */
        remove() {
            if (!!this.handle) {
                lmap.draw.cancel(lmap.map, this.handle);
                this.handle = null;
            }
            if (!!this.drawParam) {
                lmap.map.removeLayer(this.drawParam.layer);
            }
        }

        // checkFeature() {
        //     utils.clearTimer(this.timer);
        //     this.timer = window.setTimeout(() => {
        //         const radius = this.drawParam.radius;
        //         if (radius) {
        //             this.initHandle('fixCircle', true, radius / 1000);
        //             this.handle.finishDrawing();
        //         }
        //     }, 80);
        // }
    },

    mounted() {
        this.initConstData();
        this.select(this.handles.polygon);
    },

    destroyed() {
        this.remove();
        this.cancelZoom(true);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.atwill {
    position: fixed;
    top: @top-normal;
    right: 204px;
    width: auto;
    z-index: @panel-index;
    background: #fff;
    box-shadow: @shadow;

    .tools {
        .tools-item {
            .height(26px);
            width: 26px;
            margin: 3px 3px;
            float: left;
            background: linear-gradient(#fff, #eee);

            &:nth-child(1) {
                margin-left: 3px;
            }

            &:nth-last-child(1) {
                margin-right: 5px;
            }

            &::before {
                font-size: 26px;
                border: 1px solid rgb(199, 199, 199);
            }
        }

        .selected::before {
            color: @select-font-color;
            border-color: @select-font-color;
        }
    }
    .circle-box {
        position: absolute;
        top: 36px;
        background: #fff;
        box-shadow: @shadow;

        li {
            display: inline-block;
            width: 46%;
            padding: 2px;
            text-align: left;
            // input + label::after {
            //     top: 12px;
            // }
        }
    }
}

.analysis-out {
    position: absolute;
    top: 66px;
    right: 204px;
    z-index: 5010;
    width: auto;
}

.big {
    .atwill {
        top: @top-big;
        .circle-box {
            top: 40px;
            width: 224px;
        }
    }
    .analysis-out {
        top: 85px;
    }
    .tools {
        .tools-item {
            width: 30px;
            .height-big(30px);
            &::before {
                font-size: 30px;
            }
        }
    }
    .radio:checked + label::after {
        top: 10px;
    }
}
</style>
