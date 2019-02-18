<template>
    <div :id="`chart-${UUID}`" class="rain-charts"></div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Highcharts from 'highcharts';
export default {
    name: 'RainChart',
    props: [ 'data' ],
    data() {
        return {
            UUID: null
        };
    },
    computed: {
        ...mapState({
            bigScreen: state => state.toolsBar.bigScreen
        }),
        chartStyle() {
            let bigScreen = this.bigScreen;
            let style = {
                fontSize: bigScreen ? '18px' : '10px',
                buttomMargin: bigScreen ? 185 : 165,
                xAxisLabelY: bigScreen ? 22 : 15,
                yAxisLabelY: bigScreen ? 10 : 0,
                xAxisText: bigScreen ? 210 : 165,
                yAxisText: bigScreen ? 0 : -10,
                pointWidth: bigScreen ? 30 : 18
            };
            return style;
        }
    },
    watch: {
        data() {
            this.init(this.data.list);
        },
        /**
         * 大屏切换重刷charts
         * @return {[type]} [description]
         */
        bigScreen() {
            this.$nextTick(() => {
                this.init(this.data.list);
            })
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.chartHeight = 250;
        },
        init(data) {
            if (!data) return;
            if (this.data.detail) this.chartHeight = this.data.detail.height;
            Highcharts.chart(`chart-${this.UUID}`, {
                chart: { type: 'column', margin: [60, 10, 35, 45], height: this.chartHeight },
                title: { text: '' },
                credits: { enabled: false },
                xAxis: {
                    plotLines: [ { color: '#FF0000', width: 2, value: Math.floor(this.data.detail.xAxis.length / 2) } ],
                    categories: this.data.detail.xAxis, // ['-24h', '-12h', '-6h', '-3h', '-1h', '现在', '1h', '3h', '24h', '48h', '72h'],
                    labels: {
                        align: 'center',
                        rotation: 0,
                        y: 25,
                        style: {
                            color: '@font-color',
                            fontSize: this.chartStyle.fontSize,
                            fontFamily: 'Microsoft Yahei'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    max: this.data.detail.max,
                    tickPixelInterval: 10,
                    title: {
                        align: 'high',
                        offset: 0,
                        text: 'mm',
                        rotation: 0,
                        y: -12,
                        x: -10
                    },
                    labels: {
                        x: this.chartStyle.yAxisText,
                        y: this.chartStyle.yAxisLabelY,
                        style: {
                            fontSize: this.chartStyle.fontSize
                        }
                        // formatter: function () {
                        //     return this.value.toFixed(2);
                        // }
                    }
                },
                legend: {
                    x: 30,
                    y: -8,
                    align: 'left',
                    verticalAlign: 'top',
                    borderWidth: 1,
                    itemStyle: {
                        color: '@font-color',
                        fontFamily: 'Microsoft Yahei',
                        fontSize: this.chartStyle.fontSize
                    }
                },
                series: [{
                    name: '过去累计雨量',
                    color: '#2F7ED8',
                    pointWidth: this.chartStyle.pointWidth,
                    showInLegend: this.data.detail.showInLegend,
                    data: data.past,
                    dataLabels: {
                        x: 2,
                        y: -20,
                        rotation: 0,
                        enabled: true,
                        align: 'center',
                        inside: true,
                        color: '@font-color',
                        fontFamily: 'Microsoft Yahei',
                        formatter: function () {
                            return (this.y === 0) ? null : this.y;
                        },
                        style: {
                            fontSize: this.chartStyle.fontSize
                        }
                    }
                }, {
                    name: '未来累计雨量',
                    color: '#BCBCBC',
                    pointWidth: this.chartStyle.pointWidth,
                    showInLegend: this.data.detail.showInLegend,
                    data: data.future,
                    dataLabels: {
                        x: 2,
                        y: -20,
                        rotation: 0,
                        enabled: true,
                        align: 'center',
                        color: '@font-color',
                        fontFamily: 'Microsoft Yahei',
                        inside: true,
                        formatter: function () {
                            return (this.y === 0) ? null : this.y;
                        },
                        style: {
                            fontSize: this.chartStyle.fontSize
                        }
                    }
                }]
            });
        }
    },
    created() {
        this.UUID = utils.generateAuthInfo().signTime;
    },
    mounted() {
        this.init(this.data.list);
    },
    destroyed() {

    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.rain-charts {
    width: 100%;
	height: 250px;
}
.big {
    .rain-charts {
        // height: 350px;
        height: auto;
    }
}
</style>
