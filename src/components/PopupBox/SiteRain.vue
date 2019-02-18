<template>
    <div class="rain-panel">
        <!--雨量交互操作布局-->
        <div class="rain-interaction">
            <div class="time-select">
                <label>选择时间：</label>
                <!-- <v-select :list="pastTimes" :tip="pastTimes[0].text" @select="setTimeOption"></v-select> -->
                <v-dropdown :list="pastTimes" :tip="pastTimes[0].text" class="dropdown-site-rain" @select="setTimeOption"></v-dropdown>
                <a @click="openPageTable()" class="btn hover">详细列表</a>
            </div>
            <div :class="['clearfix', 'time-chose']">
                <label>时间范围：</label>
                <ul class="time-list">
                    <li class="timedate">
                        <span>从</span>
                        <input id="site-begin-time" type="text" :value="times[0]" @click="initTimePicker('begin')" readonly="readonly" />
                    </li>
                    <li class="timedate">
                        <span>至</span>
                        <input id="site-end-time"  type="text"  :value="times[1]" @click="initTimePicker('end')" readonly="readonly" />
                    </li>
                </ul>
            </div>
            <div class="rain-scope clearfix">
                <label class="rain-chose-title">雨量范围：</label>
                <div class="rain-chose">
                    <div class="slider">
                        <span class="num">{{rainMin}}</span>
                        <div class='container'>
                            <vue-slider
                                ref='site-slider'
                                v-model="sliderRangeValue"
                                v-bind="sliderOptions">
                            </vue-slider>
                        </div>
                        <span class="num">{{rainMax}}</span>
                    </div>
                    <div class="except">
                        <input class="checkbox" id="range" type="checkbox" v-model="rainExcept"/>
                        <label for="range">250以上</label>
                        <a class="btn hover inline-block" @click="setRanges()">查询</a>
                    </div>
                </div>
            </div>
        </div>
        <!--雨量数据展示布局-->
        <div class="rain-list">
            <!--雨量信息-->
            <div class="rain-table">
                <label>雨量信息（单位：mm）</label>
                <div class="rain-content">
                    <div class="city" @mouseleave="hideTable($event)">
                        <v-rain-table
                            :mark="'city'"
                            :title="infoTitle"
                            :dataItems="infoData"
                            :genus="'county'"
                            :height= "bigScreen ? '94' : '122'"
                            @genusInfo="setRainInfo"
                            @touch="getCountArea"
                            class="rain-table-city">
                        </v-rain-table>
                    </div>
                    <div class="county" v-if="countyStatus" :style="{left: bigScreen?'-424px':'-318px'}" @mouseleave="hideTable($event)">
                        <v-rain-table
                            :mark="'county'"
                            :title="infoTitle"
                            :dataItems="countyData"
                            :genus="'town'"
                            @genusInfo="setRainInfo"
                            :height= "'122'"
                            @touch="getCountArea">
                        </v-rain-table>
                    </div>
                    <div class="town" v-if="townStatus" :style="{left: bigScreen?'-847px':'-635px'}" @mouseleave="townStatus=false">
                        <v-rain-table
                            :mark="'town'"
                            :title="infoTitle"
                            :genus="'village'"
                            :dataItems="townData"
                            :height= "'122'"
                            @touch="getCountArea">
                        </v-rain-table>
                    </div>
                </div>
            </div>
            <!--量记统计-->
            <div class="rian-count">
                <label>量级统计（单位：mm）</label>
                <v-rain-table
                    :mark="'count'"
                    :title="countTitle"
                    :dataItems="countData"
                    :genus="'count'"
                    :height= "'100'"
                    @touch="getCountRange">
                </v-rain-table>
            </div>
        </div>
        <!--自动站雨量弹出框-->
        <div class="range-detail"
            :style="{left: bigScreen?'-426px':'-319px'}"
            v-if="infoCountStatus">
            <a class="close" @click="infoCountStatus= false"></a>
            <v-rain-table
                :mark="'range-detail'"
                :title="magnitudeTitle"
                :dataItems="magnitudes"
                :genus="''"
                :subset="''"
                :height= "'100'"
                @touch="selectSite">
            </v-rain-table>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import RainTable from '../Plugins/RainTable';
import vueSlider from 'vue-slider-component';
import Dropdown from '../Plugins/Dropdown';

