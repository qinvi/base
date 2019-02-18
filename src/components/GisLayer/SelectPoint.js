import { mapActions, mapState } from 'vuex';

export default {
    name: 'SelectedPoint',
    template: `<div></div>`,
    computed: {
        ...mapState({
            lonlat: state => state.selectPoint.lonlat,
            type: state => state.selectPoint.type
        })
    },
    data() {
        return {
        };
    },
    watch: {
        lonlat: function (val) {
            if (val) this.select();
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化打点图层
         */
        initConstData() {
            this.activeType = {
                monitor: {},
                normal: ''
            }
            this.layer = lmap.layer.init(lmap.map, 'active');
            this.updateParam(['selectPoint', { remove: this.remove, callbackActiveType: this.callbackActiveType }]);
        },

        /**
         * 打点
         */
        select() {
            const style = {
                isIcon: true,
                icon: {
                    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVR42u3XsQkAQAgEweu/aW3BT0T4WTCVycRUUpPJY+O9ZwBZDgAA4A5AkiTXEAAA4PvvuAGFpx7wVLPmGgAAAABJRU5ErkJggg==',
                    author: [0.5, 0.5],
                    size: [32, 32],
                    scale: 0.75
                }
            };
            const feature = lmap.icon.add(this.layer, style, this.lonlat);

            const type = this.type.split('&');
            this.remove(type[0], type[1]);
            feature.set(type[1], true);
            if (type[0] === 'monitor') this.activeType[type[0]][type[1]] = type[1];
            else this.activeType[type[0]] = type[1];
        },

        /**
         * 查看当前active类型
         */
        callbackActiveType() {
            return this.activeType;
        },

        /**
         * 删除图层
         * @param {string} type monitor/normal
         * @param {string} poiType
         */
        remove(type, poiType) {
            if (type === 'monitor') {
                if (!!this.activeType[type][poiType]) lmap.icon.clearType(this.layer, poiType);
                delete this.activeType[type][poiType];
            } else { // type === normal
                if (!!this.activeType[type]) {
                    lmap.icon.clearType(this.layer, this.activeType[type]);
                    this.activeType[type] = '';
                }
            }
        }
    },

    mounted() {
        this.initConstData();
    },

    destroyed() {
        lmap.map.removeLayer(this.layer);
    }
}
