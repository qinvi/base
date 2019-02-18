<template>
    <div class="tip" :style="tipWidth" v-show="!historyCase">
        <div class="poi" v-show="poi.status">
            <a class="close" @click="close('poi')"></a>
            <div :class="[ poi.ename ? 'info tipEname' : 'info', poi.time ? 'tipTime' : '' ]">
                <div class="name"><span>{{ areaName }}</span>{{ poi.name + '分布图' }}</div>
                <div class="time">{{ poi.time }}</div>
                <div class="english">{{ poi.ename }}</div>
            </div>
        </div>
        <div class="typhoon" v-show="typhoon.status">
            <a class="close" @click="close('typhoon')"></a>
            <div class="info">
                <div class="name">{{ typhoon.name }}</div>
                <ul>
                    <li>最新时间：{{ typhoon.time }}</li>
                    <li>中心位置：{{ typhoon.center }}</li>
                    <li>风速气压：{{ typhoon.wind }}</li>
                    <li>风圈半径：{{ typhoon.radius }}</li>
                </ul>
            </div>
        </div>
        <div class="model" v-show="model.status">
            <a class="close" @click="close('model')"></a>
            <div class="info">
                <div class="name">{{ areaName }}{{ model.name }}分布图</div>
                <div class="time">{{ model.time }}</div>
                <div class="english" v-html="model.ename" :class="[ model.highlight ? 'highlight' : '' ]"></div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Tip',
    computed: {
        ...mapState({
            model: state => state.tip.model,
            poi: state => state.tip.poi,
            typhoon: state => state.tip.typhoon,
            areaName: state => state.sys.areaName,
            bigScreen: state => state.toolsBar.bigScreen,
            sysTime: state => state.time.sysTime,
            historyCase: state => state.historyCase.play
        }),
        tipWidth() {
            let width = 0;
            if (this.model.status) width += this.bigScreen ? 510 : 360;
            if (this.poi.status) width += this.bigScreen ? 510 : 360;
            if (this.typhoon.status) width += this.bigScreen ? 700 : 432;
            return { width: `${width}px` };
        },
        liveThingActive: function () {
            try {
                return this.poi.name.includes('公众实景上报')
            } catch (ex) {
                return false
            }
        }
    },
    watch: {
        poi: function (val) {
            if (this.liveThingActive) {
                this.poi.time = this.getLiveThingTime()
            }
        },
        sysTime: function (val) {
            if (this.liveThingActive) {
                this.poi.time = this.getLiveThingTime()
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 关闭弹窗
         * @param {string} type 弹窗类型
         */
        close(type) {
            this.updateParam([ 'tip', { [type]: { status: false } } ]);
        },

        /*
         * 获取公众实景上报标题时间
         */
        getLiveThingTime: function () {
            const date = this.sysTime
            const prevDate = new Date(this.sysTime.getTime() - 1000 * 60 * 60)

            return TU(prevDate).format('YYYY年MM月DD日HH时') + ' - ' +
                TU(date).format('YYYY年MM月DD日HH时')
        }
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.tip {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    .model, .poi, .typhoon {
        width: 350px;
        height: 66px;
        position: relative;
        background: #fff;
        box-shadow: @shadow;
        display: inline-block;
        text-align: center;
        vertical-align: top;
        .info {
            &>div {
                margin-top: 3.2px;
            }
            .name {
                font-size: 14px;
                color: @select-font-color;
            }
            .highlight {
                color: red;
            }
        }
        .close:hover {
            /*color: red !important;*/
        }
    }
    .typhoon {
        width: 416px;
        padding: 0 11px;
    }
    .poi {
        .info {
            position: absolute;
            height: 38%;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            margin: auto;
        }
        .info.tipEname {
            height: 80%;
            .name {
                font-size: 16px;
            }
            &.tipTime {
                height: 95%;
                & > div {
                    margin-top: 2.2px;
                }
            }
        }
        .close {
            /*top: -4px !important;*/
            z-index: 999;
        }
    }
    .typhoon {
        ul {
            position: relative;
            margin-top: 5px;
            li {
                &:nth-child(2n + 1) {
                    width: 45%;
                }
                float: left;
                // width: 50%;
                text-align: left;
            }
        }
    }
}

.big .tip {
    .model, .poi, .typhoon {
        width: 500px;
        height: 94px;
        .name {
            font-size: @font-big;
        }
        .info.tipEname {
            .name {
                font-size: @font-big;
            }
        }
    }
    .typhoon {
        width: 681px;
    }
}
</style>
