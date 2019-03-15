<template>
    <div class="level" :style="position">
        <div class="model-analysis-out" id="full-model" :style="computeZindex">
            <v-model-analysis v-if="analysis" :count="count" @close="close"></v-model-analysis>
        </div>
        <div :class="[ 'level-select', type, modelType ]">
            <ul class="clearfix">
                <li v-for="(item,key) of data" :key="key" @click.stop="select(item)">
                    <input name="levels" type="checkbox" class="checkbox" v-model="levels" :id="item.id" :value="item.val"/>
                    <label :for="item.id" @click.stop>{{ item.text }}</label>
                    <div class="color" :style="{ backgroundColor: item.color }"></div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Model as MD } from '../../utils/tools/Model.js';
import ModelAnalysis from './ModelAnalysis';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    name: 'Level',
    components: {
        'v-model-analysis': ModelAnalysis
    },
    data() {
        return {
            levels: [],
            analysis: false,
            count: {},
            urls: '',
            levelBottom: ''
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            data: state => state.level.data,
            type: state => state.model.type,
            param: state => state.model.param,
            min: state => state.time.minOn,
            marqueeHide: state => state.alarm.marqueeHide,
            callback: state => state.level.callback,
            bigScreen: state => state.toolsBar.bigScreen,
            hcStatus: state => state.toolsBar.historyCase,
            hcHide: state => state.historyCase.hide,
            fullScreen: state => state.target.fullScreen,
            targetType: state => state.target.belong,
            level: state => state.level.status,
            sigCloseAnalysis: state => state.analysis.sigCloseAnalysis
        }),

        computeZindex() {
            let t = '';
            if (this.targetType === 'model') {
                if (this.fullScreen) {
                    this.lastZindex = Number(window.getComputedStyle(document.getElementById('full-model'), null).getPropertyValue('z-index'));
                    t = { 'zIndex': WinDrag.zIndex + 1 };
                } else {
                    t = { 'zIndex': WinDrag.zIndex };
                }
            } else {
                t = { 'zIndex': WinDrag.zIndex }
            }
            return t;
        },

        modelType() {
            if (!!this.param) {
                const type = this.param.productCode;
                const modelType = !!type ? type.substring(0, 1) : '';
                return modelType;
            } else {
                return '';
            }
        },

        position() {
            let t = { bottom: this.levelBottom, right: (this.hcStatus && !this.hcHide) ? '308px' : '' };
            return t;
        }
    },
    watch: {
        level(val) {
            if (!val) {
                this.updateParam([ 'level', { data: null, callback: null } ]);
            }
        },
        bigScreen() {
            this.computedBottom(this.marqueeHide);
        },
        min() {
            this.computedBottom(this.lastMarBoolean);
        },
        code() {
            if (this.param.analysis) {
                this.getAreaTown();
            }
        },
        data() {
            this.levels = [];
        },
        param() {
            if (this.param.analysis) {
                if (this.levels.length > 0) {
                    this.getAreaTown();
                }
            } else {
                this.close();
            }
        },

        sigCloseAnalysis: function () {
            this.levels = []
            this.close()
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化默认参数
         */
        initConstData() {
            // this.urls = {
            //     analysis: sysconfig.REMOTEPATH + '/gdmodel/model!getModelDatas.action'
            // }
            this.lastZindex = '';
            this.updateParam(['alarm', { marquee_level: this.computedBottom }]);
            this.marqueeLevel = {
                true_false: 54, // 90,
                false_false: 90, // 54,
                true_true: 93,
                false_true: 123
            }
            this.lastMarBoolean = false
        },

        /**
         * 计算bottom值
         * @param {boolean} marBoolean 走马灯是否隐藏 false(不隐藏)：true(隐藏)
         * @param {boolean} minBoolean 分钟是否呈现
         */
        computedBottom(marBoolean = this.lastMarBoolean, minBoolean = this.min) {
            this.lastMarBoolean = marBoolean
            this.levelBottom = this.marqueeLevel[marBoolean + '_' + minBoolean] + (this.bigScreen ? 18 : 0) + 'px';
        },

        /**
         * 选中等级
         * @param {object} item 等级对象
         */
        select(item) {
            const status = this.levels.includes(item.val);
            if (!status) {
                // 判断是否是数组，如果是数组就获取数组对象中的图例值。
                const isArray = Array.isArray(this.data);
                const levels = isArray ? this.data.map(item => item.val) : Object.keys(this.data);
                const index = levels.indexOf(item.val);
                for (let i = index; i < levels.length; i++) {
                    const level = levels[i];
                    if (!this.levels.includes(level)) this.levels.push(level);
                }
            } else {
                const index = this.levels.indexOf(item.val);
                this.levels.splice(index, 1);
            }
            this.levels = this.levels.sort();
            this.callback([...this.levels]);
        },

        /**
         * 获取影响分析
         */
        getAreaTown() {
            // this.urls = (this.type === 'heavyRainfall') ? sysconfig.TESTPATH + MD.url[this.type].analysis : sysconfig.REMOTEPATH + '/gdmodel/model!getModelDatas.action';
            // const param = (this.type !== 'heavyRainfall') ? { PARAM: { dateTime: dateTime, modelType: this.param.pfmtype, levels: this.param.filestr, type: 'list', areaCode: this.code } } : { code: this.code, dateTime: '', modelType: 'heavyRainfall', levels: '1', signTime: '', sign: '', time: '20180119180000' }
            this.urls = sysconfig.TESTPATH + MD.url[this.type].analysis;
            const param = { code: this.code, modelType: this.param.modelType, levels: this.param.levels, dateTime: this.param.dateTime }
            utils.GET(this.urls, param).then((json) => {
                const { totalMap, townList, acreage: area, gdp, population: pop } = json.data;
                const list = townList.length ? {} : null;
                for (let town of townList) {
                    list[town.code] = town.name;
                }
                this.count = {
                    target: {
                        count: {
                            LCD_LED: totalMap.LCD_LED,
                            SMS_USER: totalMap.SMS_USER,
                            TYFON: totalMap.TYFON
                        },
                        list
                    },
                    town: totalMap.townCont,
                    area,
                    pop,
                    gdp
                };
                this.analysis = true;
                this.updateParam(['level', {analysisCode: list}]);
            }).catch((ex) => {
                this.count = {
                    target: {
                        count: {
                            LCD_LED: 0,
                            SMS_USER: 0,
                            TYFON: 0
                        },
                        list: {}
                    },
                    town: 0,
                    area: 0,
                    pop: 0,
                    gdp: 0
                };
                this.analysis = true;
                this.updateParam(['level', {analysisCode: null}]);
            })
        },

        /**
         * 关闭影响分析
         */
        close() {
            this.analysis = false;
        }
    },
    mounted() {
        this.initConstData();
        this.computedBottom(this.marqueeHide);
    },
    destroyed() {
        this.updateParam([ 'level', { status: false, data: null, callback: null } ]);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.level {
    position: absolute;
    right: 0px;
    bottom: 90px; // 54px;

    .level-select {
        width: @analysis-width;
        background: #fff;
        padding: 4px 0 2px 0;
        box-shadow: @shadow;
        box-sizing: border-box;

        ul {
            display: flex;
            li {
                flex: 1 0 0;
                text-align: center;
                .color {
                    margin-top: 2px;
                    height: 4px;
                    border: 1px solid #eee;
                }
                .checkbox + label::after {
                    top: 3px;
                }
                .checkbox + label {
                    margin-right: 2px;
                }
            }
        }
    }

    .model-analysis-out {
        position: absolute;
        bottom: 36px;
        right: 0;
        z-index: 5010;
        width: auto;
    }

}
.big {
    .level {
        bottom: 104px;

        .model-analysis-out {
            bottom: 46px;
        }

        .level-select {
            width: @analysis-width-big;

            input + label::after {
                top: 7px;
            }

            &.heavyRainfall ul {
                li {
                    &:last-child {
                        flex: 1 0 14px;
                    }
                }
            }

            li {
                .checkbox + label::after {
                    top: 5px;
                }
                .checkbox + label {
                    margin: 0px -2px;
                }
            }

            &.temp {
                ul {
                    li {
                        &:nth-child(3),
                        &:nth-child(4),
                        &:nth-child(5),
                        &:nth-child(6),
                        &:nth-child(7) {
                            flex: 1 0 10px;
                        }
                    }
                }
            }
        }
    }
}
</style>
