<template>
    <div>
        <v-site-rain-panel v-if="pageStatus" @close="pageStatus=false"></v-site-rain-panel>
        <v-timepicker v-if="tps" :option="option" @cbtime="selectTime"  @destroy="(tps = false)"></v-timepicker>
        <div class="site" :style="{width:width + 'px' }">
            <a class="close" @click="close()"></a>
            <div class="elements title">
                <label class="name">要素：</label>
                <ul class="clearfix elements-nav">
                    <li v-for="(item, key) in elementItems" class="elements-item" :key="key">
                        <input type="checkbox" v-model="elements" :value="key" :id="key" class="checkbox"/>
                        <label class="inputlabel" :for="key">
                            {{item}}
                        </label>
                    </li>
                </ul>
            </div>
            <div class="panel">
                <ul class="element-tab clearfix">
                    <li :class="['element-item', {'on' : isRainPanel}]"  @click="(isRainPanel = true)">雨量</li>
                    <li :class="['element-item', {'on' : !isRainPanel}]" @click="(isRainPanel = false)">水位</li>
                </ul>
                <div class="main">
                    <v-site-rain v-if="isRainPanel"
                                @timeclick="setTimeParam"
                                :pickBeginTime="beginTime"
                                :pickEndTime="endTime"
                                @open="pageStatus=true">
                    </v-site-rain>
                    <v-site-water v-show="!isRainPanel"></v-site-water>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import SiteRain from '../PopupBox/SiteRain';
import SiteWater from '../PopupBox/SiteWater';
import Timepicker from '../Plugins/Timepicker';
import SiteRainPanel from '../SubPanel/SiteRainPanel';

export default {
    name: 'SitePanel',
    components: {
        'v-site-rain': SiteRain,
        'v-site-water': SiteWater,
        'v-timepicker': Timepicker,
        'v-site-rain-panel': SiteRainPanel
    },
    data() {
        return {
            // 自动站元素选项
            elementItems: { wind: '风', temp: '温度', rain: '雨量' },
            elements: [],
            isRainPanel: true,
            option: {},
            tps: false,
            beginTime: '',
            endTime: '',
            // 分页状态
            pageStatus: false
        };
    },
    computed: {
        ...mapState({
            staticParams: state => state.site.staticParams,
            bigScreen: state => state.toolsBar.bigScreen,
            elementType: state => {
                let es = state.site.elementType;
                return es.split(';');
            }
        }),
        width() {
            return this.bigScreen ? 424 : 320;
        }
    },
    watch: {
        elements(es) {
            this.updateParam(['site', { elementType: es.join(';') }]);
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        close() {
            this.$emit('close');
        },
        setTimeParam(obj) {
            let { option, tps } = obj;
            this.option = option;
            this.tps = tps;
            // 以下代码为了避免上一次时间同样，导致选择时不会覆盖时间轴自动更新后的时间。
            let { date, type } = option;
            this[type + 'Time'] = date;
        },
        selectTime(param) {
            let { date, type } = param;
            this[type + 'Time'] = date;
            this.tps = false;
        }
    },
    destroyed() {
        this.updateParam(['site', { elementType: this.elements.join(';') }]);
    },
    mounted() {
        this.elements = this.elementType;
    }
};
</script>

<style lang='less'>
@import '../../assets/css/common.less';
.site {
    position: absolute;
    right: 0px;
    top: 0px;
    background: #fff;
    z-index: @panel-index;
    line-height: 20px;
    -moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}

label.name {
    float: left;
}

.elements {
    &.title {
        cursor: default;
    }

    .elements-list {
        float: left;
    }
    .elements-item {
        display: inline-block;

        &:first-child {
            color: #018000;
        }

        &:nth-child(2) {
            color: red;
        }

        &:nth-child(3) {
            color: #3e42ce;
        }
    }

    label:hover {
        color: @select-font-color;
    }
}

.element-tab {
    margin-top: 5px;
    .element-item {
        float: left;
        padding: 0 8px;
        .height();
        cursor: pointer;
        background: @title-color;
        letter-spacing: 1px;

        &:hover {
            color: @select-font-color;
        }
        &.on {
            color: @select-font-color;
            font-weight: bold;
        }

        &:nth-child(2) {
            border-bottom-right-radius: 4px;
            border-top-right-radius: 4px;
        }
    }
}

.big {
    .site {
        font-size: 18px;
        width: 600px;

        .elements {
            .height(@height-big);

            .elements-nav {
                .elements-item {
                    margin-right: 4px;
                }
            }
        }

        .panel {
            .element-tab {
                .element-item {
                    .height(30px);
                }
            }
        }
    }
}
</style>
