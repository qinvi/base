<template>
    <div class="legendpic-panel" :style="[totalHeight, totalWidth, marqueeLegend]" v-show="!none" ref="legend">
        <div>
            <div class="reservoir" v-if="(reservoir && state) || (river && state)">
                <div class="small-title">水位图例</div>
                <ul><li class="up">涨</li><li class="flat">平</li><li class="down">落</li><li class="normal">正常</li><li class="over">超汛限/警戒</li><li class="prediction">超汛限预报</li></ul>
                <!-- <ul><li class="normal">正常</li><li class="over">超汛限</li><li class="prediction">超汛限预报</li></ul> -->
            </div>
            <!-- <div class="reservoir" v-if="river && state">
                <div class="small-title">河流水位</div>
                <ul><li class="up">涨</li><li class="flat">平</li><li class="down">落</li></ul>
                <ul><li class="normal">正常</li><li class="over">超汛限</li><li class="prediction">超汛限预报</li></ul>
            </div> -->
            <div class="highway" v-if="highway && state">
                <div class="small-title">实时路况</div>
                <ul><li v-for="(text, index) of highwayArr.text" :key="index">{{ text }}</li></ul>
                <ul><li v-for="(color, index) of highwayArr.color" :key="index" :style="{ background: color }"></li></ul>
            </div>
        </div>
        <div class="typhoon" v-if="typhoon && state">
            <div class="small-title">台风图例</div>
            <ul><li v-for="(text, index) of typhoonArr.text" :key="index">{{ text }}</li></ul>
            <ul><li v-for="(color, index) of typhoonArr.color" :key="index" :style="{ background: color }"></li></ul>
        </div>

        <div class="radar" v-if="radar && state">
            <div class="small-title">雷达回波</div>
            <div class="radar-img"></div>
        </div>

        <div class="ship" v-if="ship && state">
            <div class="small-title" style="padding-top: 25px;">船舶图例</div>
            <div class="ship-all">
                <span class="ship-1">客轮</span>
                <span class="ship-2">货轮</span>
                <span class="ship-3">油轮</span>
                <span class="ship-4">公务船</span>
                <span class="ship-5">高速轮</span>
                <span class="ship-6">作业轮</span>
                <span class="ship-7">其他</span>
                <span class="ship-8">渔船</span>
                <span class="ship-9">锚泊/靠港</span>
                <span class="ship-10">航行中的船舶。只要有航速，航首线会一直显示，航首线与船舶成正比，船速越快，航首线越长</span>
            </div>
        </div>

        <span @click="state = !state" class="switch-btn" :style="position">{{state ? '隐藏' : '图例' }}</span>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    data() {
        return {
            state: true,
            highwayArr: {
                text: [ '无数据', '畅通', '基本畅通', '轻度拥堵', '中度拥堵', '重度拥堵' ],
                color: [ '#999999', '#21c204', '#1c8c45', '#ffd045', '#e80e0e', '#b40000' ]
            },

            typhoonArr: {
                text: [ '热带低压', '热带风暴', '强热带风暴', '台风', '强台风', '超强台风' ],
                color: [ '#00E400', '#065FB8', '#ffff00', '#FF7E00', '#f00f00', '#B10021' ]
            }

            // shipArr: [ '客轮', '货轮', '油轮', '公务船', '高速轮', '作业轮', '其他', '渔船', '锚泊/靠港', '航行中的船舶。只要有航速，航首线会一直显示，航首线与船舶成正比，船速越快，航首线越长' ]
        }
    },
    computed: {
        ...mapState({
            ship: state => state.ship.status,
            radar: state => state.radar.status,
            typhoon: state => state.typhoon.status,
            reservoir: state => /RESERVOIR_SWJ/.test(state.reservoirsSWJ.type),
            river: state => state.river.status,
            bigStat: state => state.toolsBar.bigScreen,
            highway: state => state.highway.status,
            realLength: state => state.alarm.realLength
        }),
        none() {
            return !this.ship && !this.radar && !this.typhoon && !this.reservoir && !this.highway && !this.river;
        },
        position() {
            if (!this.state || this.none) return {left: 0, bottom: 0}
            else return {right: 0, top: 0}
        },
        totalHeight() {
            if (this.state) {
                let total = 0;
                // if(this.reservoir) total += 45;
                if (this.ship) total += this.bigStat ? 100 : 80;
                if (this.radar) total += this.bigStat ? 55 : 45;
                if (this.reservoir || this.highway || this.river) total += this.bigStat ? 55 : 45;
                if ((this.reservoir && this.highway) || (this.river && this.highway)) total += this.bigStat ? 55 : 45;
                // if (this.reservoir && this.river) total += this.bigStat ? 55 : 45;
                if (this.typhoon) total += this.bigStat ? 55 : 45;
                return {height: total + 'px'}
            }
            return ''
        },
        totalWidth() {
            if (!this.none && this.state) {
                return { padding: '10px 0px 10px 10px' }
            }
            return ''
        },
        marqueeLegend() {
            const b = this.realLength ? {bottom: '36px'} : {bottom: '0px'};
            return b;
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ])

        /**
         * 初始化不需要setter的变量
         */
    },
    mounted: function() {
        WD.init(this.$refs['legend'], this.$refs['legend'], lmap.map);
    }

};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.legendpic-panel {
    cursor: move;
    z-index: @panel-index;
    position: absolute;
    width: auto;
    left: 0;
    bottom: 36px; //0;
    background: #fff;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}
.small-title {
    clear: both;
    width: 25px;
    font-weight: 700;
    float: left;
    padding-right: 5px;
    margin-top: 7px;
}

.generate-columns(10);
.generate-columns(@n, @i: 1) when (@i <= @n) {
  .ship-@{i}:before {
      content: '';
      display: inline-block;
      width: 29px;
      height: 9px;
      background: url('../../assets/img/ship/@{i}.png') no-repeat;
  }
  .generate-columns(@n, (@i + 1));
}
.ship-10:before {
    width: 44px;
}

.switch-btn {
    position: absolute;
    width: 32px;
    line-height: 20px;
    background: #27303f;
    color: #ffffff;
    cursor: pointer;
    text-align: center;

    &:hover {
        background: #344157;
    }
}

.ship {
    width: 450px;
    height: 80px;
    background: #fff;
    .ship-all {
        padding-left: 31px;
    }
    span {
        display: inline-block;
        width: 75px;
        line-height: 20px;
        &:nth-last-child(2) {width: 85px}
        &:last-child { width: 100%; }
    }
}
.typhoon { width: 450px; li {width: 60px;}}
.highway { width: 450px; display: inline-block; li {width: 60px;}}
.highway,.typhoon {
    background: #fff;
    height: 45px;
    li {
        display: inline-block;
        height: 7px;
        text-align: center;
        margin-right: 4px;
    }
}
.reservoir {
    display: block;
    /*width: 225px;*/
    width: 360px;
    height: 45px;

    ul {
        padding-top: 18px;
    }
    li {
        display: inline-block;
        padding-right: 15px;
        &:before {
            display: inline-block;
            content: '';
        }
    }
    .up:before {
        border-top: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 8px solid #065FB8;
        border-left: 5px solid transparent;
    }
    .flat:before,.normal:before,.over:before,.prediction:before {
        width: 8px;
        height: 8px;
        border-radius: 100%;
        background: #065FB8;
    }
    .down:before {
        vertical-align: bottom;
        border-top: 8px solid #065FB8;
        border-right: 5px solid transparent;
        border-bottom: 5px solid transparent;
        border-left: 5px solid transparent;
    }
    .over:before {
        background: #f00;
    }
    .prediction:before{
        background: #F29C14;
    }
}

.radar {
    width: 450px;
    height: 45px;
    .radar-img {
        padding-left: 60px;
        height: 32px;
        margin-top: 5px;
        width: 390px;
        background: url('../../assets/img/common/radar_photo.png') no-repeat center;
        background-size: 390px 32px;
    }
}
.big {
    .switch-btn {
        width: 45px;
        line-height: 27px;
    }
    .small-title {
        width: 45px;
        margin-top: 0px;
    }

    .highway,.typhoon {
        height: 55px;
    }
    .highway {
        width: 740px;
        li {
            width: 100px;
        }
    }
    .typhoon {
        width: 740px;
        height: 55px;
        li {
            width: 100px;
        }
    }
    .ship {
        width: 740px;
        height: 100px;
        .ship-all {
            padding-left: 55px;
        }
        span {
            min-width: 90px;
            line-height: 20px;
            &:nth-last-child(2) {width: 120px}
            &:last-child { width: 100%; }
        }
    }
    .radar {
        width: 700px;
        height: 60px;
        .radar-img {
            width: 635px;
            padding-left: 98px;
            height: 55px;
            background-size: 635px 42px;
        }
    }
    .reservoir {
        width: 540px;
        height: 55px;
        .up:before {
            border-top: 5px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 13px solid #065FB8;
            border-left: 8px solid transparent;
        }
        .down:before {
            vertical-align: bottom;
            border-top: 13px solid #065FB8;
            border-right: 8px solid transparent;
            border-bottom: 5px solid transparent;
            border-left: 8px solid transparent;
        }
        .flat:before,.normal:before,.over:before,.prediction:before {
            width: 13px;
            height: 13px;
            border-radius: 100%;
            background: #065FB8;
        }
        .over:before {
            background: #f00;
        }
        .prediction:before{
            background: #F29C14;
        }
    }
}
</style>
