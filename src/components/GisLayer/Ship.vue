<template>
    <div>
        <v-ship v-if="!!data && newData1" :data="data"  :newdata="newdata" @close="close"></v-ship>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Ship from '../PopupBox/Ship'
export default {
    name: 'Ship',
    components: { 'v-ship': Ship },
    data() {
        return {
            data: null,
            newdata: false,
            newData1: false
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            dateTime: state => state.ship.dateTime,
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 10);
            },
            normalPoiType: state => state.normalPoiDetail.type,
            loadFunc: state => state.time.loadFunc,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            removeSelectPoint: state => state.selectPoint.remove,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        normalPoiType(val) {
            // console.info(val);
        },
        dateTime(val, prevVal) {
            this.render(val);
        },
        sysMinTime(val, prevVal) {
            this.render(val);
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.updateParam(['clickCallback', { ShipCallback: this.carryDataAndStatus }]);
            this.urls = {
                detail: sysconfig.TESTPATH + '/realTimeMonitor/getShipInfo',
                location: sysconfig.TESTPATH + '/realTimeMonitor/getShipPositionInfo'
            };
            this.layer = null;
            this.ship = { dateTime: null, mmsi: null };
        },

        render(time) {
            const date = new Date(time.getTime() + 1000 * 60 * 60)
            const tipTime = TU(time).format('YYYY年MM月DD日HH时') + ' - ' + TU(date).format('YYYY年MM月DD日HH时')
            this.updateParam([ 'tip', { poi: { status: true, name: '船舶', time: tipTime, ename: 'SHIPS' } } ]);
            this.lazyTimer = utils.clearTimer(this.lazyTimer);
            this.lazyTimer = window.setTimeout(() => {
                const param = this.getParam(time);
                this.ship.dateTime = param.params.dateTime;
                if (!!this.layer) {
                    lmap.image.updateWMS(this.layer, param);
                } else {
                    this.layer = lmap.image.WMS(lmap.map, param, 'poitop');
                    this.layer.getSource().on('imageloadend', this.load);
                    this.layer.getSource().on('imageloaderror', this.load);
                }
                if (!!this.ship.mmsi) this.location();
            }, 80);
        },

        getParam(time) {
            return {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getShipImage',
                params: { code: this.code, dateTime: TU(time).format('YYYY-MM-DD HH:mm:ss') }
            }
        },

        click(e) {
            const clickIndex = this.getClickIndex();
            const zoom = lmap.util.getZoom(lmap.view);
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const param = { code: this.code, dateTime: TU(this.ship.dateTime).format('YYYY-MM-DD HH:mm:ss'), lon, lat, zoom };
            utils.GET(this.urls.detail, param).then((json) => {
                if (!!json.data.ship.mmsi) {
                    this.newdata = false;
                    this.newData1 = true;
                    this.clickPlugin('ShipCallback', json.data.ship, clickIndex); // 触发poi点击插件
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
            const { lon, lat, mmsi, areaCode } = json;
            this.ship.mmsi = mmsi;
            this.updateParam([ 'selectPoint', { lonlat: [ lon, lat ], type: 'monitor&ship', areaCode } ]);
        },

        location() {
            const param = this.ship;
            utils.GET(this.urls.location, param).then((json) => {
                this.removeSelectPoint('monitor', 'ship');
                if (!!json.data.ship.mmsi) {
                    this.data = json;
                    this.newdata = true;
                    this.newData1 = true;
                    const clickIndex = this.getClickIndex();
                    this.clickPlugin('ShipCallback', json.data.ship, clickIndex); // 触发poi点击插件
                } else {
                    this.newdata = false;
                    this.newData1 = false;
                    this.removeSelectPoint('monitor', 'ship');
                    this.data = null;
                }
            });
        },

        load() {
            this.loadFunc('ship');
        },

        close() {
            this.data = null;
            this.ship.mmsi = null;
            this.removeSelectPoint('monitor', 'ship');
        }
    },
    mounted() {
        this.initConstData();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.layer);
        this.close();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
</style>
