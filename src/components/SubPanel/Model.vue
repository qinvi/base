<template>
    <div>
        <div class="model hover" @mouseenter="higherZIndex">
            <div class="list">
                <ul class="clearfix">
                    <li class="item" v-for="(item, key) of models.fixModels" :key="key" @click="select(item)">
                        <div :class="['item-info', key ]"></div>
                        <v-icon-chose :selected="item.status"></v-icon-chose>
                        <span>{{ item.text }}</span>
                        <i v-show="!!last && last.type === key && ![ 'mt', 'pollutantDispersion', 'stormTide' ].includes(last.type)" :class="{ selected: slider.status }" @click.stop="(slider.status = !slider.status)"></i>
                    </li>
                </ul>
            </div>
            <!-- <transition name="hidecls"> -->
                <div v-show="!hide" class="list">
                    <ul class="more">
                        <li class="item" v-for="(item, key) of models.moreModels" :key="key" @click="select(item)">
                            <!-- , { 'icon-chose': item.status } -->
                            <div :class="[ 'item-info', key ]"></div>
                            <v-icon-chose :selected="item.status"></v-icon-chose>
                            <span>{{ item.text }}</span>
                            <i v-show="!!last && last.type === key && ![ 'mt', 'pollutantDispersion', 'stormTide' ].includes(last.type)" :class="{ selected: slider.status }" @click.stop="(slider.status = !slider.status)"></i>
                        </li>
                    </ul>
                </div>
            <!-- </transition> -->
            <div :class="[ 'toggle', hide ? 'icon-next' : 'icon-prev' ]" v-show="Object.keys(models.moreModels).length > 0" @click="hideMore"></div>
        </div>
        <v-scale-slider v-if="slider.data" v-show="slider.status" :slider="slider.data" @type="selectType" :modeltype="last.type"></v-scale-slider>
        <v-pollutant-dispersion v-if="(!!last && last.type === 'pollutantDispersion')" @param="selectPD" @clear-filestr="param.filestr = []"></v-pollutant-dispersion>
        <v-layer v-if="status"></v-layer>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Model as MD } from '../../utils/tools/Model.js';
import ScaleSlider from '../Plugins/ScaleSlider';
import PollutantDispersion from './PollutantDispersion';
import Layer from '../GisLayer/Model';
import IconChose from '../Plugins/IconChose';

