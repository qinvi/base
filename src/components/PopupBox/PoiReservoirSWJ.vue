<template>
    <!-- 水库（水文局） -->
    <div class="hydrology hover" id="hydrology" ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">
            <label>水库名称-{{ reservoir.name }}</label>
        </div>
        <div class="top">
            <div class="left">
                <div class="update-time">最新水位：{{ reservoir.time }}</div>
                <div :class="[ level_over ? 'over-warning' : 'over-warn' ]">
                    <em></em>超汛限水位：{{ reservoir.over }}m
                </div>
                <div :class="[ level_over ? 'outimg' : 'img' ]">
                    <div class="xx-level">
                        <label>汛限</br>水位</label>
                        <span>{{ reservoir.warn + 'm' }}</span>
                    </div>
                    <div class="now-level">
                        <label>当前</br>水位</label>
                        <span>{{ reservoir.now + 'm' }}</span>
                    </div>
                    <div class="storage">
                        <label>蓄水量：</label>
                        <span>{{ reservoir.storage }}万m³</span>
                    </div>
                </div>
            </div>
            <div class="right">
                <div class="base-info">
                    <div class="title">
                        <label>
                            <em></em>水库基本信息</label>
                    </div>
                    <div class="table-info">
                        <table>
                            <tr>
                                <td class="tdl">站名&nbsp;</td>
                                <td class="tdr" :title="reservoir.name">&nbsp;{{ reservoir.name }}</td>
                                <td class="tdl">站码&nbsp;</td>
                                <td class="tdr" :title="reservoir.code">&nbsp;{{ reservoir.code }}</td>
                            </tr>
                            <tr>
                                <td class="tdl">站址&nbsp;</td>
                                <td class="tdr" :title="reservoir.address">&nbsp;{{ reservoir.address }}</td>
                                <td class="tdl"></td>
                                <td class="tdr"></td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div class="charts">
                    <div class="chart-title">
                        <em class="logo"></em>水库水位雨量变化图</div>
                        <div class="reservoirBottom">
                            <div class="waterRain">
                                <ul class="waterRainLegend clearfix">
                                    <li>
                                        <label style="margin-right: 10px;">水位(m)</label>
                                        <label>累计雨量(mm)：</label>
                                        <span class="gust">过去</span>
                                        <span class="for">未来</span>
                                    </li>
                                    <li>
                                        <span class="ww">水库水位</span>
                                        <span class="outy">超汛限</span>
                                        <span class="warn">汛限水位</span>
                                    </li>
                                </ul>
                            </div>
                            <v-watercharts :waterChart="waterChart" v-if="!!waterChart"></v-watercharts>
                        </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              Reservoir list
 * ----------------------------------------------------------------------------
 * packData                 - 水库数据组装
 * createChartData          - 图表数据组装
 * initConstData            - 初始化不需要setter的参数
 * close                    - 关闭
 * getMaxMin                - 获取图表y軕的max值和min值
 */
