<template>
    <div class="model-scale-slider" :class="modeltype">
        <div class="model-name curName" v-if='!bothPanel'>{{ slider.currName }}</div>
        <div class="model-name multi-panel clearfix" v-if='bothPanel'>
            <div class="model-time-name" v-if="timeName" >{{ timeName }}:</div>
            <ul class="clearfix">
                <li class="li_input" v-for="(item, key) in childItems" :key="key" @click="selectBothModel(key)">
                    <input class="radio" type="radio" name="multiModel" v-model="multiModel" :value="key" :id="key" />
                    <label :for="key" v-on:click.stop>{{ item.name }}</label>
                </li>
            </ul>
        </div>
        <div class='container' v-if="notmt">
            <vue-slider ref='model-slider' v-model="sliderSingleValue" v-bind='sliderOptions'></vue-slider>
        </div>
    </div>
</template>

<script>
import vueSlider from 'vue-slider-component';
import { mapState, mapActions } from 'vuex'

export default {
    name: 'ScaleSlider',
    props: ['slider', 'modeltype'],
    components: { vueSlider },
    data() {
        return {
            childItems: {},
            multiModel: '',
            timeName: '',
            multiType: null,
            sliderSingleValue: '+24',
            sliderOptions: {
                disabled: false,
                tooltip: false,
                piecewise: true,
                piecewiseLabel: true,
                height: 1,
                style: { marginLeft: '1%', marginRight: '3%' },
                data: [ '-24', '-1', '+24', '+48', '+72' ],
                speed: 0,
                piecewiseStyle: {
                    backgroundColor: '#ccc',
                    visibility: 'visible',
                    width: '5px',
                    height: '5px'
                },
                'dot-size': 12,
                'process-style': {
                    backgroundColor: '#ccc'
                },
                'label-style': {
                    color: '#6d82a1'
                }
            }
        }
    },
    computed: {
        ...mapState({
            bigScreen: state => state.toolsBar.bigScreen
        }),
        bothPanel() {
            return this.slider.baseItems[this.slider.currIndex].both;
        },
        liWidth() {
            return { width: Number(100 / this.slider.baseItems.length).toFixed(5) + '%' };
        },
        notmt() {
            return this.modeltype !== 'mt';
        }
    },
    watch: {
        slider() {
            this.init();
        },
        sliderSingleValue() {
            this.selectModel(this.$refs['model-slider'].getIndex());
        },
        bigScreen() {
            this.$refs['model-slider'].refresh();
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        selectModel(index) {
            this.timeName = ''
            let slider = this.slider;
            let item = slider.baseItems[index];
            let childItems = {};
            if (item.both) {
                childItems = slider.childModel[item.code];
                this.childItems = childItems;
            } else {
                this.multiType = null;
            }
            let cType = item.code;
            for (let type in childItems) {
                if (childItems[type].type === this.multiType) {
                    cType = type;
                    break;
                }
            }
            slider.currModel = cType;
            slider.currIndex = index;
            slider.currName = item.name;
            this.multiModel = cType;
            if (item.timeName) this.timeName = item.timeName;
            if (!!this.childItems[cType]) {
                this.selectBothModel(cType);
            } else if (cType === 'galeAverageDropArea72') {
                this.$emit('type', { cType, legend: 'fallzone' });
            } else {
                this.$emit('type', { cType });
            }
        },

        selectBothModel(cType) {
            let slider = this.slider;
            this.childItems[slider.currModel].status = false;
            this.childItems[cType].status = true;
            slider.currName = this.childItems[cType].name;
            this.multiType = this.childItems[cType].type;
            // 获取图例类型
            let legend = this.childItems[cType].legend;
            this.$emit('type', { cType, legend });
        },

        /**
         * 组装slider数据
         */
        packSliderData() {
            let dataArr = [];
            this.slider.baseItems.forEach((ele, index) => {
                dataArr[index] = ele.dateTime
            });
            this.sliderOptions.data = dataArr;
            this.$nextTick(() => {
                this.$refs['model-slider'].setIndex(this.slider.currIndex);
                // this.selectModel(this.slider.currIndex);
            });
        },

        init() {
            if (!!this.slider.model) {
                if (this.notmt) this.packSliderData();
                this.multiType = null;
                this.sliderData = Object.assign({}, this.slider);
                let status = this.slider.baseItems[this.slider.currIndex].both;
                if (status) {
                    this.selectModel(this.slider.currIndex);
                }
            }
        }
    },
    mounted() {
        this.init();
    },
    destroyed() {
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.model-scale-slider {
    width: 270px;
    padding: 0 5px 4px 5px;
    clear: both;
    position: absolute;
    z-index: @panel-index;
    left: 0;
    top: 70px;
    background: #fff;
    box-shadow: @shadow;

    .model-slider {
        margin-left: 9px;
        margin-right: 12px;
        height: 1px;
        border-radius: 0;
        border: 0px;
        background: #c1c1c1;
        &::after {
            content: "h";
            position: absolute;
            right: -13px;
            top: -4px;
            color: #6d82a1;
        }
    }

    .model-scale {
        li {
            display: inline-block;
            text-align: center;
        }
        li:first-child {
            text-align: start;
        }
        li:last-child {
            text-align: end;
        }
    }

    .both-panel {
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: @shadow;
        ul li {
            margin: 5px;
            min-width: 100px;
        }
    }

    .model-select {
        color: @select-font-color;
    }
    .model-time-name {
        width: 70px;
        float: left;
    }
    .model-name {
        // margin: 4px 0 0 0;
        height: 50px;
        line-height: 22px;
        ul {
            width: 200px;
            float: left;
            // height: 16px;
            li {
                &:nth-child(1) {
                    margin-right: 4px;
                }
                float: left;
                margin-right: 0px;
                line-height: 16px;
                // .height();
                // input {
                //     height: 14px;
                //     width: 14px;
                //     vertical-align: middle;
                //     margin-right: 2px;
                //     margin-top: -1px;
                //     cursor: pointer;
                // }
            }
            li.li_input {
                min-width: 16%;
                margin: 5px 0;
                margin-right: 3px;
                .radio + label {
                    // display: inline-block;
                    // height: 26px;
                    line-height: 16px;
                    margin: 0;
                    // margin-right: -4px;
                }
                .radio + label::after {
                   top:5px;
                }
            }
        }
    }

    .container {
        // position: absolute;
        bottom: 10px;
        width: 101%;
        height: 30px;
        box-sizing: border-box;
        &::after {
            content: "h";
            position: absolute;
            right: 1px;
            bottom:20px;
            color: rgb(109, 130, 161);
        }
    }
}

.gale {
    .curName {
        // .height(40px);
        // text-indent: 5px;
    }
}
.heavyRainfall {
    .model-name {
        // .height(40px);
        // text-indent: 5px;
    }
}

.mountainTorrents, .waterLogging, .fireDanger {
    .model-name {
        // .height(40px);
        // text-indent: 5px;
    }
}
// .waterLogging {
//     .model-name {
//         .height(40px);
//         text-indent: 5px;
//     }
// }
.big {
    .model-scale-slider {
        top: 100px;
        width: 406px;
        font-size: 18px;
        // text-indent: 5px;
        .model-name {
            height: 75px;
            line-height: 36px;
            .model-time-name {
                text-indent: 5px;
                width: 104px;
            }
            ul {
                width: 282px;
                li {
                    // .height(@height-big);
                    line-height: 24px;
                    margin-bottom: 0;
                    &.li_input {
                        min-width: 16%;
                        margin: 5px 0;
                        margin-right: 3px;
                        .radio + label::after {
                            left: 5px;
                            top: 9px;
                        }
                    }
                }
            }
        }
    }

    .gale {
        .model-name {
            // font-size: 18px;
            // line-height: 36px;
            // .height(40px);
            text-indent: 5px;
        }
    }

    .heavyRainfall, .fireDanger, .mountainTorrents, .waterLogging {
        .model-name {
            text-indent: 5px;
            // margin-bottom: 10px;
            // .height(50px);
        }
    }
}
</style>
