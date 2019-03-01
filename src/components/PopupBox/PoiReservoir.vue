<template>
    <!-- 水库（华南水电） -->
    <div class="reservoir panelhover" id='reservoir' ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">
            <label :title="reservoirTitle">{{ reservoir.list.reservoirName}}&nbsp;&nbsp;&nbsp;&nbsp;{{charts.address}}({{charts.lonlat}})</label>
        </div>
        <div id="slide">
            <div class="reservoirTop">
                <div class="reservoirLeft">
                    <div>更新时间：{{ reservoir.list.updateTime }}</div>
                    <div :class="reservoir.lowOver">
                        <em></em>超汛限水位：{{ reservoir.over }}米</div>
                    <div :class="reservoir.overStat">
                        <div class="Watered">
                            <label>汛限
                                <br>水位</label>
                            <span>{{ reservoir.list.warnWater}}米</span>
                        </div>
                        <div class="inWater">
                            <label class="inWater">当前
                                <br>水位</label>
                            <span>{{ reservoir.list.curWater}}米</span>
                        </div>
                        <div class="fullWater">库容：{{ reservoir.list.storage | fixed}}万立方米</div>
                    </div>
                </div>
                <div class="reservoirRight">
                    <a>
                        <img :src="getSkPic" @error="getNullPic($event)">
                    </a>
                </div>
            </div>
            <div class="reservoirBottom">
                <div class="waterRain">
                    <ul class="waterRainLegend">
                        <li>
                            <label style="margin-right: 10px;">水位(m)</label>
                            <label>累计雨量(mm)：</label>
                            <span class="gust">过去</span>
                            <span class="for">未来</span>
                        </li>
                        <li>
                            <span class="ww">水库水位</span>
                            <span class="outy">超汛限</span>
                        </li>
                    </ul>
                </div>
                <v-watercharts :waterChart="waterChart" v-if="!!waterChart"></v-watercharts>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              Reservoir list
 * ----------------------------------------------------------------------------
 * getSkPic                 - 获取水库图片
 * packData                 - 水库数据组装
 * getAddress               - 根据经纬度获取水库地址
 * packChartData            - 图表数据请求
 * createChartData          - 图表数据组装
 * getNullPic               - 图片加载失败调用
 * initConstData            - 初始化不需要setter的参数
 * close                    - 关闭
 */
