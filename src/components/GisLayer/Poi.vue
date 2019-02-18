<template>
	<div>
	</div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              Poi list
 * ----------------------------------------------------------------------------
 * close                    - 面板相关poi关闭
 * getPoiDetail             - 获取所点击poi的详情
 * click                    - 统一调用‘getPoiByLonLat.action’的地图点击事件
 * initConstData            - 初始化无需setter的变量
 * initLayer                - 初始化图层
 * callReservoir            - update水库状态、因为水库的图层是在poi图层里面的，所有通过这种方式呼唤水库
 * setPoiType               - 其它页面设置poiType
 */

// 华南水电作了更改，存在业务更改不确定性，后续可放开注释替换
import { mapActions, mapState } from 'vuex';
export default {
    name: 'PoiLayers',
    data() {
        return {
        }
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            poiTypes: state => state.poi.types,
            PARAMS: state => state.poi.PARAMS,
            poiPopCallback: state => state.globalSearch.poiPopCallback,
            setOverlayDetail: state => state.globalSearch.setOverlayDetail,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            normalPoiData: state => state.normalPoiDetail.data,
            belongTo: state => state.normalPoiDetail.belongTo,
            poiTips: state => state.userSetting.poiEnameMapping,
            reservoirActive: state => state.reservoirs.status,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove
        })
    },
    watch: {
        PARAMS() {
            this.initLayer();
        },
        poiTypes() {
            this.initLayer();
            this.close();
        },
        sysTime() {
            this.initLayer();
        },
        code() {
            this.initLayer();
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 面板相关poi关闭、只处理基础数据中的normal与emergency
         */
        close() {
            // this.poiType:当前高亮的poi类型(准确的类型，不是复合类型)
            const poiArr = this.poiTypes.split(',');
            if (!poiArr.includes(this.poiType) && this.poiType) {
                const t = this.callbackActiveType();
                if (t.normal === this.poiType) this.removeSelectPoint('normal', this.poiType);
                this.updateParam([ 'normalPoiDetail', { type: '' } ]);
            }
        },

        /**
         * 更新提示框
         */
        updateTips() {
            const arr = this.poiTypes.split(',');
            const len = arr.length;
            if (!this.poiTips[arr[len - 1]]) return;
            this.updateParam([ 'tip', { poi: { status: true, name: this.poiTips[arr[len - 1]].Name, time: '', ename: this.poiTips[arr[len - 1]].eName } } ]);
        },

        setPoiType(type) {
            this.poiType = type;
        },

        /**
         * 获取所点击poi的详情
         */
        getPoiDetail(lon, lat, clickIndex) {
            utils.clearTimer(this.timer.delayTimer);
            this.timer.delayTimer = window.setTimeout(() => {
                let params = {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    poiTypes: this.poiTypes,
                    code: this.code,
                    lon: lon,
                    lat: lat,
                    zoom: lmap.util.getZoom(lmap.view)
                };
                Object.assign(params, this.PARAMS.params);
                let url = this.PARAMS.detailUrl;
                utils[this.PARAMS.asyncType](url, params).then((json) => {
                    if (!utils.isEmptyObject(json.data)) {
                        // console.info()
                        if (this.reservoirType.includes(json.data.poiType)) return; // 特殊情况、如果水库接口完整后续可cut掉
                        if (json.data.poiType.includes('TYFON') || json.data.poiType.includes('LCD_LED')) { // 大喇叭
                            this.getTyfonDetail(params, clickIndex);
                        } else {
                            this.clickPlugin('normalCallback', json, clickIndex); // 触发poi点击插件
                        }
                    }
                });
            }, 80);
        },

        /**
         * 请求大喇叭详情
         */
        getTyfonDetail(params, clickIndex) {
            utils.GET(this.poiDetailUrls.tyfon, params).then((json) => {
                if (!utils.isEmptyObject(json.data)) {
                    this.clickPlugin('normalCallback', json, clickIndex); // 触发poi点击插件
                }
            });
        },

        /**
         * 请求专家详情(保留以后用)
         */
        getExpertPoiDetail(params, clickIndex) {
            params['poiTypes'] = 'RESCUE_IDEA_EXPERT';
            utils.GET(this.poiDetailUrls.expert, params).then((json) => {
                if (!utils.isEmptyObject(json.data)) {
                    this.clickPlugin('normalCallback', json, clickIndex); // 触发poi点击插件
                }
            });
        },

        /**
         * update水库状态、因为水库的图层是在poi图层里面的，所以通过这种方式呼唤水库
         */
        // callReservoir() {
        //     let t = '';
        //     const t1 = this.poiTypes.split(',');
        //     this.reservoirType.forEach(ele => {
        //         if (t1.includes(ele)) t += ',' + ele;
        //     });
        //     t = t.substr(1);
        //     if (t) this.updateParam([ 'reservoirs', { status: true, type: t } ]);
        //     else this.updateParam([ 'reservoirs', { status: false, type: null } ]);
        // },

        /**
         * poi详情与高亮状态传送
         * @param {object} json { 组装过的传送数据, poi详情请求过来的数据 }
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            let poiDetailType = json.data.poiType || json.data.poiTypes;
            if (poiDetailType.indexOf('EMERGENCY') === -1) {
                poiDetailType = 'normal';
            } else poiDetailType = 'emergency';
            this.poiType = json.data.poiType;
            const areaCode = json.data.areaCode;
            if (this.PARAMS.type !== 'globalSearch') {
                this.updateParam([ 'selectPoint', { lonlat: [ json.data.lon, json.data.lat ], type: `normal&${this.poiType}`, areaCode } ]); // 高亮poi
                this.updateParam([ 'normalPoiDetail', { data: json, type: poiDetailType, belongTo: this.PARAMS.type, selectPoiType: this.poiType, areaCode } ]);
            } else { // GlobalSearch.vue回调
                this.poiPopCallback(json, true, 'BaseInfo');
            }
        },

        /**
         * 统一调用‘getPoiByLonLat.action’的地图点击事件
         *
         * @param {object} e ol参数
         */
        click(e) {
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const clickIndex = this.getClickIndex();
            this.getPoiDetail(lon, lat, clickIndex); // 获取详情
        },

        /**
         * 初始化无需setter的变量
         */
        initConstData() {
            this.updateParam(['clickCallback', { normalCallback: this.carryDataAndStatus }]);
            this.updateParam(['normalPoiDetail', { setPoiType: this.setPoiType }]);
            this.poi = { // 图层传参
                url: '',
                name: 'poi'
            };
            // this.reservoirType = [ 'RESERVOIR', 'GDSYJB_SHUIKU', 'SZ_SHUIKU', 'SG_SHUIKU', 'RESERVOIR_SWJ' ]; // 华南水电 + 水文局 后续华南水电可能更改
            this.reservoirType = [ 'SOUTH_RESERVOIR', 'RESERVOIR_SWJ' ]
            // this.callReservoir();
            this.timer = { delayTimer: null };
            this.layer = null; // 保存model、左侧面板、任意面筛选的图层
            this.poiType = '';
            this.poiDetailUrls = {
                tyfon: sysconfig.TESTPATH + '/basedata/getClimateInfo',
                expert: sysconfig.TESTPATH + '/basedata/getExpertPoiDetail'
            };
        },

        /**
         * 初始化图层
         */
        initLayer() {
            utils.clearTimer(this.timer.delayTimer);
            this.timer.delayTimer = window.setTimeout(() => {
                this.updateTips();
                let params = {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    poiTypes: this.filterReservoirTypesOut(this.poiTypes.split(',')), // 只针对基础数据的水库
                    code: this.code,
                    zoom: lmap.util.getZoom(lmap.view)
                };
                if (!!this.setOverlayDetail && this.poiTypes && this.poiTypes !== ',') this.setOverlayDetail(true);
                const PARAMS = this.PARAMS;
                if (!PARAMS) return;
                this.poi.url = PARAMS.imageUrl;
                Object.assign(params, PARAMS.params);
                this.poi.params = params;
                if (!!this.layer) {
                    lmap.image.updateWMS(this.layer, this.poi, '');
                } else {
                    this.layer = lmap.image.WMS(lmap.map, this.poi, 'poi', '');
                }
            }, 80);
        },

        /**
         * 清除所有poi图层时调用
         */
        clear() {
            if (this.belongTo !== 'modelSpecific' && this.belongTo !== 'live' && this.belongTo !== 'alarm') { // 只针对poi图层
                const t = this.callbackActiveType();
                if (t.normal === this.poiType) this.removeSelectPoint('normal', this.poiType);
                try {
                    // 当正在展示水库类型的信息点详情时，不关闭详情框
                    if (this.reservoirActive) {
                        const type = this.normalPoiData.data.poiType

                        // if (!type.includes('SZ_SHUIKU') && !type.includes('GDSYJB_SHUIKU') && !type.includes('SG_SHUIKU')) { // 后续华南水电可能更改
                        //     this.updateParam([ 'normalPoiDetail', { type: '' } ]);
                        // }
                        if (type !== 'SOUTH_RESERVOIR') {
                            this.updateParam([ 'normalPoiDetail', { type: '' } ]);
                        }
                    } else {
                        throw new Error('CLEAR')
                    }
                } catch (e) {
                    this.updateParam([ 'normalPoiDetail', { type: '' } ]);
                }
            }
            this.updateParam([ 'tip', { poi: { status: null } } ]);
            lmap.map.un('singleclick', this.click);
            if (!!this.timer.delayTimer) window.clearTimeout(this.timer.delayTimer);
            if (!!this.layer) lmap.map.removeLayer(this.layer);
        },

        /*
         * 移除水库相关的类型
         *
         * @param {string[]} types 待筛选的类型
         * @returns {string[]} 筛选后的类型
         */
        filterReservoirTypesOut: function (types) {
            let shuikuIdx = types.findIndex(item => item.includes('SHUIKU') && !item.includes('SZ_SHUIKU') && !item.includes('IDEA_SHUIKU'))

            while (shuikuIdx >= 0) {
                types.splice(shuikuIdx, 1)
                shuikuIdx = types.findIndex(item => item.includes('SHUIKU') && !item.includes('SZ_SHUIKU'))
            }

            let reservoirIdx = types.findIndex(item => item.includes('RESERVOIR'))

            while (reservoirIdx >= 0) {
                types.splice(reservoirIdx, 1)
                reservoirIdx = types.findIndex(item => item.includes('RESERVOIR'))
            }
            return types
        }
    },
    mounted() {
        this.initConstData();
        this.initLayer();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        this.clear();
        if (!!this.setOverlayDetail) this.setOverlayDetail(false);
    }
};
</script>
