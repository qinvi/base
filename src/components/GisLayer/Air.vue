<template>
    <div>
        <v-air v-if="!!data" :data="data" @close="close"></v-air>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Air from '../PopupBox/Air'
export default {
    name: 'Air',
    components: { 'v-air': Air },
    data() {
        return {
            data: null
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            removeSelectPoint: state => state.selectPoint.remove
        })
    },
    watch: {
        sysTime() {
            this.render();
            if (!!this.paramsEd) this.paramsEd.dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');

            if (this.data) {
                this.sysTimePoi();
            }
        },
        code(val) {
            this.render();
            if (this.activeCode && !this.activeCode.includes(val)) {
                this.close();
            }
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.layer = null;
            this.updateParam(['clickCallback', { AirCallback: this.carryDataAndStatus }]);
            this.paramsEd = null;
            this.activeCode = '';
        },
        render() {
            const param = this.getParam();
            if (!!this.layer) {
                lmap.image.updateWMS(this.layer, param, '');
            } else {
                this.layer = lmap.image.WMS(lmap.map, param, 'poi', '');
            }
        },
        getParam() {
            return {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getAirqImage',
                params: {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    code: this.code
                }
            }
        },
        click(e) {
            const zoom = lmap.util.getZoom(lmap.view);
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const { dateTime, code } = this.getParam().params;
            const param = { dateTime, code, lon, lat, zoom };
            this.sysTimePoi(param);
        },

        /**
         * 获取详情
         */
        sysTimePoi(param = this.paramsEd) {
            const clickIndex = this.getClickIndex();
            let url = sysconfig.TESTPATH + '/realTimeMonitor/getAirqInfo';
            utils.GET(url, param).then((json) => {
                if (json.hasOwnProperty('data') && json.data.airData.length) {
                    this.paramsEd = param;
                    this.clickPlugin('AirCallback', json.data.airData, clickIndex); // 触发poi点击插件
                }
            });
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            this.data = json[0];
            if (this.data.aqi === '0') {
                this.data.aqi = '--';
            }
            if (this.data.co === '0.0') {
                this.data.co = '--';
            }
            if (this.data.quality === null || this.data.quality === '') {
                this.data.quality = '--';
            }
            if (this.data.co === '0.0') {
                this.data.co = '--';
            }
            if (this.data.co24h === '0.0') {
                this.data.co24h = '--';
            }
            if (this.data.so2 === '0') {
                this.data.so2 = '--';
            }
            if (this.data.so2_24h === '0') {
                this.data.so2_24h = '--';
            }
            if (this.data.no2 === '0') {
                this.data.no2 = '--';
            }
            if (this.data.no2_24h === '0') {
                this.data.no2_24h = '--';
            }
            if (this.data.o3 === '0') {
                this.data.o3 = '--';
            }
            if (this.data.o3_8h === '0') {
                this.data.o3_8h = '--';
            }
            if (this.data.o3_8h_24h === '0') {
                this.data.o3_8h_24h = '--';
            }
            if (this.data.pm2_5 === '0') {
                this.data.pm2_5 = '--';
            }
            if (this.data.pm2_5_24h === '0') {
                this.data.pm2_5_24h = '--';
            }
            if (this.data.pm10 === '0') {
                this.data.pm10 = '--';
            }
            if (this.data.pm10_24h === '0') {
                this.data.pm10_24h = '--';
            }
            const { lon, lat, areaCode } = json[0];
            this.updateParam([ 'selectPoint', { lonlat: [ lon, lat ], type: 'monitor&Air' } ]);
            this.activeCode = areaCode;
        },
        close() {
            this.data = null;
            this.removeSelectPoint('monitor', 'Air');
        }
    },
    mounted() {
        this.initConstData();
        this.render();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.layer);
        this.close();
    }
}
</script>
