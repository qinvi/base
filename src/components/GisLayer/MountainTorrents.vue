<template>
    <div></div>
</template>

<script>
import { mapActions } from 'vuex';
export default {
    name: 'MountainTorrents',
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.staticParam = {
                url: sysconfig.IP + '/topic/flood.png',
                name: 'model',
                extent: [106.89, 14.72, 121.11, 25.98],
                params: { }
            }
            this.static = null;
        },

        /**
         * 渲染山洪沟
         */
        renderStatic() {
            if (!!this.static) {
                lmap.image.updateStatic(this.static, this.staticParam);
            } else {
                this.static = lmap.image.Static(lmap.map, this.staticParam, 'model');
            }
        },

        /**
         * 删除山洪沟
         */
        removeStatic() {
            if (!!this.static) {
                lmap.map.removeLayer(this.static);
                this.static = null;
            }
        }
    },
    mounted() {
        this.initConstData();
        this.renderStatic();
        this.updateParam([ 'tip', { poi: { status: true, name: '广东省山洪沟分布图', time: '', ename: 'MOUNTAIN WATERSHEDS' } } ]);
    },
    destroyed() {
        this.removeStatic();
        this.updateParam([ 'tip', { poi: { status: null } } ]);
    }
}
</script>

<style scoped lang='less'>
</style>