import { mapActions, mapState } from 'vuex';
import WaterCharts from '../Plugins/WaterCharts';
import WinDrag from '../../utils/tools/WinDrag.js';
export default {
    name: 'PoiReservoirSWJ',
    components: {
        'v-watercharts': WaterCharts
    },
    data() {
        return {
            reservoir: {},
            level_over: false,
            waterChart: null // 图表数据
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime,
            removeSelectPoint: state => state.selectPoint.remove,
            activeCode: state => state.selectPoint.areaCode,
            reserviorType: state => state.reservoirDetails.type,
            json: state => state.reservoirDetails.data
        })
    },
    watch: {
        json(data) {
            if (!data) return;
            if (this.reserviorType === 'reservoirsSWJ') this.packData();
        },
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 数据组装
         */
        packData() {
            const detail = this.json.data.reservoirDetail;
            this.reservoir = {
                time: TU(detail.updateTime).format('YYYY-MM-DD HH:00:00'),
                name: detail.reservoirName.replace('水库名称-', ''),
                address: detail.reservoirAddress,
                code: detail.code,
                now: this.format(detail.curWater),
                storage: this.format(detail.storage),
                warn: this.format(detail.warnWater)
            };
            if (isNaN(this.reservoir.now)) {
                this.reservoir.now = '--';
            }
            if (isNaN(this.reservoir.warn)) {
                this.reservoir.warn = '--';
            }
            let over = this.reservoir.now - this.reservoir.warn;
            this.reservoir.over = over ? over.toFixed(2) : '--';
            this.level_over = (this.reservoir.now > this.reservoir.warn);
            this.packChartData(detail);
        },

        /**
         * 图表数据请求
         */
        packChartData(detail) {
            const param = {
                'code': this.code,
                'reservoirId': detail.reservoirCode,
                'dateTime': TU(detail.updateTime).format('YYYY-MM-DD HH:mm:ss')
            }
            utils.GET(this.poiUrls.warnUrl, param).then((json) => { // 图表数据请求
                this.createChartData(detail, json.data.waterAndRainList);
            });
        },

        /**
         * 图表数据组装
         *
         * @param {object} detail
         * @param {object} data 组合过的图表数据
         */
        createChartData(detail, data) {
            let levelArr = []; // 等级
            let pastArr = []; // 过去数据
            let futureArr = []; // 将来数据
            let dashData = []; // 虚线数据

            if (!data[0]) {
                pastArr = ['', '', '', '', '', '', '', '', '', ''];
                futureArr = ['', '', '', '', '', '', '', '', '', ''];
                levelArr = ['', '', '', '', '', '', '', '', '', ''];
            } else {
                for (let i = 0; i < 5; i++) {
                    let waterlevel = this.format(data[i].waterlevel);
                    levelArr.push(waterlevel);
                    pastArr.push(this.format(data[i].rainfall));
                }
                pastArr = pastArr.concat([null, null, null, null, null]);

                for (let i = 5; i < 10; i++) {
                    let waterlevel = this.format(data[i].waterlevel);
                    levelArr.push(waterlevel);
                    futureArr.push(this.format(data[i].rainfall));
                }
                futureArr = [null, null, null, null, null].concat(futureArr);
            }

            dashData = this.interpolateMissingValues(levelArr, this.reservoir.warn)

            const cid = 'hydrology-charts';
            let warnlevel = detail.warnWater;
            const timeArr = ['-24h', '-12h', '-6h', '-3h', '-1h', '1h', '3h', '24h', '48h', '72h'];
            const updatetime = detail.updateTime;
            // const updatetime = TU(this.sysTime).format('YYYY-MM-DD HH:mm');
            if (!warnlevel) warnlevel = '--';
            const [max, min] = this.getMaxMin(levelArr, warnlevel);
            const zone = warnlevel === '--' ? max : warnlevel;
            const past = {
                name: '过去累计雨量(mm)',
                list: pastArr
            };
            const future = {
                name: '未来累计雨量(mm)',
                list: futureArr
            };
            const level = {
                name: '实测水库水位(m)',
                list: levelArr
            }
            const forecast = {
                name: '估测水库水位(m)',
                list: dashData
            }
            this.waterChart = {forecast, timeArr, zone, max, min, past, future, level, cid, warnlevel, updatetime};
        },

        /**
         * 获取图表y軕的max值和min值
         *
         * @param {array} level 等级数组
         * @param {nunmber} warn 预警值
         */
        getMaxMin(level, warn) {
            const warnLevel = Number(warn) || 0;
            const interval = 0.1;
            let copy = [...level];
            copy = copy.filter((a, b) => {
                return Object.prototype.toString.call(a) === '[object Number]';
            }).sort((a, b) => {
                return b - a;
            });
            if (!copy.length) {
                return [0, 0];
            }
            let maxmax = Number((copy[0] + interval).toFixed(2));
            let minin = Number((copy[copy.length - 1] - interval).toFixed(2));
            let max = 10;
            let min = 0;
            if (warnLevel > 0) { // 预警值大于0情况
                let warnHigh = Number((warnLevel + interval).toFixed(2));
                let warnLow = Number((warnLevel - interval).toFixed(2));
                max = maxmax > warnHigh ? maxmax : warnHigh; // y轴最大值
                min = minin < warnLow ? minin : warnLow;
            } else {
                max = maxmax; // y轴最大值
                min = minin;
            }
            return [max, min];
        },

        /**
         * 取代null值
         *
         * @param {string/null} i 待取代的值
         * @param {object} data 源数据
         */
        replaceNull(data, i) {
            if (i >= data.length) return 0

            let temp;
            if (!!data[i + 1] || data[i + 1] === 0) {
                temp = this.format(data[i + 1].waterlevel);
            } else {
                temp = this.format(data[0].waterlevel);
            }
            if (!temp && temp !== 0) {
                return this.replaceNull(data, i + 1);
            } else {
                return temp;
            }
        },

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.poiUrls = {
                warnUrl: sysconfig.TESTPATH + '/realTimeMonitor/listWaterAndRainInfo'
            };
        },

        /**
         * 关闭
         */
        close() {
            this.removeSelectPoint('monitor', 'RESERVOIR_SWJ');
            this.updateParam([ 'reservoirsSWJ', { detail: false } ]);
            this.updateParam([ 'reservoirDetails', { type: null, data: null } ]);
        },

        /**
         * 数据转换
         *
         * @param {string} val 待转换的值
         */
        format(val) {
            return (!val || Number(val) > 1000 || Number(val) < -1000 || val === 'null') ? null : Number(val);
        },

        /*
         * 计算估测水位
         *
         * @param {number[]} dataArray 实测水位数据
         * @param {number} warningLevel 警戒水位
         */
        interpolateMissingValues: function (dataArray, warningLevel) {
            let interpolatedValues = []

            dataArray = dataArray.map(data => data === '' ? null : data)

            if (!dataArray.every(item => item === null)) {
                let segStartIdx = -1
                let segEndIdx = -1
                let segment = []
                let segStartLevel
                let segEndLevel
                let continuousData = []

                dataArray.forEach((level, idx) => {
                    if (level === null) {
                        if (segStartIdx < 0) {
                            let prevLevel = null

                            if (segment.length > 0) {
                                segment = []
                                prevLevel = dataArray[idx - 1]

                                if (continuousData.length > 0) {
                                    segment.unshift({ x: idx - 1, y: prevLevel })
                                }

                                segStartLevel = level
                                segStartIdx = idx - 1
                            } else if (continuousData.length > 0) {
                                segment = []
                                prevLevel = dataArray[idx - 1]
                                segment.unshift({ x: idx - 1, y: prevLevel })
                                segStartLevel = level
                                segStartIdx = idx - 1
                            }

                            segStartIdx = prevLevel !== null ? idx - 1 : idx
                            segStartLevel = prevLevel !== null ? prevLevel : level

                            if (idx < dataArray.length - 1) {
                                segment.push({ x: idx, y: level })
                            }
                        } else {
                            segment.push({ x: idx, y: level })
                        }

                        continuousData = []
                    }

                    if (level !== null || idx >= dataArray.length - 1) {
                        continuousData.push([idx, level])
                        if (segStartIdx >= 0) {
                            segEndIdx = idx
                            segEndLevel = level
                            segment.push({ x: idx, y: level })

                            if (segment[0].y === null) {
                                segment.forEach((item) => {
                                    item.y = segEndLevel
                                })
                            } else if (segment[segment.length - 1].y === null) {
                                segment.forEach((item) => {
                                    item.y = segStartLevel
                                })
                            } else {
                                const step = (segEndLevel - segStartLevel) / (segEndIdx - segStartIdx)
                                let currentLevel = segStartLevel

                                segment.forEach((item, idx) => {
                                    if (idx !== 0 && idx !== segment.length - 1) {
                                        item.y = +currentLevel.toFixed(2)
                                    }

                                    currentLevel += step
                                })
                            }

                            interpolatedValues = interpolatedValues.concat(segment)
                            segStartIdx = -1
                        }
                    }
                })

                const dashIndices = interpolatedValues.map(item => item.x)

                dataArray.forEach((level, idx) => {
                    if (!dashIndices.includes(idx)) {
                        interpolatedValues.splice(idx, 0, { x: idx, y: null })
                    }

                    if (level !== null) {
                        interpolatedValues.forEach((item) => {
                            if (item.x === idx) {
                                item.c_hidden = true
                            }
                        })
                    }
                })

                interpolatedValues.forEach((value) => {
                    if (value.y >= warningLevel) {
                        value.marker = {
                            lineColor: '#f00'
                        }
                    }
                })
            } else {
                interpolatedValues = []
            }

            return interpolatedValues
        }
    },
    mounted() {
        WinDrag.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        this.initConstData();
        this.packData();
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WinDrag.zIndex + 1
            WinDrag.zIndex += 1
        }
    },
    destroyed() {
        this.close();
    }
};
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';
.waterRain {
    width: 100%;
    height: auto;
    overflow: hidden;
    position: relative;
    box-shadow: @shadow;
    z-index: @pop-index;
    .waterRainLegend {
        height: auto;
        display: block;

        li {
            float: left;
            margin-left: 10px;
            .height();

            label {
                display: inline-block;
                .height();
            }

            span {
                margin-right: 8px;
                position: relative;
            }
            span:before {
                content: "";
                display: inline-block;
                vertical-align: middle;
                width: 9px;
                height: 12px;
                vertical-align: middle;
                margin-right: 3px;
                margin-top: -1px;
                position: relative;
                z-index: 2;
            }
            span.gust:before {
                background: #2F7ED8;
            }
            span.for:before {
                background: #BCBCBC;
            }
            span.ww:before,
            span.outy:before {
                background: #FFFFFF;
                width: 6px;
                height: 6px;
                margin-right: 8px;
                -webkit-border-radius: 100%;
                -moz-border-radius: 100%;
                border-radius: 100%;
            }
            span.warn:before {
                background: url("../../assets/img/common/warn-level.png") no-repeat center;
                width: 22px;
            }
            span.ww:before {
                border: 2px solid #56abe4;
            }
            span.outy:before {
                border: 2px solid red;
            }
            span.ww:after,
            span.outy:after {
                content: "";
                display: inline-block;
                height: 2px;
                width: 18px;
                position: absolute;
                left: -4px;
                top: 8px;
            }
            span.ww:after {
                background: #56abe4;
            }
            span.outy:after {
                background: red;
            }
        }
    }
    .rain-charts {
        height: 180px;
        margin-bottom: 35px;
        margin-left: 2px;
        margin-right: 0px;
    }
}

