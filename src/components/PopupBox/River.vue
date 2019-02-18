<template>
    <!-- 河流 -->
    <div class="reservoir panelhover" id='reservoir' ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">
            <label :title="Detail.infoDetail.riverName">{{ Detail.infoDetail.riverName }}</label>
        </div>
        <div id="slide">
            <div class="reservoirTop">
                <div class="reservoirLeft">
                    <div :class="[ levelOver ? 'river_out' : 'river_normal' ]">
                        <div class="waterLabel">
                            <div class="Watered">
                                <label>{{ curWarn[!levelOver] }}</label>
                                <span>{{!levelOver? Detail.infoDetail.warnLevel:Detail.infoDetail.level}}米</span>
                            </div>
                            <br>
                            <em></em>
                            <div class="inWater">
                                <label>{{ curWarn[levelOver] }}</label>
                                <span>{{!levelOver? Detail.infoDetail.level:Detail.infoDetail.warnLevel}}米</span>
                            </div>
                        </div>
                        <div class="riverMiddle">
                            <span :title="Detail.infoDetail.stnm">测站名称：{{Detail.infoDetail.stnm}}</span>
                            <span :title="computedRiverSystem">水系-河流名称：{{computedRiverSystem}}</span>              
                            <span :title="Detail.infoDetail.basinName">流域名称：{{Detail.infoDetail.basinName}}</span>
                            <span :title="Detail.infoDetail.address">站址：{{Detail.infoDetail.address}}</span>
                            <span :title="computedWarn">超警戒水位： {{computedWarn}}m</span>
                            <span :title="Detail.infoDetail.updateTime">时间：{{Detail.infoDetail.updateTime}}</span>                        
                        </div>
                    </div>
                </div>
                <div class="reservoirRight">
                    <span>累计降雨量变化图</span>
                    <v-rain-chart :data="Detail.rainDetail" v-if="!!Detail.rainDetail"></v-rain-chart>
                </div>
            </div>
            <div class="reservoirBottom">
                <div class="waterRain">
                    <span class="riverBottomTitle">过去24小时河流水位变化图</span>
                    <ul class="waterRainLegend">
                        <li>
                            <label style="margin-right: 10px;">水位(m)</label>
                        </li>
                        <li>
                            <span class="ww">河流水位</span>
                            <span class="outy">超警戒</span>
                            <span class="warn">警戒水位</span>
                        </li>
                    </ul>
                </div>
                <v-watercharts :waterChart="Detail.riverDetail" v-if="!!Detail.riverDetail"></v-watercharts>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              River list
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
import RainChart from '../Plugins/RainChart';

export default {
    props: ['Detail'],
    components: {
        'v-watercharts': WaterCharts,
        'v-rain-chart': RainChart
    },
    data() {
        return {
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime
        }),
        levelOver() {
            if (this.Detail.infoDetail.warnLevel === '--' || this.Detail.infoDetail.level === '--') return false;
            else {
                let b = ((this.Detail.infoDetail.level - this.Detail.infoDetail.warnLevel) > 0 && 1);
                return Boolean(b);
            }
        },
        computedWarn() {
            if (this.Detail.infoDetail.level === '--' || this.Detail.infoDetail.warnLevel === '--') return '--';
            else return Number(this.Detail.infoDetail.level - this.Detail.infoDetail.warnLevel).toFixed(2);
        },
        computedRiverSystem() {
            if (this.Detail.infoDetail.riverSystem === '--' && this.Detail.infoDetail.riverName === '--') return '--';
            else return (this.Detail.infoDetail.riverSystem + '-' + this.Detail.infoDetail.riverName);
        }
    },
    watch: {
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.curWarn = {
                false: '当前水位',
                true: '警戒水位'
            };
        },

        /**
         * 关闭
         */
        close() {
            this.$emit('close');
        }
    },
    beforeMount() {
        this.initConstData();
    },
    mounted() {
        WD.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WD.zIndex + 1
            WD.zIndex += 1
        }
    },
    destroyed() {
    }
};
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';
.reservoirLeft {
    // 'river_out' : 'river_normal
    .river_normal, .river_out {
        height: 112px;
    }
    em {
        position: absolute;
        left: -15px;
        top: 24px;        
    }
    .river_out {
        background: url('../../assets/img/common/river_over.png') no-repeat;
        em {
            background: url('../../assets/img/common/warn-icon-1.png') no-repeat;
        }
    }
    .river_normal {
        background: url('../../assets/img/common/river.png') no-repeat;   
        em {
            background: url('../../assets/img/common/warn-icon.png') no-repeat;
        }
    }
    .waterLabel {
        position: relative;
        display: inline-block;
        left: 15px;
        top: 32px;
        .Watered, .inWater {
            float: right;
            display: inline-block;
        }
        .Watered {
            margin-top: -8px;
        }    
    }
}
.waterRain {
    width: 100%;
    height: auto;
    overflow: hidden;
    position: relative;
    z-index: @pop-index;
    .riverBottomTitle {
        position: relative;
        left: 11px;
        font-weight: bold;        
    }
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
            span.warn:before {
                background: url("../../assets/img/common/warn-level.png") no-repeat center;
                width: 22px;
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
        margin-bottom: 20px;
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
    z-index: @pop-index;
    .title {
        label {
            display: inline-block;
            width: 86%;
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
            .riverMiddle {
                width: 210px;
                position: relative;
                left: 170px; // 94px;
                top: -39px; // -2px;
                span {
                    display: block;
                    width: 100%;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;                    
                }
            }            
            div {
                line-height: 19px;
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
            position: relative;
            float: right;
            width: 302px;
            height: 147px;
            margin-top: -15px;
            span {
                position: absolute;
                top: 13px;
                left: 10px;
                z-index: 1;
                font-weight: bold;                
            }
        }
    }
}
.big {
    .reservoir {
        width: 740px;
        .reservoirTop {
            .reservoirLeft {
                height: 150px;
                .river_normal {
                    height: 145px;
                    width: 180px;
                    background-size: 100%;
                    background-position: 0% 40%;

                    .waterLabel {
                        right: -15px;
                        left: auto;
                    }

                    em {
                        left: -33px;
                        top: 43px;
                        transform: translate(18px, -16px);
                    }
                }
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
            }
            .riverMiddle {
                width: 255px;
                left: 185px;

                span {
                    margin-bottom: 5px;
                }
            }
            .reservoirRight {
                height: 150px;
                margin-top: -10px;
            }
        }
    }
}
</style>
