<template>
    <div></div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Cloud',
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            opacity: state => state.opacity.value,
            code: state => state.sys.code
        })
    },
    watch: {
        sysTime() {
            this.getParam();
            this.render();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            lmap.map.on('moveend', this.changeLayer);
            lmap.view.on('change:resolution', this.changeLayer);
            this.signObj = utils.generateAuthInfo();
            const { BBOX, WIDTH, HEIGHT, ZOOM } = lmap.util.getImageParam({}, lmap.map);
            this.param = {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getCloudImage',
                name: 'gpf',
                extent: [89.9999999874719, 0, 139.9513499805186, 39.947494995342595],
                params: {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    code: this.code,
                    signTime: this.signObj['signTime'],
                    sign: this.signObj['sign'],
                    CRS: sysconfig.SYSTEM_PROJECTION,
                    BBOX,
                    ZOOM,
                    WIDTH,
                    HEIGHT
                }
            }
            this.layer = null;
        },

        /**
         * 接口参数获取
         */
        getParam() {
            this.signObj = utils.generateAuthInfo();
            const { signTime, sign } = this.signObj;
            const { BBOX, WIDTH, HEIGHT, ZOOM } = lmap.util.getImageParam({}, lmap.map);
            const dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
            const code = this.code;
            const CRS = sysconfig.SYSTEM_PROJECTION;
            this.param.params = { signTime, sign, dateTime, code, BBOX, ZOOM, CRS, WIDTH, HEIGHT };
        },
        /**
         * 渲染图层
         */
        render() {
            if (!!this.layer) {
                lmap.image.updateStatic(this.layer, this.param, '');
                this.layer.setOpacity(this.opacity);
            } else {
                this.layer = lmap.image.Static(lmap.map, this.param, 'model', '');
                this.layer.setOpacity(this.opacity);
                this.updateParam([ 'cloud', { callback: this.setLayerOpacity } ]);
            }
        },

        /**
         * 拖动地图加载图层
         */
        changeLayer() {
            this.getParam();
            this.render();
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
        this.render();
    },
    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
        this.updateParam([ 'cloud', { callback: null } ]);
    }
}
</script>
