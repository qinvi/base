<template>
    <div></div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Radar',
    data() {
        return {
            type: true // true:>20170901, false < 20170901
        }
    },
    computed: {
        ...mapState({
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 6);
            },
            ddt: state => state.time.sysMinTime,
            loadFunc: state => state.time.loadFunc,
            opacity: state => state.opacity.value,
            areaName: state => state.sys.areaName,
            radar: state => state.radar.status,
            code: state => state.sys.code,
            sysTime: state => state.time.sysMinTime
        })
    },
    watch: {
        sysMinTime(val, prevVal) {
            // if (!prevVal || (val.getTime() !== prevVal.getTime())) {
            this.render();
            // }
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.urls = {
                radar: sysconfig.TESTPATH + '/realTimeMonitor/getRadarApiImage',
                lastRadar: sysconfig.TESTPATH + '/realTimeMonitor/getRadarImage'
            };
            this.param = {
                url: '',
                moving: true,
                extent: [107.2, 18.17, 119.98, 27.7]
            }
            this.layer = null;
        },

        loadWms(params) {
            let param = {};
            param.url = this.urls.lastRadar;
            param.params = params;
            if (this.type) {
                lmap.map.removeLayer(this.layer);
                this.layer = null; // > 20170901
            }
            if (!!this.layer) {
                lmap.image.updateWMS(this.layer, param);
                this.layer.setOpacity(this.opacity);
            } else {
                this.layer = lmap.image.WMS(lmap.map, param, 'impact');
                this.layer.setOpacity(this.opacity);
                this.updateParam([ 'radar', { callback: this.setLayerOpacity } ]);
            }
            this.type = false;
            const time = TU(this.sysMinTime).format('YYYY年MM月DD日HH时mm分');
            const typeStr = '外推';
            this.updateParam([ 'tip', { poi: { status: true, name: '雷达图' + typeStr, time, ename: 'THE 3KM CAPPI RADAR MOSAIC' } } ]);
        },

        /**
         * 图层渲染
         */
        render(e) {
            const { checkTime, dateTime } = this.getTime(this.sysMinTime);
            const { BBOX, WIDTH, HEIGHT, ZOOM } = lmap.util.getImageParam({}, lmap.map);
            const EXTENT = lmap.util.getExtent(lmap.map).join(',');
            let param;
            if (!this.radar) return;
            if (TU(dateTime).format('YYYYMMDDHHmmss') < 20170901000000) {
                param = { dateTime, checkTime, type: 'ref', code: this.code };
                this.loadWms(param);
            } else {
                // if (!e || (e && e.type !== 'moveend')) {
                //     const time = TU(this.sysMinTime).format('YYYY年MM月DD日HH时mm分');
                //     console.log('外推');
                //     this.updateParam([ 'tip', { poi: { status: true, name: '雷达图外推', time, ename: 'THE 3KM CAPPI RADAR MOSAIC' } } ]);
                // }
                utils.clearTimer(this.lazyTimer);
                this.lazyTimer = window.setTimeout(() => {
                    if (!this.radar) return;
                    const url = this.urls.radar;
                    param = { dateTime, checkTime, CRS: sysconfig.SYSTEM_PROJECTION, WIDTH, HEIGHT, ZOOM, opacity: 255, code: this.code, format: 'json', BBOX, EXTENT };
                    utils.GET(url, param).then((json) => {
                        if (json.status !== 500) {
                            param.url = 'data:image/png;base64,' + json.data.imgBase64;
                            param.moving = true;
                            param.extent = lmap.util.getExtent(lmap.map);
                            let source = null;
                            // if (!this.type) {
                            //     lmap.map.removeLayer(this.layer);
                            //     this.layer = null;
                            // }
                            // console.log('更新map图片')
                            if (!!this.layer) {
                                source = lmap.image.updateStatic(this.layer, param, 'url');
                                this.layer.setOpacity(this.opacity);
                            } else {
                                this.layer = lmap.image.Static(lmap.map, param, 'impact', 'url');
                                this.layer.setOpacity(this.opacity);
                                source = this.layer.getSource();
                                this.updateParam([ 'radar', { callback: this.setLayerOpacity } ]);
                            }
                            this.type = true;
                            source.on('imageloadend', this.load);
                            source.on('imageloaderror', this.load);
                            if (!e || (e && e.type !== 'moveend')) {
                                const time = TU(this.sysMinTime).format('YYYY年MM月DD日HH时mm分');
                                const typeStr = (json.data.dataMissing === 'false') ? '实况' : '外推';
                                this.updateParam([ 'tip', { poi: { status: true, name: '雷达图' + typeStr, time, ename: 'THE 3KM CAPPI RADAR MOSAIC' } } ]);
                            }
                        } else {
                            if (!e || (e && e.type !== 'moveend')) {
                                const time = TU(this.sysMinTime).format('YYYY年MM月DD日HH时mm分');
                                this.updateParam([ 'tip', { poi: { status: true, name: '雷达', time, ename: 'THE 3KM CAPPI RADAR MOSAIC' } } ]);
                            }
                            lmap.map.removeLayer(this.layer);
                            this.layer = null;
                        }
                    });
                }, 150);
            }
        },
        load() {
            // console.log('图片加载完毕！');
            this.loadFunc('radar');
        },

        /**
         * 获取dateTime和checkTime
         * @param {string} 当前时间轴时间
         */
        getTime(date) {
            const curr = new Date();
            const min = TU(curr).min(-9).getDate().getMinutes();
            const nextMin = Number.parseInt(min / 6) * 6;
            const checkTime = TU(curr).setMin(nextMin).format('YYYY-MM-DD HH:mm:00');
            const dateTime = TU(date).format('YYYY-MM-DD HH:mm:ss');
            return { checkTime, dateTime };
        },

        /**
         * 返回参数
         */
        getParam() {
            const { checkTime, dateTime } = this.getTime(this.sysMinTime);
            const { BBOX, WIDTH, HEIGHT, ZOOM } = lmap.util.getImageParam({}, lmap.map);
            const EXTENT = lmap.util.getExtent(lmap.map).join(',');
            if (TU(dateTime).format('YYYYMMDDHHmmss') < 20170901000000) {
                return { dateTime, checkTime, type: 'ref', code: this.code };
            } else {
                return { dateTime, checkTime, CRS: sysconfig.SYSTEM_PROJECTION, WIDTH, HEIGHT, ZOOM, opacity: 255, code: this.code, format: 'json', BBOX, EXTENT };
            }
        },
        /**
         * 修改图层透明度
         */
        setLayerOpacity(val) {
            if (!!this.layer) this.layer.setOpacity(val);
        }
    },
    mounted() {
        this.initConstData();
        lmap.map.on('moveend', this.render);
        lmap.view.on('change:resolution', this.render);
    },
    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
        lmap.map.un('moveend', this.render);
        lmap.view.un('change:resolution', this.render);
        this.updateParam([ 'tip', { poi: { status: null } } ]);
    }
}
</script>
