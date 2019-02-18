<template>
    <v-agr v-if="!!data" :data="data" @close="close"></v-agr>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Agr from '../PopupBox/Agr'
export default {
    name: 'Agr',
    components: { 'v-agr': Agr },
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
            this.updateParam(['clickCallback', { AgrCallback: this.carryDataAndStatus }]);
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
                url: sysconfig.TESTPATH + '/realTimeMonitor/getAgrImage',
                params: {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    code: this.code
                }
            }
        },
        click(e) {
            const clickIndex = this.getClickIndex();
            const zoom = lmap.util.getZoom(lmap.view);
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const { dateTime, code } = this.getParam().params;
            const param = { dateTime, code, lon, lat, zoom };
            let url = sysconfig.TESTPATH + '/realTimeMonitor/getAgrInfo';
            utils.GET(url, param).then((json) => {
                if (json.hasOwnProperty('data')) {
                    this.clickPlugin('AgrCallback', json.data.agrInfo, clickIndex); // 触发poi点击插件
                }
            });
        },
        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            json.typeInfo.map(function(el) {
                el.status = false;
                return el;
            });
            this.data = json;
            const { lon, lat, areaCode } = json;
            this.activeCode = areaCode;
            this.updateParam([ 'selectPoint', { lonlat: [ lon, lat ], type: 'monitor&Agr' } ]);
        },
        close() {
            this.data = null;
            this.removeSelectPoint('monitor', 'Agr');
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
