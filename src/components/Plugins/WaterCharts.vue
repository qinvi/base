<template>
    <div class="waterRain">
        <div class="rain-charts" :id="waterChart.cid"></div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import Highcharts from 'highcharts'

export default {
    props: [ 'waterChart' ],
    data() {
        return {
            // fontSize: '12px',
            // buttomMargin: 165,
            intervel: 0.01,
            rainMax: 10
        }
    },
    computed: {
        ...mapState({
            bigScreen: state => state.toolsBar.bigScreen
        }),
        chartStyle() {
            let bigScreen = this.bigScreen;
            let style = {
                fontSize: bigScreen ? '20px' : '12px',
                buttomMargin: bigScreen ? 185 : 165,
                xAxisLabelY: bigScreen ? 22 : 15,
                yAxisLabelY: bigScreen ? 10 : 0,
                xAxisText: bigScreen ? 210 : 180
            };
            return style;
        }
    },
    watch: {
        waterChart() {
            this.initConstData();
            this.initChart();
        },
        /**
         * 大屏切换重刷charts
         * @return {[type]} [description]
         */
        bigScreen() {
            this.charts.setSize(null, null, false);
        }
    },
    methods: {
        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.forecast = {
                name: '',
                list: []
            };
            this.hideForecast = {
                name: '',
                list: []
            };
            this.chartId = {};
            this.chartId[this.waterChart.cid] = this.waterChart;
        },

        /**
         * 初始化图表
         */
        initChart() {
            const sourceData = this.chartId[this.waterChart.cid];
            this.charts = Highcharts.chart(sourceData.cid, {
                credits: { enabled: false }, // 水印隐藏
                title: { text: '' },
                xAxis: {
                    title: {
                        text: (sourceData.cid === 'river-charts') ? '时间（时）' : (sourceData.updatetime === '--' || !sourceData.updatetime) ? '--' : TU(sourceData.updatetime).format('MM-DD HH:mm'),
                        align: 'middle',
                        style: {
                            color: 'black',
                            fontSize: this.chartStyle.fontSize,
                            fontFamily: 'Microsoft yahei',
                            fontWeight: 'bold'
                        }
                    },
                    plotLines: [{
                        color: (sourceData.cid === 'river-charts') ? 'rgba(204, 204, 204, 0.1)' : '#FF0000', // 'rgba(204, 204, 204, 0.1)'
                        width: 1,
                        value: 4.5,
                        zIndex: 5
                        // label: {
                        //     x: -35,
                        //     y: this.chartStyle.xAxisText,
                        //     text: (sourceData.updatetime === '--') ? '--' : TU(sourceData.updatetime).format('MM-DD HH:mm'),
                        //     rotation: 0,
                        //     staggerLines: 5,
                        //     align: 'left',
                        //     style: {
                        //         color: 'black',
                        //         fontSize: this.chartStyle.fontSize - 2,
                        //         fontFamily: 'Microsoft yahei',
                        //         fontWeight: 'bold'
                        //     }
                        // }
                    }],
                    categories: sourceData.timeArr,
                    gridLineColor: '#e9e9e9',
                    gridLineWidth: 1,
                    labels: {
                        align: 'center',
                        rotation: 0,
                        y: this.chartStyle.xAxisLabelY,
                        style: {
                            color: '@font-color',
                            fontSize: this.chartStyle.fontSize,
                            fontFamily: 'Microsoft yahei'
                        }
                    }
                },
                yAxis: [{
                    min: sourceData.min,
                    max: sourceData.max,
                    gridLineWidth: 1,
                    gridLineDashStyle: 'dash',
                    zIndex: 3,
                    title: { text: '', rotation: 0, align: 'high', x: 20, y: 0 },
                    labels: {
                        y: this.chartStyle.yAxisLabelY,
                        style: {
                            fontSize: this.chartStyle.fontSize
                        },
                        formatter: function () {
                            return this.value.toFixed(2);
                        }
                    },
                    plotLines: [{
                        zIndex: 5,
                        width: 1, // 标示线的宽度，2px
                        color: 'red', // 线的颜色，定义为红色
                        dashStyle: 'dash', // 标示线的样式，默认是solid（实线），这里定义为长虚线
                        value: sourceData.warnlevel, // 定义在哪个值上显示标示线，这里是在x轴上刻度为3的值处垂直化一条线
                        label: {
                            x: 5,
                            // y: 0,
                            staggerLines: 5,
                            text: sourceData.warnlevel,
                            align: 'left',
                            style: {
                                color: 'red',
                                fontWeight: 'bold',
                                fontSize: this.chartStyle.fontSize
                            }
                        }
                    }]
                }, {
                    title: { text: '' },
                    gridLineWidth: 0,
                    labels: { enabled: false },
                    opposite: true
                }],
                legend: {
                    align: 'left',
                    verticalAlign: 'top',
                    borderWidth: 0,
                    x: 80,
                    y: -8,
                    enabled: false, // 隐藏图例的属性
                    symbolWidth: 9,
                    itemStyle: {
                        color: '@font-color',
                        fontFamily: 'Microsoft yahei'
                    }
                },
                tooltip: {
                    shared: true,
                    crosshairs: true,
                    useHTML: true,
                    formatter: function() {
                        let s = '<b>' + this.x + '</b>';
                        this.points.forEach((ele) => {
                            if (ele.series.name !== 'hide' && !ele.point.c_hidden) {
                                s += '<br/><div style="display:inline-block;width:8px;height:8px;border-radius:8px;background:' + ele.series.color + '"></div> ' + ele.series.name + ': ' + '<span style="font-weight:bold">' + ele.y + '</span>';
                            }
                        });
                        return s;
                    }
                },
                series: [{
                    name: sourceData.past.name,
                    type: 'column',
                    color: '#2F7ED8',
                    pointWidth: 18,
                    yAxis: 1,
                    margin: [0, 10, 35, 45],
                    data: sourceData.past.list,
                    dataLabels: {
                        x: 1,
                        y: 5,
                        enabled: true,
                        rotation: 0,
                        color: '@font-color',
                        align: 'center',
                        fontSize: '7px',
                        fontFamily: 'Microsoft yahei',
                        formatter: function () {
                            if (this.y > 0) {
                                return (this.y);
                            } else {
                                return this.y
                            }
                        }
                    }
                }, {
                    type: 'column',
                    name: sourceData.future.name,
                    color: '#BCBCBC',
                    yAxis: 1,
                    margin: [60, 10, 35, 45],
                    pointWidth: 18,
                    data: sourceData.future.list,
                    dataLabels: {
                        x: -2,
                        y: 5,
                        enabled: true,
                        rotation: 0,
                        color: '@font-color',
                        align: 'center',
                        fontSize: '7px',
                        fontFamily: 'Microsoft yahei',
                        formatter: function () {
                            if (this.y > 0) {
                                return (this.y);
                            } else {
                                return this.y
                            }
                        }
                    }
                }, {
                    name: sourceData.level.name,
                    type: 'spline',
                    dashStyle: 'solid',
                    color: null,
                    yAxis: 0,
                    lineWidth: 2,
                    data: sourceData.level.list,
                    marker: {
                        symbol: 'circle',
                        fillColor: '#FFFFFF',
                        radius: 3.5, // 曲线点半径，默认是4
                        lineWidth: 1.5,
                        lineColor: null, // inherit from series
                        states: {
                            hover: {
                                fillColor: '#FFFFFF'
                            }
                        }
                    },
                    zones: [{
                        value: sourceData.zone
                    }, {
                        color: 'red'
                    }]
                }, {
                    name: (this.forecast.name = sourceData.forecast ? sourceData.forecast.name : ''),
                    lineWidth: 2,
                    yAxis: 0,
                    data: (this.forecast.list = sourceData.forecast ? sourceData.forecast.list : []),
                    tooltip: { enabled: false },
                    dashStyle: 'dash',
                    color: '#56abe4',
                    marker: {
                        enabled: true,
                        symbol: 'circle',
                        fillColor: 'rgba(255, 255, 255, 1)',
                        radius: 3.5,
                        lineWidth: 1.5,
                        lineColor: '#56abe4',
                        states: {
                            hover: { fillColor: 'rgba(255, 255, 255, 1)' } // lineColor: null,lineWidth: 1.5
                        }
                    },
                    zones: [
                        { value: sourceData.zone }, // 没有汛限水位，不告警，线是蓝色
                        { color: 'rgba(255, 0, 0, 1)' }
                    ]
                }, {
                    name: (this.hideForecast.name = sourceData.hideForecast ? sourceData.hideForecast.name : ''),
                    lineWidth: 2,
                    yAxis: 0,
                    data: (this.hideForecast.list = sourceData.hideForecast ? sourceData.hideForecast.list : []),
                    tooltip: { enabled: false },
                    dashStyle: 'dash',
                    color: '#56abe4',
                    marker: {
                        symbol: 'circle',
                        fillColor: 'rgba(255, 255, 255, 1)',
                        radius: 3.5,
                        lineWidth: 1.5,
                        lineColor: '#56abe4',
                        states: {
                            hover: { fillColor: 'rgba(255, 255, 255, 1)' } // lineColor: null,lineWidth: 1.5
                        }
                    },
                    zones: [
                        { value: sourceData.zone }, // 没有汛限水位，不告警，线是蓝色
                        { color: 'rgba(255, 0, 0, 1)' }
                    ]
                }]
            });
        }
    },
    mounted() {
        this.initConstData();
        this.initChart();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.waterRain {
    width: 100%;
    height: auto;
    overflow: hidden;
    position: relative;

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
                z-index: @panel-index;
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
        // margin-bottom: 5px;
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

.big .rain-charts {
    height: 225px;
    // margin-bottom: 25px;
    margin-left: 2px;
    margin-right: 0px;
}
</style>
