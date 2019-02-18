<template>
    <div class="grid-rain" v-show="status" ref="rain-panel">
        <div class="title" ref="rain-title" :title="address">雨量统计：{{ address }}</div>
        <a class="close" @click="close"></a>
        <v-rain-chart :data="rainData"></v-rain-chart>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import RainChart from '../Plugins/RainChart';
export default {
    name: 'GridRain',
    data() {
        return {
            status: false,
            address: '',
            rainData: {},
            lonlat: ''
        };
    },
    components: { 'v-rain-chart': RainChart },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    watch: {
        sysTime() {
            this.getRain(this.lonlat[0], this.lonlat[1]);
        },
        bigScreen() {
            if (this.bigScreen) {
                this.rainData.detail.height = 350;
            } else {
                this.rainData.detail.height = 250;
            }
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        initConstData() {
            this.drawParam = null;
            this.handle = null;
            this.layer = null;
            this.style = {
                isIcon: true,
                icon: {
                    src: `${sysconfig.TESTIP}/topic/little/necImage/rain.png`,
                    anchor: [ 0.2, 0.8 ],
                    size: [ 50, 50 ],
                    scale: 0.6
                },
                text: {
                    text: '',
                    size: '12px',
                    offsetY: 15,
                    fill: {
                        color: '#ED3F2B',
                        width: 1
                    }
                }
            };
        },

        close() {
            this.status = false;
            this.cancel();
            this.updateParam([ 'toolsBar', { gridRain: false } ]);
        },

        /**
         * 选择地图打点
         */
        init() {
            this.cancel();
            if (!this.drawParam) {
                this.initLayer();
            }
            const event = { end: (e) => {
                const style = Object.assign({}, this.style);
                style.text.text = '';
                e.feature.setStyle(lmap.style.getStyle(style));
                this.location(e.feature);
            }};
            const eventParam = { map: lmap.map };
            this.handle = lmap.draw.initHandle(this.drawParam, 'point', event, eventParam, this.style);
        },

        /**
         * 初始化图层
         */
        initLayer() {
            let drawParam = lmap.layer.initDrawParam(lmap.map, 'poitop');
            this.drawParam = drawParam;
        },

        /**
         * 取消画笔
         * @param {object} feature 要素对象
         */
        cancel() {
            if (!!this.handle) {
                lmap.draw.cancel(lmap.map, this.handle);
                this.handle = null;
            }
        },

        location(feature) {
            feature.setStyle(lmap.style.getStyle(this.style));
            if (!!this.drawParam.layer) lmap.icon.clear(this.drawParam.layer);
            let point = lmap.polygon.getWKT(feature);
            const [ lon, lat ] = point.replace('POINT(', '').replace(')', '').split(' ');
            const location = { lonlat: lon + ' ' + lat, type: 'village', code: '' };
            this.status = true;
            utils.GET(`${sysconfig.TESTPATH}/girdrain/getLocation`, location).then((json) => {
                let address = json.data.fullName || '';
                this.address = `${address}(${Number(lon).toFixed(2)}, ${Number(lat).toFixed(2)})`;
                const style = Object.assign({}, this.style);
                style.text.text = address;
                feature.setStyle(lmap.style.getStyle(style));
            });
            this.lonlat = [lon, lat];
            this.getRain(lon, lat);
        },

        changeData(data) {
            const past1hour = (data['qpe'].rain01Hour === 0 || data['qpe'].rain01Hour === 9999) ? '' : parseFloat(data['qpe'].rain01Hour);
            const past3hour = (data['qpe'].rain03Hour === 0 || data['qpe'].rain03Hour === 9999) ? '' : parseFloat(data['qpe'].rain03Hour);
            const past6hour = (data['qpe'].rain06Hour === 0 || data['qpe'].rain06Hour === 9999) ? '' : parseFloat(data['qpe'].rain06Hour);
            const past12hour = (data['qpe'].rain12Hour === 0 || data['qpe'].rain12Hour === 9999) ? '' : parseFloat(data['qpe'].rain12Hour);
            const past24hour = (data['qpe'].rain24Hour === 0 || data['qpe'].rain24Hour === 9999) ? '' : parseFloat(data['qpe'].rain24Hour);

            const future1hour = (data['qpf'].rain01Hour === 0 || data['qpf'].rain01Hour === 9999) ? '' : parseFloat(data['qpf'].rain01Hour);
            const future3hour = (data['qpf'].rain03Hour === 0 || data['qpf'].rain03Hour === 9999) ? '' : parseFloat(data['qpf'].rain03Hour);
            const future24hour = (data['day'].rain24Hour === 0 || data['day'].rain24Hour === 9999) ? '' : parseFloat(data['day'].rain24Hour);
            const future48hour = (data['day'].rain48Hour === 0 || data['day'].rain48Hour === 9999) ? '' : parseFloat(data['day'].rain48Hour);
            const future72hour = (data['day'].rain72Hour === 0 || data['day'].rain72Hour === 9999) ? '' : parseFloat(data['day'].rain72Hour);
            const past = [ past24hour, past12hour, past6hour, past3hour, past1hour, '', '', '', '', '', '' ];
            const future = [ '', '', '', '', '', '', future1hour, future3hour, future24hour, future48hour, future72hour ];

            const maxArr = [ past24hour, past12hour, past6hour, past3hour, past1hour, future1hour, future3hour, future24hour, future48hour, future72hour ].map(item => isNaN(item) ? null : item);
            const max = Math.max.apply(null, maxArr);
            return { past, future, max };
        },
        getRain (lon, lat) {
            const rain = { lon, lat, type: 'all', dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') };
            utils.GET(`${sysconfig.TESTPATH}/girdrain/getRain`, rain).then((json) => {
                const { past, future, max } = this.changeData(json.data);
                this.rainData = {
                    detail: {
                        height: this.bigScreen === true ? 350 : 250,
                        xAxis: ['-24h', '-12h', '-6h', '-3h', '-1h', '现在', '1h', '3h', '24h', '48h', '72h'],
                        showInLegend: true,
                        max: max
                    },
                    list: { past, future }
                };
            });
        }
    },
    mounted() {
        this.initConstData();
        this.init();
        WD.init(this.$refs['rain-title'], this.$refs['rain-panel'], lmap.map);
    },
    destroyed() {
        this.close();
        lmap.layer.remove(lmap.map, this.drawParam.layer);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.grid-rain {
    position: fixed;
    top: @top-normal;
    right: 0;
    z-index: @pop-index;
    width: 400px;
    box-shadow: @shadow;
    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        padding-right: 5%;
    }
}
.big {
    .grid-rain {
        top: @top-big;
        width: 600px;
    }
}
</style>
