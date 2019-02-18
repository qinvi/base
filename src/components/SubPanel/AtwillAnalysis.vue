<template>
    <div>
        <div class="analysis">
            <div class="panel">
                <div class="count line">
                    <ul class="clearfix">
                        <li :title="item.val" v-for="(item, key) of countDetail" :key="key" :class="key">
                            {{ item.text }}<label>{{ item.val }}</label>
                        </li>
                    </ul>
                </div>
                <div class="bottom-panel">
                    <ul class="clearfix">
                        <li v-for="(text, key) of tools" :key="key" :class="[ { selected: key === lastTool }, 'icon-analysis-' + key ]" @click="select(key)">
                            {{ text }}<label></label>
                        </li>
                    </ul>
                </div>
            </div>
            <a class="close" @click="close"></a>
        </div>
        <div class="subpanel top" v-if="lastTool">
            <v-target v-if="lastTool == 'target'" :data="count.target" :type="'atwill'" :cacheId="count.cacheId" @close="lastTool = ''"></v-target>
            <v-navigation v-if="lastTool == 'navigation'" :navigationName="'model'"></v-navigation>
            <v-plan v-if="lastTool == 'plan'"></v-plan>
            <v-town-name v-if="lastTool == 'town'" :type="'atwill'" :cacheId="count.cacheId" :refresh="refresh"></v-town-name>
            <v-min-base-info v-if="lastTool == 'baseData'" :cacheId="count.cacheId" :type="'atwill'" :refresh="refresh"></v-min-base-info>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Target from './Target';
import Plan from './Plan';
import MinBaseInfo from './MinBaseInfo';
import Navigation from './Navigation';
import TownName from './TownName';

export default {
    name: 'Analysis',
    props: [ 'count' ],
    components: {
        'v-target': Target,
        'v-plan': Plan,
        'v-min-base-info': MinBaseInfo,
        'v-navigation': Navigation,
        'v-town-name': TownName
    },
    data() {
        return {
            countDetail: {
                town: { text: '行政镇', val: 0 },
                pop: { text: '人口', val: 0 },
                area: { text: '面积', val: 0 },
                gdp: { text: 'GDP', val: 0 }
            },
            tools: {
                target: '靶向预警',
                navigation: '避灾导航',
                plan: '应急预案',
                town: '圈选镇名',
                baseData: '基础数据'
            },
            lastTool: '',
            refresh: null
        }
    },
    computed: {
        ...mapState({
            baseInfoStatus: state => state.baseInfo.status,
            selected: state => state.analysis.selected
        })
    },
    watch: {
        count() {
            this.initCount();
            this.refresh = new Date().getTime();
        },
        baseInfoStatus(status) {
            if (status && this.lastTool === 'baseData') this.lastTool = '';
        },
        /**
         * selected: 'model'   模型分析
         *           'atwill'  圈选分析
         * 改变了就需要将相应分析弹窗隐藏，避免同时出现相同的tools弹窗
         */
        selected() {
            if (this.selected === 'model') this.lastTool = '';
        },
        lastTool() {
            this.updateParam([ 'atwill', { toggle: new Date().getTime() } ]);
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化影响分析
         */
        initCount() {
            this.countDetail.town.val = short(this.count.town);
            this.countDetail.area.val = short(this.count.area);
            this.countDetail.pop.val = short(this.count.pop);
            this.countDetail.gdp.val = short(this.count.gdp);
            function short(value) {
                const decimal = (value + '').split('.')[1];
                if (!!decimal) {
                    return Number(value).toFixed(2)
                } else {
                    return value;
                }
            }
        },

        /**
         * 选中工具
         * @param {object} key 类型对象标志
         */
        select(key) {
            this.lastTool = this.lastTool === key ? '' : key;
            if (this.lastTool) {
                // const isBaseData = this.lastTool === 'baseData';
                // if (isBaseData) {
                //     this.updateParam([ 'atwill', { toggle: new Date().getTime() } ]);
                // }
                // const isTarget = this.lastTool === 'target';
                // if (isTarget) {
                //     this.updateParam([ 'atwill', { toggle: new Date().getTime() } ]);
                // }
                this.updateParam([ 'baseInfo', { status: !(this.lastTool === 'baseData') } ]);
                this.updateParam([ 'analysis', { selected: 'atwill' } ]);
            }
        },

        /**
         * 关闭影响分析
         */
        close() {
            this.$emit('close');
        }
    },
    mounted() {
        this.initCount();
    },
    destroyed() {
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

[class*="icon-analysis-"]::before {
    color: @font-color;
}

.analysis {
    .panel {
        width: 440px;
        padding: 0px 5px;
        background: #fff;
        box-shadow: @shadow;
        box-sizing: border-box;
        .count {
            // display: inline-block;
            // width: 416px;
            height: auto;
            text-align: left;
            padding: 2px;
            &.line {
                border-bottom: 1px solid #ccc;
            }
            ul li {
                cursor: pointer;
                width: auto;
                margin-right: 5px;
                height: 22px;
                line-height: 22px;
                float: left;
                min-width: 80px;
                label {
                    cursor: pointer;
                    color: @select-font-color;
                    font-weight: 700;
                    margin-left: 2px;
                    display: inline-block;
                }
                &.town>label::after {
                    content: "\4E2A";
                    display: inline-block;
                }
                &.area>label::after {
                    content: "km\B2";
                    display: inline-block;
                }
                &.pop>label::after {
                    content: "\4E07";
                    display: inline-block;
                }
                &.gdp>label::after {
                    content: "\4EBF";
                    display: inline-block;
                }
            }
        }
        .bottom-panel {
            width: 100%;
            margin: auto;
            padding: 2px;
            position: relative;
            left: -6px;
            &.line {
                border-bottom: 1px solid #ccc;
            }
            ul li {
                cursor: pointer;
                position: relative;
                list-style-type: none;
                float: left;
                line-height: 18px;
                margin-right: 10px;

                &.selected {
                    color: @select-font-color;
                    &::after {
                        content: '';
                        border-bottom-color: rgba(255, 255, 255, 0.9);
                        border-right: 6px solid transparent;
                        border-left: 6px solid transparent;
                        border-bottom: 6px solid rgba(255, 255, 255, 0.9);
                        position: absolute;
                        bottom: -8px;
                        left: 34px;
                        z-index: @panel-index;
                    }
                }
                label {
                    font-family: 'Microsoft Yahei';
                    cursor: pointer;
                }
                &:before {
                    font-size: 18px;
                    vertical-align: middle;
                    position: relative;
                    top: -1px;
                    left: 3px;
                }
            }
        }
    }
}

.subpanel {
    width: 440px;
    background: #fff;
    margin: 8px 0;
    // padding: 0 0 4px 0;
    box-shadow: @shadow;
    &.top {
        position: absolute;
        top: 46px;
        right: 0;
        height: auto;
        z-index: 5010;
        .navigation {
            top: 0px;
            left: 0px;
            width: 410px;
        }
    }
}

.big {
    .analysis {
        .panel {
            width: 600px;

            .count {
                ul {
                    li {
                        .height-big();
                        font-size: 18px;
                    }
                }
            }
            .bottom-panel {
                ul {
                    li {
                        .height-big();
                    }
                }
            }
        }
    }
    .subpanel {
        width: 100%;

        &.top {
            top: 78px;

            .navigation {
                width: 530px;
            }
        }
    }
}

</style>
