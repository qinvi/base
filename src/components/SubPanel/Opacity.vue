<template>
    <div class="opacity" v-show="status">
        <!-- <div id="opacity-slider" class="opacity-slider"></div> -->
        <div class='container'>
            <vue-slider ref='opacity-slider' v-model="value" v-bind="opacitySliderOptions"></vue-slider>
        </div>
        <div>
            <span v-for="(item, key) in opacitys" :key="key">{{ item.text }}、</span>透明度：{{ value }}%
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import vueSlider from 'vue-slider-component';
export default {
    name: 'Opacity',
    components: { vueSlider },
    data() {
        return {
            opacitys: {
                model: { text: '模型' },
                radar: { text: '雷达' },
                cloud: { text: '云图' }
            },
            value: 100,
            opacitySliderOptions: {
                'tooltip': false,
                'width': '100%',
                'height': 5,
                'data': [],
                'dot-size': 12,
                'speed': 0,
                'piecewiseStyle': {
                    'backgroundColor': '#6d82a1',
                    'visibility': 'visible',
                    'width': '6px',
                    'height': '6px'
                },
                'bg-style': {
                    'backgroundColor': '#fff',
                    'boxShadow': 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)'
                }
            }
        };
    },
    watch: {
        bigScreen() {
            this.$refs['opacity-slider'].refresh();
        },
        value() {
            this.$nextTick(() => {
                if (!!this.model) this.model(this.value / 100);
                if (!!this.cloud) this.cloud(this.value / 100);
                if (!!this.radar) this.radar(this.value / 100);
                this.updateParam([ 'opacity', { value: this.value / 100 } ]);
            });
        }
    },
    computed: {
        ...mapState({
            status: state => state.opacity.status,
            model: state => state.model.callback,
            cloud: state => state.cloud.callback,
            radar: state => state.radar.callback,
            opacity: state => { return state.opacity.value * 100 },
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        init() {
            let t = [];
            for (let i = 0; i <= 100; i++) t[i] = i;
            this.opacitySliderOptions.data = t;
            // $('#opacity-slider').unbind().slider({
            //     step: 5,
            //     min: 0,
            //     max: 100,
            //     value: this.value,
            //     slide: (event, ui) => {
            //         const value = this.value = ui.value;
            //         if (!!this.model) this.model(value / 100);
            //         if (!!this.cloud) this.cloud(value / 100);
            //         if (!!this.radar) this.radar(value / 100);
            //         this.updateParam([ 'opacity', { value: value / 100 } ]);
            //     }
            // });
        }
    },
    mounted() {
        this.value = this.opacity;
        this.init();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.opacity {
    position: relative;
    top: 68px;
    right: 50px;
    z-index: @panel-index;
    width: 200px;
    padding: 10px;
    background: #fff;
    box-shadow: @shadow;
    border-top: 1px solid #d2d2d2;
    &::after, &::before {
        content: "";
        display: inline-block;
        position: absolute;
        margin-left: -3px;
        width: 0;
        height: 0;
    }
    &::after {
        top: -7px;
        left: 50%;
        margin-left: -5px;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #fff;
    }
    &::before {
        top: -8px;
        left: 50%;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid #d2d2d2;
    }
    .opacity-slider {
        height: 6px;
        margin-bottom: 6px;
    }
}
.big {
    .opacity {
        top: 72px;
        right: 150px;
        width: 340px;
    }
}
</style>