export default {
    name: 'Model',
    components: {
        'v-scale-slider': ScaleSlider,
        'v-pollutant-dispersion': PollutantDispersion,
        'v-layer': Layer,
        'v-icon-chose': IconChose
    },
    data() {
        return {
            last: null,
            hide: true,
            slider: {
                status: true,
                data: null
            }
        }
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            status: state => state.model.status,
            levelData: state => state.level.data,
            poiPopType: state => state.normalPoiDetail.belongTo, // 'left' | 'model' | 'atwill' | 'globalSearch'
            modelSetting: state => state.userSetting.model,
            modelOrder: state => state.userSetting.modelOrder,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove
        }),
        models() {
            let [fixModels, moreModels] = [{}, {}];
            // 解构模型定制
            if (this.modelSetting) {
                const sortedOrder = []

                this.modelOrder.forEach((item) => {
                    if (!sortedOrder.includes(item)) {
                        sortedOrder.push(item)
                    }
                })

                fixModels = this.settingModel(...sortedOrder.slice(0, 4));
                moreModels = this.settingModel(...sortedOrder.slice(4));
            }
            return { fixModels, moreModels };
        }
    },
    watch: {
        code() {
            this.setImageParam();
        },
        sysTime() {
            this.setImageParam();
        },
        levelData: {
            deep: true,
            handler() {
                this.param.filestr = [];
            }
        },
        'models.fixModels': {
            deep: true,
            handler(fixModels) {
                let arr = Object.keys(fixModels);
                if (arr !== 0) {
                    // 初始化默认固定第一个被选中
                    this.select(fixModels[arr[0]]);
                }
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.param = { filestr: null, pfmtype: null, ddatetime: null, respTime: '' };
            this.lastLevel = '';
        },
        // 定制模型对象
        settingModel() {
            let model = {};
            for (let i in arguments) {
                let key = arguments[i];
                for (let modelName in this.modelSetting) {
                    if (modelName === key) {
                        model[key] = MD.setting[modelName];
                        MD.setting[modelName].poiArr = this.modelSetting[key];
                    }
                }
            }
            return model;
        },
        /**
         * 选中模型
         * @param {object} item 模型对象
         */
        select(item) {
            this.initConstData()
            if (!!this.last && this.last.type !== item.type) {
                this.last.status = false;
            }
            let status = item.status = !item.status;
            this.slider = {};
            this.$nextTick(() => {
                if (status) {
                    this.last = item;
                    let isPoint = [ 'waterLogging', 'fireDanger' ].includes(item.type);
                    // 切换内涝与森林火险，默认参数‘past12’
                    if (isPoint) this.param.pfmtype = 'past12'
                    const slider = Object.assign({}, MD.slider[item.type]);
                    const level = Object.assign({}, MD.level[item.type]);
                    this.slider = { status, data: slider.model ? slider : null };
                    this.param.filestr = [];
                    this.updateParam([ 'level', { status, data: level, callback: this.selectLevel } ]);
                    this.updateParam([ 'model', { status, type: item.type } ]);
                    this.setImageParam();
                } else {
                    this.slider = { status, data: null };
                    this.last = null;
                    this.updateParam([ 'level', { status, data: null, callback: null } ]);
                    this.updateParam([ 'model', { status, type: null } ]);
                    this.updateParam([ 'tip', { model: { status: false } } ]);
                }
                // 定制模型的poi
                this.updateParam([ 'baseInfo', { poiStatus: status, poi: item.poiArr } ]);
            });
        },

        /**
         * 选择子类型,切换图例
         * @param {Object} typeObj 子类型对象
         */
        selectType(typeObj) {
            let { cType, legend = '' } = typeObj;
            let { status, type: model } = this.last;
            let fallzoneStatus = (legend === 'fallzone');
            if (!!legend) legend = legend.replace(legend[0], legend[0].toUpperCase());
            let level = MD.level[model + legend] ? MD.level[model + legend] : MD.level[model];
            // Object.keys(level).sort((a, b) => { return b - a }).forEach((key) => { tempLevel[key] = level[key] });
            // level = Object.assign({}, level);
            this.last.legend = legend;
            this.param.pfmtype = cType;
            this.updateParam([ 'level', { status, data: level, callback: this.selectLevel } ]);
            this.updateParam([ 'model', { fallzone: fallzoneStatus } ]);
            this.setImageParam();
            if (this.poiPopType === 'model' || this.poiPopType === 'modelSpecific') {
                const t = this.callbackActiveType();
                this.removeSelectPoint('normal', t.normal);
                this.updateParam([ 'normalPoiDetail', { type: '' } ]);
            }
        },

        /**
         * 渲染色斑图
         */
        setImageParam() {
            if (!!this.last) {
                window.clearTimeout(this.lazyTimer);
                this.lazyTimer = window.setTimeout(() => {
                    const type = this.last.type;
                    let legend = this.last.legend;
                    let arr = this.param.filestr;
                    let analysis = true;
                    if (utils.isEmptyArray(arr)) {
                        let level = MD.level[type + legend] ? MD.level[type + legend] : MD.level[type];
                        // 判断是否是数组，如果是数组就获取数组对象中的图例值。
                        const isArray = Array.isArray(level);
                        arr = isArray ? level.map(item => item.val) : Object.keys(level);
                        analysis = false;
                    };

                    const pType = this.param.pfmtype;
                    const sysTime = this.sysTime;
                    const pfmtype = pType || type;

                    let dateTime = null;
                    let timeStr = null;
                    let mapKey = null;

                    const isPollutant = pfmtype.indexOf('pollution') !== -1 || pfmtype.indexOf('pollutant') !== -1;

                    if (isPollutant) {
                        mapKey = 'pollutantDispersion';
                        dateTime = this.param.ddatetime;
                        timeStr = TU(this.param.ddatetime).format('YYYY年MM月DD日HH时');
                    } else {
                        mapKey = pfmtype;
                        dateTime = MD.time(type, pType, sysTime);
                        timeStr = MD.timeStr(type, mapKey, sysTime);
                    }

                    let param = null;
                    const isPoint = [ 'waterLogging', 'fireDanger' ].includes(type);
                    if (isPoint) {
                        let levels = arr.join(',');
                        let modelType = type;
                        let shareObj = {
                            code: this.code,
                            dateTime: TU(dateTime).format('YYYY-MM-DD HH:mm:ss')
                        };
                        // 注意标记的三目运算,为了处理森林火险的参数
                        param = (type === 'fireDanger')
                            ? Object.assign({}, shareObj, { levels, modelType, pfmType: pfmtype })
                            : Object.assign({}, shareObj, { filestr: levels, pType: modelType, pfmtype });
                    } else {
                        // 注意标记-模型联调需要注意修改，由于后端请求所带的参数不同。目前还涉及到落区的图
                        // const filter = [ 'heavyRainfall', 'gale', 'temp', 'fireDanger', 'waterLogging', 'stormTide', 'mt', 'mountainTorrents', 'pollutantDispersion' ];
                        // param = (filter.indexOf(type) === -1) ? { ddatetime: dateTime, respTime: this.param.respTime, filestr: arr.join(','), pfmtype, analysis }
                        param = { code: this.code, dateTime: TU(dateTime).format('YYYY-MM-DD HH:mm:ss'), modelType: pfmtype, levels: arr.join(','), analysis, pType: type };
                    }

                    if (!isPollutant) {
                        const data = MD.mapping[mapKey];
                        // 注意此处为三目运算
                        const name = 'past24,past12,past6,past0,future1,future2,future3'.indexOf(mapKey) !== -1 ? data.text + MD.mapping[type].text : data.text;
                        // 内涝与火险组合类型英文名。
                        const ename = isPoint ? MD.mapping[type].etext + data.etext : data.etext;
                        this.updateParam([ 'tip', { model: { status: true, name: name, time: timeStr, ename: ename } } ]);
                    }
                    this.updateParam([ 'model', { status: true, param: param } ]);
                }, 100);
            }
        },

        /**
         * 隐藏更多模型
         */
        hideMore() {
            this.hide = !this.hide;
        },

        /**
         * 选择等级
         * @param {array} arr 等级
         */
        selectLevel(arr) {
            this.param.filestr = arr;
            if ((this.poiPopType === 'model' || this.poiPopType === 'modelSpecific') && (this.lastLevel.split(',').length > arr.length)) {
                const t = this.callbackActiveType();
                this.removeSelectPoint('normal', t.normal);
                this.updateParam([ 'normalPoiDetail', { type: '' } ]);
            }
            this.updateParam([ 'level', { dataString: arr.join(',') } ]);
            this.lastLevel = arr.join();
            this.setImageParam();
        },

        /**
         * 选择污染扩散模型
         * @param {object} param 图片参数
         */
        selectPD(param) {
            this.param.pfmtype = param.pfmtype;
            this.param.ddatetime = param.ddatetime;
            this.setImageParam();
        },

        higherZIndex(e) {
            // e.currentTarget.style.zIndex = ++WD.zIndex;
        }
    },
    mounted() {}
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.icon-chose:before {
    position: absolute;
    right: 1px;
    top: 3px;
}

.model {
    position: absolute;
    top: 0;
    left: 0;
    width: auto;
    height: 66px;
    z-index: @panel-index;

    background-color: #fff;
    box-shadow: @shadow;

    .list {
        float: left;

        .more {
            display: inline-block;
        }

        ul {
            display: inline;
            li {
                float: left;
                width: 66px;
                height: 66px;
                position: relative;

                cursor: pointer;
                text-align: center;

                &:hover, &.selected {
                    background-color: @title-color;
                }

                &>i {
                    cursor: pointer;
                    background: url("../../assets/img/model/unslider.png") no-repeat center center;
                    position: absolute;
                    bottom: 0;
                    right: 0px;
                    display: block;
                    width: 15px;
                    height: 15px;
                }

                &>i.selected {
                    background: url("../../assets/img/model/slider.png") no-repeat center center;
                }

                .item-info {
                    width: 66px;
                    height: 46px;
                    // position: relative;
                    background-size: auto 74%!important;
                    background-repeat: no-repeat;
                    background-position: 50%;

                    &.gale {
                        background-image: url('../../assets/img/model/gale.png');
                    }
                    &.heavyRainfall {
                        background-image: url('../../assets/img/model/heavyRainfall.png');
                    }
                    &.temp {
                        background-image: url('../../assets/img/model/temp.png');
                    }
                    &.mountainTorrents {
                        background-image: url('../../assets/img/model/mountainTorrents.png');
                    }
                    &.waterLogging {
                        background-image: url('../../assets/img/model/waterLogging.png');
                    }
                    &.mt {
                        background-image: url('../../assets/img/model/mt.png');
                    }
                    &.stormTide {
                        background-image: url('../../assets/img/model/stormTide.png');
                    }
                    &.pollutantDispersion {
                        background-image: url('../../assets/img/model/pollutantDispersion.png');
                    }
                    &.fireDanger {
                        background-image: url('../../assets/img/model/fireDanger.png');
                    }

                }
            }
        }
    }

    .toggle {
        width: 16px;
        float: left;
        cursor: pointer;

        &:hover {
            background-color: @title-color;
        }
        &:before {
            font-size: 18px;
            line-height: 66px;
        }
    }

    .hidecls-enter-active, .hidecls-leave-active {
        width: 330px;
        transition: width 0.5s;
    }

    .hidecls-enter, .hidecls-leave-to {
        width: 0px;
    }

}

.big .model {
    height: 94px;
    .list {
        ul li {
            width: 100px;
            height: 94px;
            div {
                width: 100px;
                height: 64px;
            }
        }
        .more {
            width: 500px;
        }
    }
    .icon-prev::before, .icon-next::before {
        line-height: 94px;
    }
}

</style>