import { mapActions, mapState } from 'vuex';
import WaterCharts from '../Plugins/WaterCharts';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    name: 'PoiReservoir',
    components: {
        'v-watercharts': WaterCharts
    },
    filters: {
        fixed(value) {
            if (!value) return '';
            return isNaN(Number(value)) ? '--' : value.toFixed(2);
        }
    },
    data() {
        return {
            getSkPic: '',
            reservoir: {
                list: {},
                over: '--', // 超警戒水位
                overStat: {
                    outwaterimg: false,
                    waterimg: true
                },
                lowOver: {
                    reservoirOver: false,
                    reservoirLow: true
                },
                reservoirId: '',
                chartLonLat: []
            },
            charts: {
                address: '', // 地址
                lonlat: '' // 经纬度
            },
            waterChart: null,
            normalDetailActive: false
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime,
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            activeCode: state => state.selectPoint.areaCode,
            reservoirType: state => state.reservoirDetails.type,
            detail: state => state.reservoirDetails.data
        }),

        /**
         * 获取水库图片
         */
        // getSkPic() {
        //     let picPath = this.reservoir.list.photo;
        //     if (!!picPath) {
        //         return sysconfig.IP + '/reservoir/' + picPath + '.jpg?' + new Date().getTime();
        //     } else {
        //         return sysconfig.TESTIP + '/topic/little/necImage/now-inform-0.png';
        //     }
        // },

        reservoirTitle() {
            return `${this.reservoir.list.reservoirName} ${this.charts.address}(${this.charts.lonlat})`;
        }
    },
    watch: {
        code(val) {
            this.reservoir.list.updatetime = TU(val).format('YYYY-MM-DD HH:mm:ss')
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        },
        detail(data) {
            if (!data) return;
            if (this.reservoirType === 'SOUTHRESERVOIR') this.packData();
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化不需要setter的参数
         */
        initConstData() {
            this.poiUrls = {
                chartUrl: sysconfig.TESTPATH + '/basedata/listPoiInfo',
                otherUrl: sysconfig.TESTPATH + '/basedata/getPoiRealInfo'
            }
        },

        /**
         * 水库数据组装
         */
        packData() {
            let reservoirDetail = this.detail.data;
            this.reservoir.list.updateTime = reservoirDetail.dateTime
            this.reservoir.list.reservoirName = '--'
            this.charts.address = ''
            let keys = Object.keys(reservoirDetail.multiMap)
            reservoirDetail.multiMap[keys[0]].forEach(ele => {
                if (ele.paramTitle === '名称') this.reservoir.list.reservoirName = ele.paramVal;
                if (ele.paramTitle === '所在行政区划') this.charts.address = ele.paramVal
                if (ele.paramTitle === '汛限水位') this.reservoir.list.warnWater = (isNaN(Number(ele.paramVal)) || ele.paramVal === '') ? '--' : Number(ele.paramVal).toFixed(2);
            })
            this.charts.lonlat = Number(reservoirDetail.lon).toFixed(2) + 'E, ' + Number(reservoirDetail.lat).toFixed(2) + 'N';

            this.reservoir.id = reservoirDetail.uid;
            const param = {
                'code': this.code,
                'id': this.reservoir.id,
                'dateTime': TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') // '2017-07-19 17:00:00'
            }
            param.type = 'SW.PICTURE'
            utils.GET(this.poiUrls.otherUrl, param).then(json => {
                this.getSkPic = json.data.realMap['SW.PICTURE']
            })
            param.type = 'SW.RZ,SW.W'
            utils.GET(this.poiUrls.otherUrl, param).then(json => {
                let over
                const realMap = json.data.realMap
                // this.reservoir.list.updateTime = realMap.dataTime
                this.reservoir.list.curWater = (isNaN(Number(realMap['SW.RZ'])) || realMap['SW.RZ'] === '') ? '--' : Number(realMap['SW.RZ']).toFixed(2);
                this.reservoir.list.storage = realMap['SW.W'] || '--'
                if (this.reservoir.list.warnWater === '--' || this.reservoir.list.curWater === '--') {
                    over = '--';
                } else {
                    over = Number(this.reservoir.list.curWater - this.reservoir.list.warnWater).toFixed(2);
                }
                this.reservoir.overStat.outwaterimg = (over > 0);
                this.reservoir.overStat.waterimg = !(over > 0);
                this.reservoir.lowOver.reservoirOver = (over > 0);
                this.reservoir.lowOver.reservoirLow = !(over > 0);
                this.reservoir.over = over;
                this.reservoir = Object.assign({}, this.reservoir)
            })
            this.packChartData();
        },

        /**
         * 图表数据请求
         */
        packChartData() {
            const param = {
                'code': this.code,
                'id': this.reservoir.id,
                'dateTime': TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'), // '2017-07-19 17:00:00'
                'type': 'SW.RZ',
                'lon': this.detail.data.lon,
                'lat': this.detail.data.lat
            }
            utils.GET(this.poiUrls.chartUrl, param).then((json) => {
                this.createChartData(json.data.poiDataList);
            });
        },

        /**
         * 图表数据组装
         *
         * @param {object} chartData 图表请求数据
         */
        createChartData(chartData) {
            let pastArr = []; // 过去水位
            let futureArr = []; // 未来水位
            let levelArr = []; // 等级
            const interval = 0.1;
            let warn = parseFloat(this.reservoir.list.warnWater);
            let warnHigh = Number((warn + interval).toFixed(2));
            let warnLow = Number((warn - interval).toFixed(2));
            if (isNaN(warnHigh)) warnHigh = 0
            if (isNaN(warnLow)) warnLow = 0
            let max = 20;
            let min = 0;
            let dashData = []
            if (chartData.length > 0) {
                for (let i = 0; i < 5; i++) {
                    let resIndex = chartData[i];
                    let rainVal = parseFloat(resIndex.rainfall);
                    rainVal = (rainVal === 0 || rainVal === 9999) ? '' : rainVal;
                    pastArr.push(rainVal);

                    let waterVal = this.format(chartData[i].waterlevel)
                    levelArr.push(waterVal);
                    futureArr.push('');
                }
                for (let i = 5; i < chartData.length; i++) {
                    let resIndex = chartData[i];
                    let rainVal = parseFloat(resIndex.rainfall);
                    rainVal = (rainVal === 0 || rainVal === 9999) ? '' : rainVal;
                    futureArr.push(rainVal);

                    let waterVal = this.format(chartData[i].waterlevel)
                    levelArr.push(waterVal);
                    pastArr.push('');
                }
                let copy = [...levelArr];
                copy = copy.filter((a, b) => { // 筛选排序
                    return Object.prototype.toString.call(a) === '[object Number]';
                }).sort((a, b) => {
                    return b - a;
                });
                let maxmax = Number((copy[0] + interval).toFixed(2));
                let minin = Number((copy[copy.length - 1] - interval).toFixed(2));
                max = maxmax > warnHigh ? maxmax : warnHigh; // y轴最大值
                min = minin < warnLow ? minin : warnLow;
            } else {
                pastArr = ['', '', '', '', '', '', '', '', '', ''];
                futureArr = ['', '', '', '', '', '', '', '', '', ''];
                levelArr = ['', '', '', '', '', '', '', '', '', ''];
                max = warnHigh;
                min = warnLow;
            }
            if (isNaN(max)) max = 10.0;
            if (isNaN(min)) min = 0;
            dashData = this.interpolateMissingValues(levelArr, this.reservoir.list.warnWater)

            const cid = 'water-charts';
            const warnlevel = this.reservoir.list.warnWater;
            const zone = warnlevel === '--' ? max : warnlevel;
            const updatetime = this.reservoir.list.updateTime;
            const timeArr = ['-24h', '-12h', '-6h', '-3h', '-1h', '1h', '3h', '24h', '48h', '72h'];
            const past = {
                name: '过去累计雨量(mm)',
                list: pastArr
            };
            const future = {
                name: '未来累计雨量(mm)',
                list: futureArr
            };
            const level = {
                name: '水库水位(m)',
                list: levelArr
            };
            const forecast = {
                name: '估测水库水位(m)',
                list: dashData
            }
            this.waterChart = {forecast, timeArr, zone, max, min, past, future, level, cid, warnlevel, updatetime};
        },

        /**
         * 图片加载失败调用
         *
         * @param {object} event 事件对象
         */
        getNullPic(event) {
            let target = event.target;
            target.src = 'http://10.148.16.56/danger/reservoir/now-inform-0.png';
        },

        /**
         * 关闭
         */
        close() {
            const t = this.callbackActiveType();
            this.removeSelectPoint('monitor', 'SOUTH_RESERVOIR');
            if (t.normal === 'RESERVOIR') this.removeSelectPoint('normal', 'RESERVOIR');
            this.updateParam([ 'SOUTHRESERVOIR', { detail: false } ]);
            this.updateParam([ 'reservoirDetails', { data: null, type: null } ]);
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
                let dd = -1
                let ddd = false
                interpolatedValues.forEach((value, index) => {
                    if (value.y >= warningLevel) {
                        value.marker = {
                            lineColor: '#f00'
                        }
                    }
                    if (value.y !== null && !ddd) dd = index
                    else ddd = true
                })
                for (let i = 0; i < interpolatedValues.length; i++) {
                    interpolatedValues[i].x = i
                    if (interpolatedValues[i].y === null && dd !== -1) {
                        interpolatedValues[i].y = interpolatedValues[dd].y
                        break;
                    }
                }
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
    z-index: @pop-index;
    .waterRainLegend {
        height: auto;
        display: block;

        li {
            float: left;
            padding: 10px 0;
            margin-left: 10px;

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
        height: 195px;
        // margin-bottom: 20px;
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
        margin-left: 20px;

        span {
            margin-right: 15px;
        }
        span:before {
            width: 12px;
            height: 16px;
            margin-top: -3px;
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
.reservoir {
    position: absolute;
    right: 0px;
    top: 0px;
    width: 700px;
    // height: 527px;
    background: #fff;
    box-shadow: @shadow;
    .title {
        label {
            display: inline-block;
            width: 95%;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
    .reservoirTop {
        height: auto;
        overflow: hidden;
        margin: 7px 2px 2px;
        padding-bottom: 3px;
        border-bottom: 1px dashed #ccc;
        .reservoirLeft {
            float: left;
            width: 271px;
            margin: 3px;
            div {
                line-height: 22px;
                text-align: left;
                clear: both;
            }
            em {
                display: inline-block;
                width: 22px;
                height: 18px;
                vertical-align: middle;
                margin-top: -4px;
            }
            .reservoirOver {
                color: rgb(216, 39, 28);
                em {
                    background: url(../../assets/img/common/warn-icon_over.png) no-repeat center;
                }
            }
            .waterimg {
                position: relative;
                width: 100%;
                height: 202px;
                background: url(../../assets/img/common/sk.png) no-repeat 18px 5px;
                div {
                    position: absolute;
                    line-height: 16px;
                }
                div.Watered {
                    top: 21px;
                    left: 46px;
                    label {
                        position: absolute;
                        top: -2px;
                        left: -30px;
                    }
                }
                div.inWater {
                    top: 68px;
                    right: 39px;
                    label {
                        position: absolute;
                        top: -2px;
                        right: -30px;
                    }
                }
                div.fullWater {
                    bottom: -19px;
                    left: 0;
                    width: 100%;
                    text-align: center;
                }
            }
            .outwaterimg {
                width: 100%;
                height: 202px;
                background: url('../../assets/img/common/sk_over.png') no-repeat 18px 5px;
                position: relative;
                div {
                    position: absolute;
                    line-height: 16px;
                }
                div.Watered {
                    top: 21px;
                    left: 49px;
                    label {
                        position: absolute;
                        left: -30px;
                        top: -2px;
                    }
                }
                div.inWater {
                    top: 6px;
                    right: 41px;
                    label {
                        position: absolute;
                        right: -30px;
                        top: -3px;
                    }
                }
                div.fullWater {
                    bottom: -17px;
                    left: 0px;
                    width: 100%;
                    text-align: center;
                }
            }
            .reservoirLow em {
                background: url(../../assets/img/common/warn-icon.png) no-repeat center;
            }
        }
        .reservoirRight{
            float: right;
            width: 416px;
            height: auto;
            img {
                width: 99%;
                height: 270px;
            }
        }
    }
}
.big {
    .reservoir {
        width: 750px;
        .reservoirTop {
            .reservoirLeft {
                .waterimg {
                    div {
                        &.inWater {
                            label {
                                right: -50px;
                                display: inline-block;
                                line-height: 22px;
                            }
                        }
                        &.Watered {
                            label {
                                left: -44px;
                                display: inline-block;
                                line-height: 22px;
                            }
                        }
                    }
                }
                .outwaterimg {
                    div.Watered {
                        top: 21px;
                        left: 49px;
                        label {
                            position: absolute;
                            left: -45px;
                            top: -2px;
                        }
                    }
                    div.inWater {
                        top: 6px;
                        right: 41px;
                        label {
                            position: absolute;
                            right: -45px;
                            top: -3px;
                        }
                    }
                }
            }
        }
    }
}
</style>
