<template>
    <div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Model as MD } from '../../utils/tools/Model.js';

export default {
    name: 'Model',
    data() {
        return {
            popStatus: false,
            lonlat: [],
            zoom: ''
        }
    },
    computed: {
        ...mapState({
            param: state => state.model.param,
            level: state => state.level.dataString,
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            type: state => state.model.type,
            opacity: state => state.opacity.value,
            fallzone: state => state.model.fallzone,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            belongTo: state => state.normalPoiDetail.belongTo,
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove
        }),
        title() {
            return MD.setting[this.type].text + '详情';
        }
    },
    watch: {
        level() {
            this.close();
        },
        sysTime() {
            this.popStatus = true;
        },
        param() {
            let modelType = this.param.modelType;
            // 针对火险，内涝，解决图例等级与poi图不同时，弹窗打开关闭问题
            if ([ 'waterLogging', 'fireDanger' ].includes(this.type) && this.popStatus) {
                this.close();
            }
            this.removePoint();
            this.removeGeo();
            // const filter = [ 'heavyRainfall', 'gale', 'temp', 'fireDanger', 'waterLogging', 'stormTide', 'mt', 'mountainTorrents', 'pollutantDispersion' ];
            let pdStatus = (modelType === 'pollutantDispersion');
            if (pdStatus) this.removeStatic();
            else if (!pdStatus) this.renderStatic();
        },
        type() {
            this.close();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.updateParam(['clickCallback', { modelCallback: this.carryDataAndStatus }]);
            this.staticParam = { };
            this.poiMapping = {
                waterLogging: 'waterloggingInfo',
                fireDanger: 'firePointInfo'
            };
            this.pointParam = {
                url: sysconfig.REMOTEPATH + '/gdmodel/model!queryWaterLoggingImg.action',
                name: 'waterLogging',
                params: { }
            };

            this.geoParam = {
                url: sysconfig.IP + '/server/data/disaster/area',
                name: 'fallzone',
                params: { }
            };
            this.activeCode = '';
            this.lastNormalType = '';
            this.timer = { static: null };

            this.static = null;

            this.point = null;

            this.geo = null;
        },

        renderStatic() {
            utils.clearTimer(this.timer.static);
            this.timer.static = window.setTimeout(() => {
                // 未选中污染点时不请求图片
                if (this.param.modelType === 'pollutantDispersion') return

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
                    this.updateParam([ 'model', { callback: this.setLayerOpacity } ]);
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
            utils.GET(this.geoParam.url, this.geoParam.params).then((json) => {
                if (json !== 'null' && json !== null && !!json.data) {
                    let data = json.data;
                    let array = [];
                    data.forEach((obj) => {
                        let { color, geoJson: wkt } = obj;
                        color = 'rgba(' + color.replace('192', '0.6') + ')';
                        array.push({color, wkt});
                    });
                    this.addGeomFeatures(...array);
                }
            });
        },
        /**
         * 渲染污染物色斑图,加载geom接口，目前处于废弃之中，如有需要可以重新开启。
         */
        renderPollutantGeo() {
            let url = sysconfig.TESTPATH + MD.url[this.type].static;
            let {code, dateTime, modelType, levels} = this.param;
            // dateTime = '2018-04-09 20:00:00';
            utils.GET(url, {code, dateTime, modelType, levels}).then((json) => {
                if (json !== 'null' && json !== null && !!json.data) {
                    let data = json.data.geomInfoList;
                    let array = [];
                    data.forEach((obj) => {
                        let { areaLevel, areaGeom: wkt } = obj;
                        let color = 'rgba(' + MD.level['pollutantDispersion'][areaLevel].rgba + ')';
                        array.push({color, wkt});
                    });
                    this.addGeomFeatures(...array);
                }
            });
        },
        addGeomFeatures() {
            const args = Array.from(arguments);
            if (!args[0]) {
                if (!!this.geo) lmap.icon.clear(this.geo);
            } else {
                if (!!this.geo) lmap.icon.clear(this.geo);
                else this.geo = lmap.layer.init(lmap.map, 'model');
                args.forEach((item) => {
                    let { color, wkt } = item;
                    let feature = lmap.polygon.addWKT(wkt)[0];
                    let style = { fill: {color: color, width: 1} };
                    feature.setStyle(lmap.style.getStyle(style));
                    this.geo.getSource().addFeature(feature);
                });
            }
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
            let [ lon, lat ] = lmap.ctrl.getLonLat(e);
            this.lonlat = [ lon, lat ];
            this.getPopupsDetails(this.getClickIndex());
        },
        getPopupsDetails(clickIndex) {
            // 通过配置文件知道是否存在poi图层的请求
            let poiInfo = MD.url[this.type].poiInfo;
            if (poiInfo) {
                let tempParam = {};
                let { dateTime, code } = this.param;
                let isFireDanger = (this.type === 'fireDanger');
                let [ lon, lat ] = this.lonlat;
                let zoom = this.zoom;
                let param = {dateTime, code, lon, lat, zoom};
                // 为了适应后端链接参数的不同
                if (isFireDanger) {
                    let {pfmType, modelType, levels} = this.param;
                    tempParam = Object.assign({}, param, {pfmType, modelType, levels});
                } else {
                    let {pfmtype, pType, filestr} = this.param;
                    tempParam = Object.assign({}, param, {pfmtype, pType, filestr});
                }
                utils.GET(sysconfig.TESTPATH + poiInfo, tempParam).then((json) => {
                    if (Object.keys(json.data[this.poiMapping[this.type]]).length) {
                        this.clickPlugin('modelCallback', json, clickIndex); // 触发poi点击插件
                    }
                });
            }
        },

        /**
         * 组装详情数据到poiNormal.vue
         * @param {object} 源数据
         */
        packDetailData(data) {
            const {fullName, level, sateName, lon, lat, fireConfidence, bt_4, bt_11, areaCode} = data;
            let params, poiKeys;
            if (this.type === 'waterLogging') { // 内涝
                params = {fullName, level};
                poiKeys = {fullName: '地址', level: '等级'};
            } else { // 森林火点
                params = {sateName, fullName, level, fireConfidence, bt_4, bt_11};
                params.lonlat = lon + '，' + lat;
                poiKeys = {fullName: '位置', level: '等级', sateName: '卫星名称', lonlat: '经纬度', fireConfidence: '火点置信度', bt_4: '4微米亮温', bt_11: '11微米亮温'};
            }
            // params['title'] = MD.setting[this.type].text + '详情';
            let transData = [];
            Object.keys(params).forEach((ele, i) => {
                transData[i] = {paramTitle: poiKeys[ele], paramVal: params[ele]};
            });
            transData.unshift({paramTitle: '名称', paramVal: MD.setting[this.type].text + '详情'});
            const json = {
                data: {
                    lon,
                    lat,
                    poiType: 'extra' + this.type,
                    multiMap: { [areaCode]: transData }
                }
            }
            this.updateParam([ 'selectPoint', { lonlat: [ json.data.lon, json.data.lat ], type: `normal&${this.type}` } ]); // 高亮poi
            this.updateParam([ 'normalPoiDetail', { data: json, type: 'normal', belongTo: 'modelSpecific', selectPoiType: this.type, areaCode } ]);
        },
        /**
         * poi详情与高亮状态传送
         * @param {object} json { 组装过的传送数据, poi详情请求过来的数据 }
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            if (json.hasOwnProperty('data')) {
                this.popStatus = true;
                let mapping = this.poiMapping[this.type];
                if (this.type === 'waterLogging' || this.type === 'fireDanger') {
                    this.packDetailData(json.data[mapping]);
                    this.lastNormalType = this.type;
                }
            }
        },

        close() {
            this.popStatus = false;
            if (this.belongTo === 'model' || this.belongTo === 'modelSpecific') {
                const t = this.callbackActiveType();
                if (t.normal === this.lastNormalType) this.removeSelectPoint('normal', this.lastNormalType);
                this.updateParam([ 'normalPoiDetail', { type: '' } ]);
            }
            this.updateParam([ 'level', { dataString: '' } ]);
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
        this.updateParam([ 'model', { callback: null } ]);
    }
}
</script>
