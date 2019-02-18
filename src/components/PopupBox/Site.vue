<template>
    <div class="site-point-panel poiPop" v-show="hasSiteData" id="site" ref="poi-box">
        <v-timepicker class="siteTime" v-if="time.tps" :option="time.option" @cbtime="selectTime"  @destroy="(time.tps = false)"></v-timepicker>
    	<a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">{{address}} (过去24小时雨量和风速变化图)</div>
        <div  class="siteIf">
            <span>时间：</span>
            <div class="timedate">
            	<input id="site-point-time" type="text" :value="time.siteTime" @click="selectSiteTime()"/>
            </div>
           	<a class="btn hover" @click="reGetRainTimeData()">刷新</a>
            <span class="textair">部分时段雨量、风速数据缺失，原因待查。</span>
        </div>
        <div class="site-charts nodata" v-if="noData==true">
           <span> 此站无雨量数据 </span>
        </div>
        <div v-show="noData===false" class="site-charts" id="site-charts"></div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Highcharts from 'highcharts';
import Timepicker from '../Plugins/Timepicker';
import WinDrag from '../../utils/tools/WinDrag.js';
export default {
    name: 'Site',
    components: { 'v-timepicker': Timepicker },
    data() {
        return {
            address: '',
            hasSiteData: false,
            siteTime: '',
            noData: false,
            time: {
                tps: false,
                option: null,
                siteTime: ''
            }
        };
    },
    computed: {
        ...mapState({
            data: state => state.site.poiData,
            code: state => state.sys.code,
            removeSelectPoint: state => state.selectPoint.remove,
            activeCode: state => state.selectPoint.areaCode,
            sysTime: state => state.time.sysTime,
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    watch: {
        data() {
            this.getRainTimeData();
        },
        sysTime() {
            this.time.siteTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
            this.reGetRainTimeData();
        },
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        },
        bigScreen() {
            this.chart.setSize(null, null, false);
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化不需要setter变量
         */
        initConstData() {
            this.url = sysconfig.TESTPATH + '/realTimeMonitor/getSiteWindRainInfo';
        },

        /**
         * 时间选择雨量
         */
        selectSiteTime(time) {
            if (!time) time = this.time.siteTime;
            this.time.tps = true;
            this.time.option = {
                id: 'timeline-sys-time',
                type: 'sys',
                top: 30,
                template: 'YYYY-MM-DD HH:mm:ss',
                date: TU(time).format('YYYY-MM-DD HH:mm:ss'),
                lock: { min: true, sec: false }
            };
        },

        /**
         * 组装数据
         */
        getRainTimeData() {
            let data = this.data;
            if (data.address) {
                this.address = data.address;
                if (!data.data.rain) {
                    this.hasSiteData = true;
                    this.noData = true;
                } else {
                    this.noData = false;
                    this.initChart(data);
                    this.time.siteTime = TU(this.data.checkTime).format('YYYY-MM-DD HH:mm');
                }
            }
        },

        /**
         * timepicker/刷新重新请求数据
         */
        reGetRainTimeData() {
            if (this.time.siteTime) {
                const zoom = lmap.util.getZoom(lmap.view) + '';
                const [ lon, lat ] = [this.data.lon, this.data.lat];
                const dateTime = TU(this.time.siteTime).format('YYYY-MM-DD HH:mm:ss');
                const code = this.code;
                const siteid = '';
                let param = { dateTime, code, lon, lat, zoom, siteid };
                utils.GET(this.url, param).then((json) => {
                    let {data} = json;
                    let {siteData} = data;
                    if (!!siteData && siteData.lon) {
                        siteData.checkTime = dateTime;
                        this.updateParam([ 'site', {poiData: siteData} ]);
                    }
                });
            }
        },

        /**
         * 监听timepicker的时间选择
         *
         * @param {object} param
         */
        selectTime(param) {
            this.time.siteTime = TU(param.date).format('YYYY-MM-DD HH:mm');
            this.time.tps = false;
            this.reGetRainTimeData(); // 再次请求数据
        },

        /**
         * 初始化highcharts
         *
         * @param {object} json json原始数据
         */
        initChart(json) {
            const rainData = json.data.rain;
            const windData = json.data.wind;
            const timeData = json.data.time;
            this.hasSiteData = true;
            this.chart = Highcharts.chart('site-charts', {
                title: {
                    text: '过去24小时雨量、风速变化图',
                    style: {
                        color: '@font-color',
                        fontFamily: 'Microsoft Yahei'
                    },
                    x: 17
                },
                credits: {enabled: false},
                xAxis: [{categories: timeData, title: {enabled: true, text: '时间（时）'}}],
                yAxis: [{labels: {format: '{value}mm', style: {color: '#4572A7'}, lineWidth: 1}, title: {text: '雨量(mm)', style: {color: '#4572A7'}}}, {title: {text: '风速(m/s)', style: {color: '#89A54E'}}, labels: {format: '{value} m/s', style: {color: '#89A54E'}}, opposite: true}],
                tooltip: {headerFormat: '时间：{point.key}时<br/>', shared: true, useHTML: true},
                legend: {
                    align: 'left',
                    verticalAlign: 'top',
                    x: -3,
                    y: -5,
                    floating: true,
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'Microsoft Yahei',
                    symbolRadius: 0
                },
                series: [ {
                    name: '风速(m/s)',
                    color: '#89A54E',
                    type: 'spline',
                    yAxis: 1,
                    data: windData,
                    tooltip: {valueSuffix: 'm/s'},
                    dataLabels: {enabled: true, rotation: -15, color: '#000', align: 'center', x: 0, y: -6, style: {fontSize: '12px'}}
                }, {
                    name: '雨量(mm)',
                    color: '#4572A7',
                    type: 'column',
                    yAxis: 0,
                    data: rainData,
                    tooltip: {valueSuffix: ' mm'},
                    dataLabels: {enabled: true, color: '#4572A7', align: 'center', x: 5, y: -7, rotation: -50, crop: false, overflow: 'none', padding: 0, style: {fontSize: '13px'}, zIndex: 9999}
                }]
            });
        },

        /**
         * 页面关闭
         */
        close() {
            this.removeSelectPoint('monitor', 'site');
            this.updateParam([ 'site', {poiData: null} ]);
        }
    },
    mounted() {
        WinDrag.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        this.initConstData();
        this.getRainTimeData();
        this.time.siteTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WinDrag.zIndex + 1
            WinDrag.zIndex += 1
        }
    },
    destroyed() {
    }
}
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';

.poiPop {
    width: 616px;
    height: auto;
    position: absolute;
    z-index: @panel-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    #timepicker {
        top: 75px!important;
        left: 62px!important;
    }
    .siteIf {
        height: 22px;
        line-height: 22px;
        padding: 8px 8px 8px 15px;
        .timedate {
            margin-left: 3px;
            display: inline-block;
            float: inherit;
            width: 160px;
            input {
                border: none;
                background: none;
                width: 100%;
                position: relative;
                cursor: pointer;
                list-style-type: none;
                -webkit-text-size-adjust: none;
                outline: none;
            }
        }
        .timedate:after {
            content: "";
            display: inline-block;
            position: absolute;
            width: 16px;
            height: 16px;
            top: 3px;
            right: 2px;
            background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAIVBMVEUAAAAmJjYnJTUkJDQnJjYmJTUlJTUlJTUmJjYgIDAnJjbB9J8FAAAACnRSTlMAgMBA4J9gMNAQ7YhGwgAAAFZJREFUCNdjgANmR8ZVqwREChhYlpquWhUc5cDAtQoMFiAYLIJg4MDABNGjwMDEpsakkJQAZDAu5FogJQBkMAszChgawBlYpSaAdHM2MLArgYBGAdwVAE8rGCn1VomTAAAAAElFTkSuQmCC)
        }
    }
    .timedate {
        border: 1px solid #ccc;
        float: left;
        height: 22px;
        line-height: 22px;
        display: block;
        clear: both;
        margin-left: -3px;
        margin-bottom: 5px;
        padding-left: 5px;
        width: 220px;
        position: relative;
    }
}
.nodata {
    height: 400px;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;

    span {
    }
}

.big {
    .poiPop {
        width: 710px;
        .siteIf {
            height: 30px;
            line-height: 30px;
        }
        .timedate {
            height: 30px;
            line-height: 30px;
            input {
                font-size: 14px;
                position: relative;
                top: -2px;
            }
            &::after {
                top: 7px;
            }
        }
    }
}
</style>
