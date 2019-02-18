<template>
    <div></div>
</template>

<script>
import { mapState } from 'vuex';
export default {
    name: 'WaterSystem',
    data() {
        return { }
    },
    computed: {
        ...mapState({})
    },
    methods: {
        initWMTS() {
            let extent = ol.proj.get(sysconfig.SYSTEM_PROJECTION).getExtent();
            let size = ol.extent.getWidth(extent) / 256; // 512
            let resolutions = [];
            let matrixIds = [];
            for (let z = 0; z < 14; ++z) {
                resolutions[z] = size / Math.pow(2, z);
                matrixIds[z] = z;
            }
            this.layer = new ol.layer.Tile({
                source: new ol.source.WMTS({
                    url: 'http://10.148.10.131:9080/zs/data/Tdt/TdtWater/wmts',
                    layer: '0',
                    matrixSet: 'default028mm',
                    format: 'image/png',
                    style: 'default',
                    wrapX: true,
                    projection: sysconfig.SYSTEM_PROJECTION,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: [-20037508.34278924, 20037508.34278924],
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    })
                })
            });
            lmap.map.addLayer(this.layer);
        }
    },
    mounted() {
        this.initWMTS();
    },
    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
    }
}
</script>
