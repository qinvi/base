<template>
    <div class="air" ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">
            <label>空气质量检测-{{  item.position  }}</label>
        </div>
        <div class="air-content">
            <ul class="clearfix">
                <li class="icon area">
                    <label>城市名称</label>
                    <span>{{ item.area }}</span>
                </li>
                <li class="icon aqi">
                    <label>空气质量指数</label>
                    <span>{{ item.aqi }}</span>
                </li>
                <li class="icon primaryPollutant">
                    <label>首要污染物</label>
                    <span>{{  item.primaryPollutant === null ? item.primaryPollutant : '未知'  }}</span>
                </li>
                <li class="icon quality">
                    <label>指数类别</label>
                    <span>{{ item.quality }}</span>
                </li>
            </ul>
            <ul class="clearfix">
                <li class="liW">监测点编码：{{ item.stationCode }}</li>
                <li class="liW">经纬度：{{ item.lon }},{{ item.lat }}</li>
                <li class="liW">监测点名称：{{ item.position }}</li>
                <li class="liW">发布时间：{{ item.time }}</li>
            </ul>
            <ul class="clearfix">
                <li class="liW liT">
                    <span>一氧化碳 <font>(ug/m3)</font> </span>
                    <ul class="clearfix">
                        <li>
                            <label>1小时平均：</label>
                            <a>{{ item.co }}</a>
                        </li>
                        <li>
                            <label>24小时滑动平均：</label>
                            <a>{{ item.co24h }}</a>
                        </li>
                    </ul>
                </li>
                <li class="liW liT">
                    <span>二氧化硫 <font>(ug/m3)</font> </span>
                    <ul class="clearfix">
                        <li>
                            <label>1小时平均：</label>
                            <a>{{ item.so2 }}</a>
                        </li>
                        <li>
                            <label>24小时滑动平均：</label>
                            <a>{{ item.so2_24h }}</a>
                        </li>
                    </ul>
                </li>
                <li class="liW liT">
                    <span>二氧化氮 <font>(ug/m3)</font> </span>
                    <ul class="clearfix">
                        <li> <label>1小时平均：</label> <a>{{ item.no2 }}</a> </li>
                        <li> <label>24小时滑动平均：</label> <a>{{ item.no2_24h }}</a> </li>
                    </ul>
                </li>
                <li class="liW liT">
                    <span>臭氧 <font>(ug/m3)</font> </span>
                    <ul class="clearfix">
                        <li> <label>1小时平均：</label> <a>{{ item.o3 }}</a> </li>
                        <li> <label>8小时滑动平均：</label> <a>{{ item.o3_8h }}</a> </li>
                        <li> <label>日最大8小时滑动平均：</label> <a>{{ item.o3_8h_24h }}</a> </li>
                    </ul>
                </li>
                <li class="liW liT" style="width: 90%;">
                    <span>颗粒物 <font>(ug/m3)</font> </span>
                    <ul class="clearfix">
                        <li> <label>（粒径≤2.5μm）1小时平均：</label> <a>{{ item.pm2_5 }}</a> </li>
                        <li> <label>（粒径≤2.5μm）24小时滑动平均：</label> <a>{{ item.pm2_5_24h }}</a> </li>
                        <li> <label>（粒径≤10μm）1小时平均：</label> <a>{{ item.pm10 }}</a> </li>
                        <li> <label>（粒径≤10μm）24小时滑动平均：</label> <a>{{ item.pm10_24h }}</a> </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import WinDrag from '../../utils/tools/WinDrag.js';
export default {
    name: 'PopupBoxAgr',
    props: ['data'],
    data() {
        return {
            item: {}
        };
    },
    computed: {
        ...mapState({
            ndata: state => {
                return state.agr.data || {};
            }
        })
    },
    watch: {
        data() {
            this.item = Object.assign({}, this.ndata, this.data);
        },
        ndata() {
            this.item = Object.assign({}, this.ndata, this.data);
        }
    },
    methods: {
        close() {
            this.$emit('close');
        }
    },
    mounted() {
        WinDrag.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        this.item = Object.assign({}, this.ndata, this.data);
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WinDrag.zIndex + 1
            WinDrag.zIndex += 1
        }
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.air {
    width: 427px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: @shadow;
}

.air-content {
    margin-bottom: 14px;
    ul {
        width: 100%;
        li {
            width: 100%;
            line-height: 22px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            float: left;
            label {
                .height();
                display: block;
            }
            span {
                .height();
                display: block;
                color: @select-font-color;
                font-size: 13px;
                font-weight: bold;
            }
            &.quality:before {
                content: '';
                background: url('../../assets/img/dis/05.png') no-repeat center 8px;
                display: block;
                height: 40px;
            }
            &.primaryPollutant:before {
                content: '';
                background: url('../../assets/img/dis/06.png') no-repeat center 8px;
                display: block;
                height: 40px;
            }

            &.aqi:before {
                content: '';
                background: url('../../assets/img/dis/07.png') no-repeat center 8px;
                display: block;
                height: 40px;
            }

            &.area:before {
                content: '';
                background: url('../../assets/img/dis/08.png') no-repeat center 8px;
                display: block;
                height: 40px;
            }

            &.icon {
                width: 23%;
                text-align: center;
                margin: 8px 0px 10px 0px;
                line-height: 22px;
                font-size: 16px;
                float: left;
            }

            &.primaryPollutant {
                width: 30%;
            }

            &.liW {
                width: 49%;
                margin-left: 1%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                position: relative;
                float: left;
            }

            &.liT {
                margin-top: 15px;
            }

            &.liW label,
            &.liW a {
                font-weight: normal;
                float: left;
            }

            &.liW span {
                font-size: 14px;
                font-weight: bold;
                display: block;
            }

            &.liW span font {
                font-weight: normal;
                font-size: @font-normal;
                margin-left: 5px;
            }

            &.liW ul li {
                width: 100%;
                margin-left: 0;
            }

            &.liW ul li label {
                font-weight: normal;
                float: left;
            }

            &.liW ul li a {
                font-weight: bold;
                float: left;
            }
        }
    }
}

.big .air {
    width: 616px;
    // .content ul li {
    //     &.icon {
    //         line-height: 30px;
    //         font-size: @font-big;
    //     }
    //     &.liW {
    //         line-height: 30px;
    //         span {
    //             font-size: @font-big;
    //             font {
    //                 font-size: 16px;
    //             }
    //         }
    //     }
    //     &.liW ul li {
    //         line-height: 30px;
    //     }
    //     & span {
    //         font-size: @font-big;
    //     }
    //     & label {
    //         font-size: 18px;
    //     }
    // }
    .air-content {
        margin-bottom: 10px;
        ul {
            li {
                line-height: @height-big;

                label,
                span {
                    .height(@height-big);
                    font-size: @font-big;
                    margin: 2px 0;
                }

                &.icon {
                    margin: 0;
                    label,
                    span {
                        .height(22px);
                    }
                }

                &.liT {
                    margin-top: 0;
                }
            }
        }
    }
}
</style>