export default {
    props: [
        'pickBeginTime',
        'pickEndTime'
    ],
    components: {
        'v-rain-table': RainTable,
        'v-dropdown': Dropdown,
        vueSlider
    },
    data() {
        return {
            // 初始化时间
            time: {},
            // 降雨过去时间
            pastTimes: [
                { 'value': '-15', 'text': '过去15分钟' },
                { 'value': '-30', 'text': '过去30分钟' },
                { 'value': '-60', 'text': '过去1小时' },
                { 'value': '-180', 'text': '过去3小时' },
                { 'value': '-360', 'text': '过去6小时' },
                { 'value': '-720', 'text': '过去12小时' },
                { 'value': '-1440', 'text': '过去24小时' }
            ],
            status: true,
            // 过去时间
            pastTime: '',
            // 时间选项参数
            option: {},
            // 时间定义
            tps: false,
            // 雨量最小值
            rainMin: 0,
            // 雨量最大值
            rainMax: 250,
            // 雨量超值开关
            rainExcept: false,
            // 雨量信息表格标题
            infoTitle: {areaName: '地区', siteCount: '站点数量', maxRain: '最高降雨', avgRain: '平均降雨'},
            // 雨量统计表格表格
            countTitle: {rainRange: '雨量范围', siteCount: '站点数量', percent: '所占百分比'},
            // 雨量信息表格数据
            infoData: {},
            // 城区雨量统计模板开关
            countyStatus: false,
            // 城区雨量信息
            countyData: {},
            // 乡镇雨量统计模板开关
            townStatus: false,
            // 乡镇雨量信息
            townData: {},
            // 雨量统计信息模板开关
            infoCountStatus: false,
            // 雨量统计数据
            countData: {},
            // 量记站点信息标题
            magnitudeTitle: {siteCode: '站点号', siteName: '站点名称', rainValue: '雨量'},
            // 量记站点信息
            magnitudes: [],
            // 请求链接
            requestLink: {
                rainForm: sysconfig.TESTPATH + '/realTimeMonitor/getSiteRainCount',
                rainCount: sysconfig.TESTPATH + '/realTimeMonitor/getSiteRainDetail'
            },
            // 请求参数
            params: {
                areaCode: '',
                queSelectTime: 0,
                times: [],
                ranges: [0, 250]
            },
            // 中间区域编码
            tempAreaCode: '',
            sliderRangeValue: [0, 250],
            sliderOptions: {
                'tooltip': false,
                'width': '100%',
                'height': 5,
                'min': 0,
                'max': 250,
                'dot-size': 12,
                'speed': 0,
                'piecewiseStyle': {
                    'backgroundColor': '#ccc',
                    'visibility': 'visible',
                    'width': '6px',
                    'height': '6px'
                }
            },
            timerHide: null
        }
    },
    computed: {
        ...mapState({
            sysCode: state => {
                let code = state.sys.code;
                if (code.length < 4) code += '0000';
                // else if (code.length < 6) code += '00';
                return code;
            },
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 5);
            },
            code: state => state.sys.code,
            staticParams: state => state.site.staticParams,
            siteSubPanelCallback: state => state.site.SiteSubPanelCallback, // 面板点击回调请求数据
            removeSelectPoint: state => state.selectPoint.remove,
            bigScreen: state => state.toolsBar.bigScreen
        }),

        times() {
            let timeAry = [];
            let reqTime = [];
            if (this.time) {
                for (let val of Object.values(this.time)) {
                    timeAry.push(TU(val).format('YYYY-MM-DD HH:mm:ss'));
                    reqTime.push(TU(val).format('YYYYMMDDHHmmss'));
                }
                this.params.times = reqTime;
            }
            return timeAry
        }
    },
    watch: {
        sliderRangeValue: {
            deep: true,
            handler() {
                this.$nextTick(() => {
                    this.rainMin = this.sliderRangeValue[0];
                    this.rainMax = this.sliderRangeValue[1];
                });
            }
        },
        pickBeginTime(val) {
            this.time['begin'] = TU(new Date(val)).split();
        },
        pickEndTime(val) {
            this.time['end'] = TU(new Date(val)).split();
        },
        pastTime(val) {
            let {end} = this.time;
            let newTime = TU(TU().toDate(end)).min(val).split();
            this.time['begin'] = newTime;
        },
        rainExcept(status) {
            if (!status) this.params.ranges = [this.rainMin, this.rainMax];
        },
        params: {
            handler(params) {
                let {areaCode, queSelectTime, times, ranges} = params;
                if (!utils.isEmptyArray(times) && !utils.isEmptyArray(ranges)) {
                    let [startTime, endTime] = times;
                    let [rainRangeStart, rainRangeEnd] = ranges;
                    let tempParams = {
                        code: areaCode,
                        qSelectTime: queSelectTime,
                        startTime,
                        endTime,
                        rainRangeStart,
                        rainRangeEnd
                    };
                    let tempObj = (!!Object.keys(this.staticParams)[0]) ? Object.assign(this.staticParams, tempParams) : tempParams;
                    this.updateParam([ 'site', {staticParams: tempObj} ]);
                    this.getRespond({code: areaCode, quickSelectTime: queSelectTime, startTime, endTime, rainRangeStart, rainRangeEnd});
                }
                // 雨量弹出框
                if (this.infoCountStatus) this.setMagnitudes(this.sysCode);
            },
            deep: true
        },
        sysMinTime() {
            this.initTime();
        },
        code() {
            this.params.areaCode = this.sysCode;
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /*
            *初始化日历时间，取当前时间的整点
        */
        initTime() {
            let wholeTime = new Date(TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss'));
            let endTime = TU(wholeTime).split();
            let pastTime = (!!this.pastTime ? this.pastTime : '-15');
            let beginTime = TU(wholeTime).min(parseInt(pastTime)).split();
            let computedTime = {
                begin: beginTime,
                end: endTime
            }
            this.time = computedTime;
        },
        /*
            *初始化日历选项，开始时间与结束时间
            *@param type 类型（ beign与 end ）
            *
        */
        initTimePicker(type) {
            let option = {
                id: 'site-' + type + '-time',
                type: type,
                top: 30,
                template: 'YYYY-MM-DD HH:mm:ss',
                date: TU(this.time[type]).format('YYYY-MM-DD HH:mm:ss'),
                lock: { min: false, sec: true }
            }
            this.$emit('timeclick', {tps: true, option: option});
        },
        /*
            *设置阈值滑动条数据
            *
        */
        setRanges() {
            let rainMin = this.rainMin;
            let rainMax = this.rainMax;
            if (this.rainExcept) {
                rainMin = 250;
                rainMax = 9999;
            }
            this.params.ranges = [rainMin, rainMax]
        },
        /*
            *设置降雨展示的表格“属性”值
            *@param object 为子组件分发过来参数。{type：类型， status：状态, subset: 子集数据}
            *
        */
        setRainInfo(object) {
            if (Object.keys(object) !== 0) {
                let {type, status, subset} = object;
                this[type + 'Status'] = status;
                if (!!subset) {
                    let {areaList, areaCode} = subset;
                    this[type + 'Data'] = areaList;
                    this.tempAreaCode = areaCode;
                }
            }
        },
        /*
         * 设置下拉框选项
         *
         */
        setTimeOption(param) {
            let {value} = param;
            this.pastTime = value;
        },
        /*
         * 设置自动站属性
         */
        selectSite(item) {
            let {subset} = item;
            if (!subset) return;
            this.siteSubPanelCallback(subset);
            this.removeSelectPoint('monitor', 'site');
        },
        /*
        * 设置量记弹出框请求参数
        * @param areaCode 地域编码
        */
        setMagnitudes(areaCode) {
            let {queSelectTime, times, ranges} = this.params;
            let [startTime, endTime] = times;
            let rainRangeStart = ranges[0];
            let rainRangeEnd = ranges[1];
            let params = {code: areaCode, rainRangeStart, rainRangeEnd, quickSelectTime: queSelectTime, startTime, endTime, dateTime: ''};
            utils.GET(this.requestLink.rainCount, params).then((json) => {
                let {data} = json;
                if (!data) return;
                let {rainDetail} = data;
                this.magnitudes = rainDetail;
            })
        },
        /*
            *根据各市县级获取自动站
        */
        getCountArea(obj) {
            if (Object.keys(obj) === 0) return;
            let {type, subset} = obj;
            let {areaCode} = subset;
            areaCode = (type === 'village') ? (this.tempAreaCode + '_' + areaCode) : areaCode;
            this.infoCountStatus = true;
            this.setMagnitudes(areaCode);
        },
        /*
            *获取量级统计阈值
            *@param obj 可以是字符串等
        */
        getCountRange(obj) {
            if (Object.keys(obj) === 0) return;
            let {subset} = obj;
            let {rainRange: ranges} = subset;
            if (!!ranges) {
                this.infoCountStatus = true;
                ranges = ranges.split('-');
                this.params.ranges = [ranges[0], ranges[1]];
                this.setMagnitudes(this.sysCode);
            }
        },
        /*
            *获取数据链接
            *@param params 数据接口所用到请求参数
        */
        getRespond(params) {
            utils.GET(this.requestLink.rainForm, params).then((json) => {
                let {data} = json;
                this.infoData = {};
                if (!data) return;
                let {map: dataMap} = data;
                let infoData = dataMap['雨量信息'];
                let countData = dataMap['量级统计'];
                this.infoData = infoData;
                this.countData = countData;
            })
        },
        /*
            *鼠标移动隐藏面板
            *@event mouseleaveout
            *@type 类型状态
        */
        hideTable(event, type) {
            if (this.timerHide) clearTimeout(this.timerHide);
            this.timerHide = setTimeout(() => {
                if (!event) return;
                // 获取鼠标移动的父节点
                let dom = event.relatedTarget.parentNode;
                // 定义规则
                let rules = ['county', 'town'];
                // 循环查找父节点
                while (dom && dom.className !== 'rain-info-table') {
                    if (!dom.parentNode) {
                        for (let type of rules) {
                            this[type + 'Status'] = false;
                        }
                        break;
                    }
                    dom = dom.parentNode;
                }
            }, 1000);
        },
        /*
            *打开分页面板
        */
        openPageTable() {
            this.$emit('open')
        }
    },
    mounted() {
        this.initTime();
        this.params.areaCode = this.sysCode;
    }
}
</script>

<style lang='less' scoped>
@import "../../assets/css/common.less";
.btn {
    box-sizing: border-box;
}
.rain-panel {
    position: relative;
}

.rain-interaction {
    padding: 10px 5px;
}

.time-select {
    .height();

    &.div-select {
        width: 150px;
    }
    label {
        float: left;
    }
}

.time-chose {
    margin: 5px 0px;
    // font-size: 12px;

    label {
        .height();
        vertical-align: top;
        float: left;
    }
    .time-list {
        width: 224px;
        float: left;

        .timedate {
            position: relative;
            width: 100%;
            border: 1px solid #ccc;
            margin-bottom: 4px;
            padding: 2px 4px;
            .height();

            input {
                width: 190px;
                cursor: pointer;
                border: none;
                color: #414e61;
                vertical-align: top;
                .height();
                box-sizing: border-box;
            }
            span {
                margin-right: 5px;
            }
        }
    }
}

.rain-scope {
    label {
        .height();
    }
}
.rain-chose-title {
    float: left;
    display: inline-block;
    height: 22px;
    line-height: 22px;
}

.rain-chose {
    float: left;
    height: 22px;
    line-height: 22px;
}

.rain-slider {
    width: 80px;
    margin: 6px 0px 4px 5px;
    height: 6px;
    border: 1px solid #ccc;
    float: left;
}

.slider {
    position: relative;
    float: left;
    width: 87px;
    margin-left: 5px;
    margin-top: 2px;

    .num {
        display: inline-block;
        text-align: left;
        width: 20px;
        position: absolute;
        bottom: -18px;
        left: 70px;
    }
    .num:first-child {
        left: 3px;
    }
}

.except {
    margin-left: 30px;
    float: left;
}

.rain-list {
    position: relative;
    clear: both;

    table {
        tr {
            .height();
            td {

            }
        }
        thead {
            tr {
                td {

                }
            }
        }
        tbody {
            tr {
                td {

                }
            }
        }
    }
    .rain-table {
        color: @select-font-color;
        label {
            display: block;
            .height();
            margin-left: 4px;
        }

        .rain-content {
            position: relative;
        }
    }

    .county {
        position: absolute;
        top: 0;
        width: auto;
        overflow: hidden;
        height: auto;
    }
    .town {
        position: absolute;
        top: 0;
        width: auto;
        overflow: hidden;
        height: auto;
    }

    #rain-count {
        height: 100px;
    }

}
.rian-count {
    color: @select-font-color;
    // padding: 15px 0px 0px 0px;
    position: relative;
    clear: both;
    // height: 120px;
    overflow: hidden;
    width: auto;
    label {
        .height();
        margin-left: 4px;
    }
}
.range-detail {
    position: absolute;
    bottom: 0px;
    width: auto;
    // height: 100px;
    overflow: hidden;
    .rain-info-table {
        box-shadow: 0px 2px 0px 0 rgba(0, 0, 0, 0.3);
    }
}
.title {
    font-size: 12px;
    letter-spacing: 1px;
}

.big {
    .time-select {
        .height(@height-big);
    }

    .time-chose {
        label {
            .height(@height-big);
        }

        .time-list {
            width: 274px;

            .timedate {
                .height(@height-big);

                input {
                    width: 240px;
                    font-size: 20px;
                    .height(@height-big);
                }
            }
        }
    }

    .rain-scope {
        label {
            .height(@height-big);
        }
    }

    .rain-list {
        .rain-table {
            label {
                .height(@height-big);
            }
        }
    }

    .rian-count {
        label {
            .height(@height-big);
        }
    }

    .btn {
        .height(@height-big);
    }

    .slider {
        .num {
            bottom: -22px;
            left: 66px;
            &:first-child {
                left: 1px;
            }
        }
    }

}
</style>
