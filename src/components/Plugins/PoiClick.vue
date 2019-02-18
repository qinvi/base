<template>
	<div class="">
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'poiClick',

    data() {
        return {
        }
    },

    computed: {
        ...mapState({
            normalCallback: state => state.clickCallback.normalCallback, // poi.vue、基础数据
            modelCallback: state => state.clickCallback.modelCallback, // poi.vue、模型数据（内涝、森林火险）
            geologicHazardCallback: state => state.clickCallback.geologicHazardCallback, // geologichazzard.vue、地质灾害
            AgrCallback: state => state.clickCallback.AgrCallback, // Agr.vue、农情调查
            AirCallback: state => state.clickCallback.AirCallback, // Air.vue、空气质量
            ShipCallback: state => state.clickCallback.ShipCallback, // Ship.vue、船舶
            SiteCallback: state => state.clickCallback.SiteCallback, // Site.vue、监测站
            PollutantDispersionCallback: state => state.clickCallback.PollutantDispersionCallback, // PollutantDispersion.vue、污染
            TyphoonCallback: state => state.clickCallback.TyphoonCallback, // Typhoon.vue
            ReservoirCallback: state => state.clickCallback.ReservoirCallback, // Reservoir.vue
            videoCallback: state => state.clickCallback.videoCallback, // video.vue 视频
            liveVideoCallback: state => state.clickCallback.liveVideoCallback, // 现场直播
            RiverCallbak: state => state.clickCallback.RiverCallbak, // 现场直播
            trafficCallback: state => state.clickCallback.trafficCallback, // TrafficVideo.vue 天气实景视频
            alarmCallback: state => state.clickCallback.alarmCallback // HorseLamp.vue 任意点风险
        })
    },

    watch: {
    },

    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.timer = null;
            this.index = 0
            this.updateParam(['clickCallback', { pluginCallback: this.click }]);
            this.updateParam(['clickCallback', { clearTimer: this.clearTimer }]);
            this.updateParam(['clickCallback', { getClickIndex: this.getClickIndex }]);
        },

        /**
         * 点击函数、可以传到这里的callback都是有数据的
         * @param {string} type 所点击的poi所在的vue
         * @param {object} params poi详情回调数据
         * @param {number} index 处理下标
         */
        click(type, params, index) {
            if (!!this.timer) return;
            this.timer = window.setTimeout(() => {
                if (index !== 'pass' && index !== this.index) {
                    this.timer = null;
                    return;
                }
                this.index = (this.index + 1) % 100000;
                this[type](params);
                window.clearTimeout(this.timer);
            }, 100);
        },

        /**
         * 获取事件处理下标
         */
        getClickIndex() {
            return this.index;
        },

        /**
         * 清理timer数据
         */
        clearTimer() {
            this.timer = null;
        }
    },

    mounted() {
        this.initConstData();
    },

    destroyed() {
    }
};
</script>
