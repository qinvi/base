<template>
    <div>
        <!-- <v-geologic-hazard v-if="!!data" :data="data" @close="close"></v-geologic-hazard> -->
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import GeologicHazard from '../PopupBox/GeologicHazard'
export default {
    name: 'GeologicHazard',
    components: { 'v-geologic-hazard': GeologicHazard },
    data() {
        return {
            data: null
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            type: state => state.normalPoiDetail.type,
            sysTime: state => state.time.sysTime,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove
        })
    },
    watch: {
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
            this.updateParam([ 'tip', { poi: { status: true, name: '广东省地质灾害分布图', time: '', ename: '' } } ]);
            this.updateParam(['clickCallback', { geologicHazardCallback: this.carryDataAndStatus }]);
            this.layer = null;
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
                url: sysconfig.TESTPATH + '/basedata/getGeogolyImage',
                params: {
                    code: this.code,
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss')
                }
            }
        },
        click(e) {
            const clickIndex = this.getClickIndex();
            const zoom = lmap.util.getZoom(lmap.view);
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const param = { code: this.code, lon, lat, zoom };
            let url = sysconfig.TESTPATH + '/basedata/getGeologyInfo';
            utils.GET(url, param).then((json) => {
                if (Object.keys(json.data).length > 1) this.clickPlugin('geologicHazardCallback', json, clickIndex);
            });
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            this.data = json;
            const { lon, lat, areaCode } = json.data;
            this.updateParam(['normalPoiDetail', {data: json, type: 'geologicHazard'}]);
            this.updateParam([ 'selectPoint', { lonlat: [ lon, lat ], type: 'normal&geologicHazard' } ]);
            this.activeCode = areaCode;
        },
        close() {
            this.data = null;
            const t = this.callbackActiveType();
            if (t.normal === 'geologicHazard') this.removeSelectPoint('normal', 'geologicHazard');
            this.updateParam(['normalPoiDetail', {type: ''}]);
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
        this.updateParam([ 'tip', { poi: { status: null } } ]);
    }
}
</script>
