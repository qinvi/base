<template>
    <div>
        <div class="analysis">
            <div class="panel">
                <div class="bottom-panel line">
                    <ul class="clearfix">
                        <li v-for="(text, key) of tools" :key="key" :class="[ { selected: key === lastTool }, 'icon-analysis-' + key ]" @click="select(key)">
                            <label>{{ text }}</label>
                        </li>
                    </ul>
                </div>
                <div class="count">
                    <ul class="clearfix">
                        <li v-for="(item, key) of countDetail" :key="key" :class="key">
                            {{ item.text }}
                            <label>{{ item.val }}</label>
                        </li>
                    </ul>
                </div>
            </div>
            <a class="close" @click="close"></a>
        </div>
        <div class="subpanel bottom" v-if="lastTool">
            <v-target v-if="lastTool == 'target'" :data="count.target" :type="'model'" @close="lastTool = ''"></v-target>
            <v-navigation v-if="lastTool == 'navigation'" :navigationName="'model'"></v-navigation>
            <v-plan v-if="lastTool === 'plan'"></v-plan>
            <v-town-name v-if="lastTool == 'town'" :type="'model'" :refresh="refresh"></v-town-name>
            <v-min-base-info v-if="lastTool == 'baseData'" :cacheId="count.id" :type="'model'" :refresh="refresh"></v-min-base-info>
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
    props: [ 'count', 'type' ],
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
            minBase: {},
            refresh: null
        }
    },
    computed: {
        ...mapState({
            baseInfoStatus: state => state.baseInfo.status,
            selected: state => state.analysis.selected,
            model: state => {
                let { param } = state.model;
                // 暂时写法
                let type = 'model';
                let model = state.model.type;
                let levels = param['levels'] ? param['levels'] : param['filestr'];
                let modelType = param['modelType'] ? param['modelType'] : param['pfmtype'];
                let time = 'yyyyMMddhhmmss'
                return { model, type, levels, modelType, time };
            }
        })
    },
    watch: {
        count() {
            this.initCount();
            this.refresh = new Date().getTime();
            // this.lastTool = '';
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
            if (this.selected === 'atwill') this.lastTool = '';
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
                const isBaseData = this.lastTool === 'baseData';
                if (isBaseData) {
                    this.updateParam([ 'atwill', { toggle: new Date().getTime() } ]);
                }
                this.updateParam([ 'baseInfo', { status: !isBaseData } ]);
                this.updateParam([ 'analysis', { selected: 'model' } ]);
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
        width: @analysis-width;
        padding: 0px 5px;
        background: #fff;
        box-shadow: @shadow;
        box-sizing: border-box;

        .count {
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
            height: 22px;
            line-height: 22px;
            padding: 2px;
            &.line {
                border-bottom: 1px solid #ccc;
            }
            ul li {
                cursor: pointer;
                position: relative;
                list-style-type: none;
                float: left;
                line-height: 22px;
                margin-right: 10px;
                &.selected {
                    color: @select-font-color;
                    &::after {
                        content: '';
                        border-top-color: rgba(255, 255, 255, 0.9);
                        border-right: 6px solid transparent;
                        border-left: 6px solid transparent;
                        border-top: 6px solid rgba(255, 255, 255, 0.9);
                        position: absolute;
                        bottom: 24px;
                        left: 34px;
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
                    left: -3px;
                }
            }
        }
    }
}

.subpanel {
    width: @analysis-width;
    background: #fff;
    margin: 8px 0;
    box-shadow: @shadow;
    &.bottom {
        position: absolute;
        bottom: 50px;
        right: 0;
        .navigation {
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0);
        }
    }
}

.big {
    .analysis {
        .panel {
            width: @analysis-width-big;
            .count {
                ul {
                    li {
                        height: 36px;
                        line-height: 36px;
                        font-size: 16px;
                    }
                }
            }
            .bottom-panel {
                height: 36px;
                line-height: 36px;
                ul {
                    li {
                        height: 36px;
                        line-height: 36px;
                    }
                }
            }
        }
    }
    .subpanel {
        width: @analysis-width-big;

        &.bottom {
            bottom: 80px;
        }
    }
}
</style>