.highcharts-xaxis-grid .highcharts-grid-line {
    stroke-width: 1px;
    stroke: #d8d8d8;
}

.highcharts-xaxis .highcharts-tick {
    stroke-width: 2px;
    stroke: #d8d8d8;
}

.highcharts-minor-grid-line {
    stroke-dasharray: 2, 2;
}



/*big*/

.big .poiPop {
    width: 600px;
    top: 45px;
}

.big .waterRainLegend {
    li {
        // margin-left: 20px;
        .height(@height-big);

        label {
            .height(@height-big);
        }
        span {
            margin-right: 10px;
        }
        span:before {
            width: 12px;
            height: 16px;
            margin-top: -3px;
        }
        span.warn:before {
            background: url("../../assets/img/common/warn-level.png") no-repeat center;
            width: 22px;
        }
        span.ww:before,
        span.outy:before {
            width: 8px;
            height: 8px;
        }
        span.ww:after,
        span.outy:after {
            width: 20px;
            top: 13px;
        }
    }
}
.hydrology {
    width: 790px;
    z-index: @pop-index;
    background: #fff;
    position: absolute;
    top: 0px;
    right: 0px;
    box-shadow: @shadow;
    .top {
        position: relative;
        height: 355px;
        overflow: hidden;
        background: #fff;
        display: inline-flex;
        .left {
            width: 260px;
            margin: 0 15px;
            display: inline-block;
            .over-warning {
                color: red;
                &>em {
                    background: url('../../assets/img/common/warn-icon_over.png') no-repeat center;
                }
            }
            .over-warn {
                &>em {
                    background: url('../../assets/img/common/warn-icon.png') no-repeat center;
                }
            }
            .update-time {
                margin-top: 10px;
            }
            .storage {
                position: relative;
                left: 25%;
                top: 186px;
            }
            .xx-level {
                position: relative;
                top: 6px;
                left: 2px;
                line-height: 14px;
                label {
                    position: relative;
                    top: 10px;
                }
                span {
                    position: relative;
                    left: 5px;
                }
            }
            .now-level {
                position: absolute;
                top: 48px;
                right: 10px;
                line-height: 14px;
                label {
                    position: absolute;
                    right: 2px;
                    top: 16px;
                    width: 24px;
                }
                span {
                    position: relative;
                    right: 35px;
                    top: 20px;
                }
            }
            div {
                line-height: 22px;
                text-align: left;
                clear: both;
                em {
                    display: inline-block;
                    width: 22px;
                    height: 18px;
                    vertical-align: middle;
                    margin-top: -4px;
                }
            }
            .img {
                width: 100%;
                height: 260px;
                background: url("../../assets/img/common/sk.png") no-repeat 0 6px;
                position: relative;
            }
            .outimg {
                width: 100%;
                height: 260px;
                background: url("../../assets/img/common/sk_over.png") no-repeat 0 6px;
                position: relative;
                .now-level {
                    position: absolute;
                    top: -12px;
                    right: 10px;
                    line-height: 14px;
                    label {
                        position: absolute;
                        right: 2px;
                        top: 16px;
                        width: 24px;
                    }
                    span {
                        position: relative;
                        right: 35px;
                        top: 20px;
                    }
                }
            }
        }
        .right {
            width: 492px;
            height: auto;
            display: inline-block;
            .title {
                font-size: 14px;
                margin: 10px 0 2px 0;
                background: #FFF;
                .height();
            }
            .base-info {
                margin-bottom: 15px;
                .title em {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    vertical-align: middle;
                    margin-top: -2px;
                    margin-right: 4px;
                    background: url("../../assets/img/common/ic_base.png") no-repeat center;
                }
            }
            .table-info table {
                width: 490px;
                border: 1px solid @title-color;

                tr {
                    .height();
                    box-sizing: border-box;
                    td {
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        box-sizing: border-box;

                        &:nth-child(odd) {
                            width: 80px;
                            text-align: right;
                            padding-right: 10px;
                            border-left: 1px solid @title-color;
                            border-bottom: 1px solid @title-color;
                        }

                        &:nth-child(even) {
                            border-left: 1px solid @title-color;
                            border-bottom: 1px solid @title-color;
                        }

                        &:nth-child(1) {
                            border-left: 0;
                        }
                    }

                    &:last-child {
                        td {
                            border-bottom: 0;
                        }
                    }
                }

                thead {
                    tr {
                        td {}
                    }
                }

                tbody {
                    tr {
                        td {}
                    }
                }
                // td {
                //     .height();
                //     border: 1px solid @title-color;
                //     border-right: none;
                //     border-bottom: none;
                // }
                // tr {
                //     height: 25px;
                // }
                // tr:nth-of-type(1) td {
                //     border-top: none;
                // }
                // tr td:nth-of-type(1) {
                //     border-left: none;
                //     width: 110px;
                //     overflow: hidden;
                //     white-space: nowrap;
                //     text-overflow: ellipsis;
                // }
                // tr td:nth-of-type(2) {
                //     width: 200px;
                //     overflow: hidden;
                //     white-space: nowrap;
                //     text-overflow: ellipsis;
                // }
                // tr td:nth-of-type(3) {
                //     width: 100px;
                //     overflow: hidden;
                //     white-space: nowrap;
                //     text-overflow: ellipsis;
                // }
                // tr td:nth-of-type(4) {
                //     padding-left: 2px;
                //     width: 80px;
                //     overflow: hidden;
                //     white-space: nowrap;
                //     text-overflow: ellipsis;
                // }
                // tr .tdr {
                //     font-weight: 900;
                //     text-align: left;
                // }
                // tr .tdl {
                //     text-align: right;
                // }
            }
            .charts {
                width: 100%;
                height: auto;
                overflow: hidden;
                position: relative;

                .chart-title {
                    text-align: left;
                    font-size: 14px;
                    .height();
                    margin: 0;
                    em.logo {
                        display: inline-block;
                        width: 16px;
                        height: 16px;
                        vertical-align: middle;
                        margin-top: -4px;
                        margin-left: 6px;
                        margin-right: 4px;
                        background: url("../../assets/img/common/water-rain.png") no-repeat center;
                    }
                }
                .legend {
                    height: 34px;
                    display: block;
                    li {

                        float: left;
                        padding: 10px 0;
                        margin-left: 10px;

                        label.sign {
                            font-size: @font-normal;
                            margin-right: 6px;
                        }

                        span {
                            margin-right: 15px;
                            position: relative;
                        }
                        span:before {
                            content: "";
                            display: inline-block;
                            vertical-align: middle;
                            width: 9px;
                            height: 12px;
                            vertical-align: middle;
                            margin-right: 3px;
                            margin-top: -1px;
                            position: relative;
                        }
                        span.past:before {
                            background: #2F7ED8;
                        }
                        span.future:before {
                            background: #BCBCBC;
                        }
                        span.water-level:before,
                        span.out:before {
                            background: #FFFFFF;
                            width: 6px;
                            height: 6px;
                            margin-right: 8px;
                            -webkit-border-radius: 100%;
                            -moz-border-radius: 100%;
                            border-radius: 100%;
                        }
                        span.water-level:before {
                            border: 2px solid #56abe4;
                        }
                        span.out:before {
                            border: 2px solid red;
                        }
                        span.water-level:after,
                        span.out:after {
                            content: "";
                            display: inline-block;
                            height: 2px;
                            width: 18px;
                            position: absolute;
                            left: -4px;
                            top: 8px;
                        }
                        span.water-level:after {
                            background: #56abe4;
                        }
                        span.out:after {
                            background: red;
                        }
                        span.warn:before {
                            background: url("../../assets/img/common/warn-level.png") no-repeat center;
                            width: 26px;
                        }
                    }
                }
            }
        }
    }
}
.big {
    .hydrology {
        width: 1044px;
        height: 400px;
        .top {
            height: 430px;
            .left {
                width: 307px;
                .over-warn,
                .over-warning {
                    margin: 20px 0 10px 0;
                }
                .img,
                .outimg {
                    .xx-level {
                        top: 4px;
                        left: 10px;
                        line-height: 24px;
                    }
                    .storage {
                        left: 16%;
                        top: 190px;
                    }
                }
                .outimg {
                    width: 100%;
                    height: 260px;
                    background: url('../../assets/img/common/sk_over.png') no-repeat 30px 20px;
                    position: relative;
                    .now-level {
                        top: -6px;
                        right: 30px;
                        line-height: 24px;
                        label {
                            width: 40px;
                            left: 70px;
                        }
                        span {
                            width: 100px;
                            display: block;
                            text-align: right;
                        }
                    }
                }
                .img {
                    background: url('../../assets/img/common/sk.png') no-repeat 30px 20px;
                    .xx-level {
                        top: 4px;
                        left: 10px;
                        line-height: 24px;
                    }
                    .now-level {
                        top: 56px;
                        right: 30px;
                        line-height: 24px;
                        label {
                            width: 40px;
                            left: 70px;
                        }
                        span {
                            width: 100px;
                            display: block;
                            text-align: right;
                        }
                    }
                    .storage {
                        left: 16%;
                        top: 190px;
                    }
                }
            }
            .right {
                width: 694px;
                .table-info {
                    table {
                        width: 694px;

                        tr {
                            td {
                                .height(@height-big);

                                &:nth-child(odd) {
                                    width: 100px;
                                }
                            }
                        }
                    }
                }

                .base-info {
                    .title {
                        font-size: @font-big;
                    }
                }
                .charts {
                    .chart-title {
                        font-size: @font-big;
                        .height(@height-big);
                    }
                    .legend {
                        .sign {
                            font-size: @font-big;
                        }
                        span.water-level:after,
                        span.out:after {
                            top: 14px;
                        }
                    }
                }
            }
        }
    }
}
</style>
