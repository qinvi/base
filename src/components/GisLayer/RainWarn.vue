<template>
    <div></div>
</template>

<script>

import { mapActions, mapState } from 'vuex';

export default {
    data() {
        return {
            layer: null,
            wktUrl: sysconfig.TESTPATH + '/realTimeMonitor/getRainWarnInfo'
        }
    },
    computed: {
        ...mapState({
            sysTime: state => {
                return TU(state.time.sysTime).format('YYYY-MM-DD HH:00:00')
            },
            code: state => state.sys.code
        })
    },
    watch: {
        sysTime() {
            this.initWMS();
        },
        code() {
            this.initWMS();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        // 加载图层
        initWMS() {
            this.clear();
            let style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(224, 76, 56, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                })
            });
            utils.GET(this.wktUrl, {dateTime: this.sysTime, code: this.code}).then(({data: {warnList: db}}) => {
                if (db.length === 0) return;
                db.forEach((data, index) => {
                    let {geom, code} = data;
                    let [feature] = lmap.polygon.addWKT(geom);
                    feature.set('code', code);
                    feature.set('name', 'rainwarn');
                    feature.setStyle(style);
                    this.layer.getSource().addFeature(feature);
                });
            });
        },
        // 清除图层
        clear() {
            lmap.draw.clear(this.layer);
            this.updateParam([ 'rainWarn', {poiStatus: false} ]);
        },
        // 单击地图交互事件
        clickEvt(evt) {
            this.updateParam([ 'rainWarn', {poiStatus: false} ]);
            let feature = lmap.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                return feature;
            });
            if (!!feature && feature.get('name') === 'rainwarn') {
                this.updateParam([ 'rainWarn', {poiStatus: true} ]);
                this.updateParam([ 'rainWarn', {pix: evt.pixel} ]);
                this.updateParam([ 'rainWarn', {areaCode: feature.get('code')} ]);
            } else {
                this.updateParam([ 'rainWarn', {poiStatus: false} ]);
            }
        }
    },
    mounted() {
        this.layer = lmap.layer.init(lmap.map, 'impact');
        this.initWMS();
        lmap.map.on('singleclick', this.clickEvt);
    },
    destroyed() {
        lmap.map.removeLayer(this.layer);
        lmap.map.un('singleclick', this.clickEvt);
        this.updateParam([ 'rainWarn', {poiStatus: false} ]);
    }
}
</script>
