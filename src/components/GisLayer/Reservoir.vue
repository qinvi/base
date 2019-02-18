<template>
    <div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Reservoir',
    data() {
        return {
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime,
            reservoirType: state => state.SOUTHRESERVOIR.type,
            reservoirsSWJType: state => state.reservoirsSWJ.type,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            normalPoiData: state => state.normalPoiDetail.data,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        }),
        allReservoirTypes() {
            let s = '';
            if (this.reservoirType) s += ',' + this.reservoirType;
            if (this.reservoirsSWJType) s += ',' + this.reservoirsSWJType;
            s = s.substr(1);
            return s;
        }
    },
    watch: {
        allReservoirTypes(val) {
            this.render();
            this.close();
        },
        sysTime() {
            this.render();
            if (!this.params) return
            this.params.dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
            this.getReservoirDetail(this.params, this.getClickIndex());
        },
        code(val) {
            this.render();
            if (this.activeReservoirCode && !this.activeReservoirCode.includes(val)) {
                this.activeReservoirCode = '';
                this.close();
            }
            if (this.activeSwjCode && !this.activeSwjCode.includes(val)) {
                this.activeSwjCode = '';
                this.close();
            }
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.updateParam(['clickCallback', { ReservoirCallback: this.carryDataAndStatus }]);
            this.urls = {
                swjImage: sysconfig.TESTPATH + '/realTimeMonitor/getReservoirImage', // 水文局
                swjDetail: sysconfig.TESTPATH + '/realTimeMonitor/getReservoirInfo',
                southImage: sysconfig.TESTPATH + '/basedata/getPoiImage', // 华南水电
                southDetail: sysconfig.TESTPATH + '/basedata/getPoiDetail',
                detailsOfHighcharts: sysconfig.TESTPATH + '/realTimeMonitor/listWaterAndRainInfo'
            };
            this.lastReserviorType = '';
            this.timer = { swj: null, south: null }
            this.popType = '';
            this.params = null;
            this.swjLayer = null;
            this.southLayer = null;
            this.activeReservoirCode = '';
            this.activeSwjCode = '';
        },

        /**
         * 获取图层参数
         */
        getParams() {
            return {
                url: '',
                params: {
                    code: this.code,
                    poiTypes: '',
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss')
                }
            }
        },

        /**
         * 渲染水文局
         * @param {object} param 参数
         * @param {string} type 类型
         * @param {string} reservoirType 水库类型
         */
        renderFunc(param, type, reservoirType) {
            param.params.poiTypes = reservoirType
            param.url = this.urls[`${type}Image`]
            if (!!this[`${type}Layer`]) {
                lmap.image.updateWMS(this[`${type}Layer`], param, '');
            } else {
                this[`${type}Layer`] = lmap.image.WMS(lmap.map, param, 'poi', '');
            }
        },

        /**
         * 渲染图层
         */
        render() {
            let param = this.getParams();
            if (this.allReservoirTypes.includes('RESERVOIR_SWJ')) this.renderFunc(param, 'swj', 'RESERVOIR_SWJ')
            else {
                lmap.layer.remove(lmap.map, this.swjLayer);
                this.swjLayer = null
            }
            if (this.allReservoirTypes.includes('SOUTH_RESERVOIR')) this.renderFunc(param, 'south', 'SOUTH_RESERVOIR')
            else {
                lmap.layer.remove(lmap.map, this.southLayer);
                this.southLayer = null
            }
        },

        click(e) {
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const zoom = lmap.util.getZoom(lmap.view);
            let params = {
                lon: lon,
                lat: lat,
                zoom: zoom,
                code: this.code,
                dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss')
            }
            this.params = params;
            this.getReservoirDetail(params);
        },

        /**
         * 获取请求数据的详情
         * @param {object} params 参数
         * @param {string} type 类型
         * @param {string} reservoirType 水库类型
         */
        detailFunc(params, type, reservoirType) {
            utils.clearTimer(this.timer[type]);
            this.timer[type] = window.setTimeout(() => {
                let clickIndex = this.getClickIndex();
                if (type === 'swj') params.poiType = reservoirType
                else params.poiTypes = reservoirType;
                utils.GET(this.urls[`${type}Detail`], params).then((json) => {
                    if (!utils.isEmptyObject(json.data)) {
                        json.data.dateTime = TU(params.dateTime).format('YYYY-MM-DD HH:mm');
                        this.clickPlugin('ReservoirCallback', json, clickIndex); // 触发poi点击插件
                    }
                });
            }, 80);
        },

        /**
         * 获取水库详情
         * @param {object} params 水库请求参数
         */
        getReservoirDetail(params) {
            if (this.allReservoirTypes.includes('RESERVOIR_SWJ')) this.detailFunc(params, 'swj', 'RESERVOIR_SWJ')
            if (this.allReservoirTypes.includes('SOUTH_RESERVOIR')) this.detailFunc(params, 'south', 'SOUTH_RESERVOIR')
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            // 水库有3种类型，normal、RESERVOIR、RESERVOIR_SWJ
            this.popType = json.data.poiType;
            // const reservoirsType = [ 'RESERVOIR', 'GDSYJB_SHUIKU', 'SZ_SHUIKU', 'SG_SHUIKU' ];
            // const reservoirsType = 'SOUTH_RESERVOIR'
            this.lastReserviorType = (this.popType === 'RESERVOIR_SWJ') ? 'RESERVOIR_SWJ' : 'SOUTH_RESERVOIR';
            if (json.data.hasOwnProperty('detailMap111')) {
                this.activeReservoirCode = json.data.areaCode;
                this.removeSelectPoint('monitor', this.lastReserviorType);
                this.updateParam(['normalPoiDetail', {
                    data: json,
                    type: 'normal',
                    areaCode: json.data.areaCode,
                    selectPoiType: this.lastReserviorType
                }]);
                this.updateParam(['reservoirDetails', { data: null, type: null }]);
                this.updateParam([ 'selectPoint', { // 特殊水库
                    lonlat: [ json.data.lon, json.data.lat ],
                    type: `normal&${this.lastReserviorType}`
                } ]);
                // if (reservoirsType.includes(this.popType)) this.updateParam(['reservoirs', {detail: false}]);
            } else {
                this.updateParam(['selectPoint', {
                    lonlat: [ json.data.lon, json.data.lat ],
                    type: `monitor&${this.lastReserviorType}`,
                    areaCode: json.data.areaCode
                }])
                let type = '';
                if (json.data.poiType === 'RESERVOIR_SWJ') {
                    type = 'reservoirsSWJ';
                    this.activeReservoirCode = json.data.areaCode;
                } else {
                    type = 'SOUTHRESERVOIR';
                    this.activeSwjCode = json.data.areaCode;
                    const activeType = this.callbackActiveType();
                    if (activeType['normal'] === 'RESERVOIR') {
                        const t = this.callbackActiveType();
                        if (t.normal === 'RESERVOIR') this.removeSelectPoint('normal', 'RESERVOIR');
                        this.updateParam(['normalPoiDetail', { type: '' }]);
                    }
                }
                this.updateParam([[type], {detail: true}]);
                this.updateParam(['reservoirDetails', {data: json, type: type}]);
            }
        },

        /**
         * poi取消勾选
         */
        close() {
            const allTypes = this.allReservoirTypes.split(',');
            const type = this.callbackActiveType();
            if (!allTypes.includes('SOUTH_RESERVOIR')) {
                this.removeSelectPoint('monitor', 'SOUTH_RESERVOIR');
                this.updateParam(['SOUTHRESERVOIR', {detail: false}]);
                if (type.normal === 'RESERVOIR') {
                    this.updateParam(['normalPoiDetail', {type: ''}]);
                    this.removeSelectPoint('normal', 'RESERVOIR');
                }
            }
            if (!allTypes.includes('RESERVOIR_SWJ')) {
                this.removeSelectPoint('monitor', 'RESERVOIR_SWJ');
                this.updateParam(['reservoirsSWJ', {detail: false}]);
            }
        }
    },
    mounted() {
        lmap.map.on('singleclick', this.click);
        this.initConstData();
        this.render();
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.swjLayer);
        lmap.layer.remove(lmap.map, this.southLayer);
        this.close();
    }
}
</script>
