<template>
    <div>
        <v-site-panel v-if="panelStatus" @close="panelStatus = false"></v-site-panel>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import SitePanel from '../SubPanel/SitePanel';

export default {
    name: 'Site',
    components: {
        'v-site-panel': SitePanel
    },
    data() {
        return {
            data: null,
            panelStatus: true,
            static: null,
            warnStatic: null,
            imageUrl: '/realTimeMonitor/getSiteImage',
            warnImageUrl: '/realTimeMonitor/getSiteWarnImage',
            // 初始化请求固定
            fixedParam: {
                code: '440000',
                qSelectTime: 0,
                startTime: '20180205110000',
                endTime: '20180206110000',
                rainRangeStart: 0,
                rainRangeEnd: 250
            },
            params: null
        };
    },
    computed: {
        ...mapState({
            sys: state => state.sys,
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 5);
            },
            loadFunc: state => state.time.loadFunc,
            elementType: state => state.site.elementType,
            opacity: state => state.opacity.value,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            staticParams: state => state.site.staticParams,
            removeSelectPoint: state => state.selectPoint.remove,
            code: state => state.sys.code
        })
    },
    watch: {
        code(val) {
            this.fixedParam.code = val;
            this.assignParam(this.fixedParam);
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        },
        sysMinTime() {
            this.params['dateTime'] = TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss');
        },
        elementType() {
            this.params['elementType'] = this.elementType
        },
        staticParams: {
            handler(params) {
                this.assignParam(params);
            },
            deep: true
        },
        params: {
            handler() {
                this.renderStatic();
            },
            deep: true
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        // 合并请求参数
        assignParam(params) {
            this.params = Object.assign({}, {
                dateTime: TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss'),
                CRS: sysconfig.SYSTEM_PROJECTION,
                elementType: this.elementType
            }, params);
        },
        initConstData() {
            this.updateParam(['clickCallback', { SiteCallback: this.carryDataAndStatus }]);
            this.updateParam(['site', { SiteSubPanelCallback: this.supanelCallback }]);
            this.urls = {
                detail: sysconfig.TESTPATH + '/realTimeMonitor/getSiteWindRainInfo'
            };
            this.updateParam([ 'site', { panelCallback: this.showPanel } ]);
            this.layer = null;
            this.timers = {
                flash: null
            }
            this.activeCode = '';
        },
        renderStatic() {
            utils.clearTimer(this.timer);
            this.timer = window.setTimeout(() => {
                // 获取地图动态变量
                const imageParam = lmap.util.getImageParam(this.params, lmap.map);

                if (this.sys.code.length === 4) {
                    imageParam.cityName = this.sys.areaName
                } else if (this.sys.code.length === 6) {
                    imageParam.countyName = this.sys.areaName
                }

                const url = sysconfig.TESTPATH + this.imageUrl + '?' + utils.serializeWithAuth(imageParam);
                const warnUrl = sysconfig.TESTPATH + this.warnImageUrl + '?' + utils.serializeWithAuth(imageParam);
                const extent = lmap.util.getExtent(lmap.map);
                const staticParam = { url, moving: true, extent };
                const warnStaticParam = { url: warnUrl, moving: true, extent }

                if (!!this.static) {
                    lmap.image.updateStatic(this.static, staticParam, 'url');
                    this.static.setOpacity(1);
                } else {
                    this.static = lmap.image.Static(lmap.map, staticParam, 'poi', 'url');
                    this.static.setOpacity(1);
                }

                if (!!this.warnStatic) {
                    lmap.image.updateStatic(this.warnStatic, warnStaticParam, 'url');
                    this.warnStatic.setOpacity(1);
                } else {
                    this.warnStatic = lmap.image.Static(lmap.map, warnStaticParam, 'poi', 'url');
                    this.warnStatic.setOpacity(1);
                }

                this.flashWarnStatic()
            }, 80);
        },
        click(e) {
            const clickIndex = this.getClickIndex();
            const zoom = lmap.util.getZoom(lmap.view) + '';
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const { dateTime, code } = this.params
            const siteId = '';
            let param = {code, dateTime, lon, lat, zoom, siteId};
            utils.GET(this.urls.detail, param).then((json) => {
                let {data} = json;
                let {siteData} = data;
                if (!!siteData && siteData.lon) {
                    siteData.checkTime = dateTime;
                    this.clickPlugin('SiteCallback', siteData, clickIndex); // 触发poi点击插件
                }
            });
        },

        /**
         * 面板点击回调请求数据
         */
        supanelCallback(params) {
            const zoom = lmap.util.getZoom(lmap.view) + '';
            const [ lon, lat, siteId ] = [ params.lon, params.lat, params.siteCode ];
            const { dateTime, code } = this.params;
            let param = {code, dateTime, lon, lat, zoom, siteId};
            utils.GET(this.urls.detail, param).then((json) => {
                let {data} = json;
                let {siteData} = data;
                if (!!siteData && siteData.lon) {
                    json.checkTime = dateTime;
                    this.clickPlugin('SiteCallback', siteData, 'pass'); // 触发poi点击插件
                }
            });
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            this.data = json;
            this.activeCode = json.areaCode;
            this.updateParam([ 'selectPoint', { lonlat: [ json.lon, json.lat ], type: 'monitor&site' } ]);
            this.updateParam([ 'site', {poiData: json} ]);
        },
        load() {
            this.loadFunc('site');
        },
        close() {
            this.removeSelectPoint('monitor', 'site');
            this.updateParam([ 'site', {poiData: null} ]);
        },
        showPanel() {
            this.panelStatus = true;
        },
        removeStatic() {
            if (!!this.static) {
                lmap.map.removeLayer(this.static);
                this.static = null;
            }

            if (this.warnStatic) {
                lmap.map.removeLayer(this.warnStatic);
                this.warnStatic = null;
            }
        },
        flashWarnStatic: function () {
            if (this.timers.flash) {
                window.clearTimeout(this.timers.flash)
                this.timers.flash = null
            }

            if (this.warnStatic) {
                const visibility = this.warnStatic.getVisible()

                this.warnStatic.setVisible(!visibility)
                this.timers.flash = window.setTimeout(() => {
                    this.flashWarnStatic()
                }, 500)
            }
        }
    },
    mounted() {
        this.assignParam(this.fixedParam);
        this.initConstData();
        lmap.map.on('singleclick', this.click);
        lmap.map.on('moveend', this.renderStatic);
        lmap.view.on('change:resolution', this.renderStatic);
    },
    destroyed() {
        lmap.map.un('moveend', this.renderStatic);
        lmap.view.un('change:resolution', this.renderStatic);
        lmap.map.un('singleclick', this.click);
        this.removeStatic()
        this.close();
        this.updateParam([ 'site', { panelCallback: null } ]);
        this.updateParam([ 'site', { staticParams: {} } ]);
        this.params = null;
        utils.clearTimer(this.timer);
        this.updateParam(['site', {elementType: ['wind', 'rain', 'temp'].join(';')}]);
    }
}
</script>
