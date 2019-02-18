<template>
    <div class="marker-panel">
        <span :class="selectMarker" @click="setPanelStatus()"></span>
        <div class="marker-color" :style="{ background: pointColorVal }" @click="setPanelStatus()"></div>
        <div class="panel" v-if="!status">
            <v-color-panel @touch="selectColor"></v-color-panel>
            <div class="slider">
                <div class='container'><vue-slider ref='marker-slider' v-model="sliderValue" v-bind="sliderOptions"></vue-slider></div>
                <span class="slider-text" >{{ sliderText }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import ColorPanel from '../Plugins/ColorPanel';
import VueSlider from 'vue-slider-component';

export default {
    components: { 'v-color-panel': ColorPanel, VueSlider },
    data() {
        return {
            pointColorVal: '#ed3f2b',
            pointColor: '03',
            sliderText: '缩放：50%',
            sliderValue: 50,
            sliderOptions: {
                width: '100%',
                tooltip: false,
                height: 8,
                min: 0,
                max: 100,
                speed: 0,
                piecewiseStyle: {
                    backgroundColor: '#6d82a1',
                    visibility: 'visible',
                    width: '6px',
                    height: '6px'
                },
                bgStyle: {
                    backgroundColor: '#fff',
                    boxShadow: 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)'
                },
                'dot-size': 12,
                'process-style': {
                    backgroundColor: '#fff',
                    boxShadow: 'inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)'
                }
            }
        };
    },
    computed: {
        ...mapState({
            marker: state => state.decideServe.marker,
            status: state => state.decideServe.status,
            bigScreen: state => state.toolsBar.bigScreen
        }),
        selectMarker() {
            return 'marker-' + this.pointColor;
        }
    },
    watch: {
        sliderValue() {
            this.$nextTick(() => {
                this.sliderText = '缩放：' + this.sliderValue + '%';
                const pointSize = this.updateMarker({ pointSize: this.sliderValue + '' });
                this.updateParam([ 'decideServe', { marker: pointSize } ]);
            });
        },
        bigScreen() {
            if (!this.status) {
                this.$refs['marker-slider'].refresh();
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        selectColor(item) {
            if (Object.keys(item) === 0) return;
            const { color, code } = item;
            this.pointColorVal = color;
            this.pointColor = code;
            const pointColor = this.updateMarker({ pointColor: code + '' });
            this.updateParam([ 'decideServe', { marker: pointColor } ]);
        },
        setPanelStatus() {
            this.updateParam([ 'decideServe', { status: false } ]);
        },
        updateMarker(object) {
            return Object.assign(this.marker, object);
        }
    },
    beforeDestroy() {
        const marker = this.updateMarker({ pointColor: '03', pointSize: '50' });
        this.updateParam([ 'decideServe', { marker: marker } ]);
        this.updateParam([ 'decideServe', { status: true } ]);
    },
    mounted() {
        // this.setSlider();
    }
};
</script>
<style lang='less' scoped>
@import '../../assets/css/common.less';
@images: '../../assets/img';

.marker-panel {
    position: relative;
    float: left;
    .panel {
        display: inline-block;
    }
    span {
        float: left;
        width: 44px;
        height: 40px;
    }
    .marker-color {
        float: left;
        width: 30px;
        height: 30px;
    }
    .slider-text {
        width: 100%;
        text-align: center;
    }

    .slider {
        float: left;
        width: 150px;
        height: 34px;
        margin-left: 5px;
    }

    .marker-slider {
        width: 140px;
        display: inline-block;
        height: 6px;
    }

    .marker-01,
    .marker-02,
    .marker-03,
    .marker-04,
    .marker-05,
    .marker-06,
    .marker-07,
    .marker-08,
    .marker-09,
    .marker-10,
    .marker-11,
    .marker-12,
    .marker-13,
    .marker-14,
    .marker-15,
    .marker-16 {
        display: inline-block;
        width: 30px;
        height: 34px;
        float: left;
    }

    .marker-01 {
        background: url('@{images}/decideserve/P01.png') no-repeat center center;
    }

    .marker-02 {
        background: url('@{images}/decideserve/P02.png') no-repeat center center;
    }

    .marker-03 {
        background: url('@{images}/decideserve/P03.png') no-repeat center center;
    }

    .marker-04 {
        background: url('@{images}/decideserve/P04.png') no-repeat center center;
    }

    .marker-05 {
        background: url('@{images}/decideserve/P05.png') no-repeat center center;
    }

    .marker-06 {
        background: url('@{images}/decideserve/P06.png') no-repeat center center;
    }

    .marker-07 {
        background: url('@{images}/decideserve/P07.png') no-repeat center center;
    }

    .marker-08 {
        background: url('@{images}/decideserve/P08.png') no-repeat center center;
    }

    .marker-09 {
        background: url('@{images}/decideserve/P09.png') no-repeat center center;
    }

    .marker-10 {
        background: url('@{images}/decideserve/P10.png') no-repeat center center;
    }

    .marker-11 {
        background: url('@{images}/decideserve/P11.png') no-repeat center center;
    }

    .marker-12 {
        background: url('@{images}/decideserve/P12.png') no-repeat center center;
    }

    .marker-13 {
        background: url('@{images}/decideserve/P13.png') no-repeat center center;
    }

    .marker-14 {
        background: url('@{images}/decideserve/P14.png') no-repeat center center;
    }

    .marker-15 {
        background: url('@{images}/decideserve/P15.png') no-repeat center center;
    }

    .marker-16 {
        background: url('@{images}/decideserve/P16.png') no-repeat center center;
    }
}

.big {
    .marker-panel {
        .marker-color {
            width: 36px;
            height: 36px;
        }
        span {
            .height-big();
        }
        .slider {
            width: 240px;
        }
    }
}
</style>
