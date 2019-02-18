<template>
    <div>
        <div class="poiPop" ref="poi-box" v-if="popStatus">
            <a class="close" @click="close()"></a>
            <div class="title nullBg" ref="poi-title">
               <label>{{title}}</label>
            </div>
            <div class="popTab">
                <div class="title">基本信息</div>
                <v-poi-model class="popTab-box" :slot="type" v-on:status = "openStatus"></v-poi-model>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import PoiModel from '../PopupBox/PoiModel';
import { Model as MD } from '../../utils/tools/Model.js';

export default {
    name: 'Model',
    components: {
        'v-poi-model': PoiModel
    },
    data() {
        return {
            popStatus: false,
            poiMapping: {
                waterLogging: '',
                fireDanger: 'firePointInfo'
            },
            lonlat: [],
            zoom: ''
        };
    },
    computed: {
        ...mapState({
            param: state => state.model.param,
            code: state => state.sys.code,
            type: state => state.model.type,
            opacity: state => state.opacity.value,
            fallzone: state => state.model.fallzone
        }),
        title() {
            return MD.setting[this.type].text + '详情';
        }
    },
    watch: {
        param() {
            // 针对火险，内涝，解决图例等级与poi图不同时，弹窗打开关闭问题
            if (['waterLogging', 'fireDanger'].includes(this.type) && this.popStatus) {
                this.close();
            }
            if (this.fallzone) {
                this.removePoint();
                this.removeStatic();
                this.renderGeo();
            } else {
                this.removePoint();
                this.removeGeo();
                // const filter = [ 'heavyRainfall', 'gale', 'temp', 'fireDanger', 'waterLogging', 'stormTide', 'mt', 'mountainTorrents', 'pollutantDispersion' ];
                if (this.param.modelType === 'pollutantDispersion') {
                    this.removeStatic();
                } else {
                    // if (filter.indexOf(this.type) !== -1)
                    // 标记-模型联调需要注意修改
                    this.renderStatic();
                }
            }
        },

        popStatus(status) {
            if (status) {
                // 增加拖动效果
                this.$nextTick(() => {
                    WD.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
                });
            }
        },
        type() {
            this.close();
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.staticParam = {};

            this.pointParam = {
                url: sysconfig.REMOTEPATH + '/gdmodel/model!queryWaterLoggingImg.action',
                name: 'waterLogging',
                params: {}
            };

            this.geoParam = {
                url: sysconfig.IP + '/server/data/disaster/area',
                name: 'fallzone',
                params: {}
            };

            this.timer = { static: null };

            this.static = null;

            this.point = null;

            this.geo = null;
        },

        renderStatic() {
            utils.clearTimer(this.timer.static);
            this.timer.static = window.setTimeout(() => {
                // 获取地图动态变量
                const imageParam = lmap.util.getImageParam(Object.assign({ format: 'image', CRS: sysconfig.SYSTEM_PROJECTION }, this.param), lmap.map);
                const url = sysconfig.TESTPATH + MD.url[this.type].static + '?' + utils.serializeWithAuth(imageParam);
                const extent = lmap.util.getExtent(lmap.map);
                const param = { url, moving: true, extent };
                if (!!this.static) {
                    lmap.image.updateStatic(this.static, param, 'url');
                    this.static.setOpacity(this.opacity);
                } else {
                    this.static = lmap.image.Static(lmap.map, param, 'model', 'url');
                    this.static.setOpacity(this.opacity);
                    this.updateParam(['model', { callback: this.setLayerOpacity }]);
                }
            }, 80);
        },

        /**
         * 删除模型色斑图
         */
        removeStatic() {
            if (!!this.static) {
                lmap.map.removeLayer(this.static);
                this.static = null;
            }
        },

        /**
         * 渲染模式落区色斑图
         */
        renderGeo() {
            this.geoParam.params = this.param;
            utils.GET(this.geoParam.url, this.geoParam.params).then(json => {
                if (json !== 'null' && json !== null && !!json.data) {
                    if (!!this.geo) {
                        lmap.icon.clear(this.geo);
                    } else {
                        this.geo = lmap.layer.init(lmap.map, 'model');
                    }
                    let data = json.data;
                    data.forEach((obj, index) => {
                        let { color, geoJson: wkt } = obj;
                        let feature = lmap.polygon.addWKT(wkt)[0];
                        color = color.replace('192', '0.6');
                        let fill = 'rgba(' + color + ')';
                        let style = { fill: { color: fill, width: 1 } };
                        feature.setStyle(lmap.style.getStyle(style));
                        this.geo.getSource().addFeature(feature);
                    });
                } else {
                    if (!!this.geo) lmap.icon.clear(this.geo);
                }
            });
        },

        /**
         * 删除渲染落区色斑图
         */
        removeGeo() {
            if (!!this.geo) {
                lmap.map.removeLayer(this.geo);
                this.geo = null;
            }
        },

        /**
         * 渲染模型影响点
         */
        renderPoint() {
            this.pointParam.params = this.param;
            if (!!this.point) {
                lmap.image.updateWMS(this.point, this.pointParam);
            } else {
                this.point = lmap.image.WMS(lmap.map, this.pointParam, 'model');
            }
        },

        /**
         * 删除模型影响点
         */
        removePoint() {
            if (!!this.point) {
                lmap.map.removeLayer(this.point);
                this.point = null;
            }
        },

        /**
         * 修改图层透明度
         */
        setLayerOpacity(val) {
            if (!!this.static) this.static.setOpacity(val);
        },

        click(e) {
            this.zoom = lmap.util.getZoom(lmap.view);
            let [lon, lat] = lmap.ctrl.getLonLat(e);
            this.lonlat = [lon, lat];
            this.getPopupsDetails();
        },
        getPopupsDetails() {
            // 通过配置文件知道是否存在poi图层的请求
            let poiInfo = MD.url[this.type].poiInfo;
            if (poiInfo) {
                let tempParam = {};
                let { dateTime, code } = this.param;
                let isFireDanger = this.type === 'fireDanger';
                let [lon, lat] = this.lonlat;
                let zoom = this.zoom;
                let param = { dateTime, code, lon, lat, zoom };
                // 为了适应后端链接参数的不同
                if (isFireDanger) {
                    let { pfmType, modelType, levels } = this.param;
                    tempParam = Object.assign({}, param, { pfmType, modelType, levels });
                } else {
                    let { pfmtype, pType, filestr } = this.param;
                    tempParam = Object.assign({}, param, { pfmtype, pType, filestr });
                }
                utils.GET(sysconfig.TESTPATH + poiInfo, tempParam).then(json => {
                    if (json.hasOwnProperty('data')) {
                        this.popStatus = true;
                        let mapping = this.poiMapping[this.type];
                        let data = mapping ? json.data[mapping] : json.data;
                        this.updateParam(['normalPoiDetail', { data: data }]);
                    }
                });
            }
        },
        close() {
            this.popStatus = false;
            this.updateParam(['selectPoint', { lonlat: null, status: false, type: '' }]);
            this.updateParam(['normalPoiDetail', { type: '' }]);
        },
        openStatus(status) {
            this.popStatus = status;
        }
    },
    mounted() {
        this.initConstData();
        lmap.map.on('moveend', this.renderStatic);
        lmap.view.on('change:resolution', this.renderStatic);
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        this.close();
        lmap.map.un('singleclick', this.click);
        lmap.map.un('moveend', this.renderStatic);
        lmap.view.un('change:resolution', this.renderStatic);
        this.removeStatic();
        this.removePoint();
        this.removeGeo();
        this.updateParam(['model', { callback: null }]);
    }
};
</script>

<style scoped lang='less'>
.poiPop {
    width: 427px;
    height: auto;
    position: absolute;
    z-index: @popup-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: 0px 2px 4px 0 rgba(0, 0, 0, 0.3);
    .nullBg {
        background: #fff;
    }
    .title {
        cursor: move;
        // .height();
        text-align: left;
        padding-left: 5px;
        padding-right: 23px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
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
        }
    }
}

.big {
    .poiPop {
        width: 600px;
    }
}
</style>
