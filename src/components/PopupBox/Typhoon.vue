<template>
    <div :style="getPosition" v-if="!!winData" class="typhoonInfo" :class="{ 'big-screen': bigScreen }">
        <div class="title">{{ winData.inilid }}{{ winData.tscname }}</div>
        <div class="InfoPanle">
            <ul>
                <li v-for="(item, index) in winParam" :key="index">{{item}}：{{winData[index]}}</li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'PopupBoxTyphoon',
    data() {
        return {
            pixel: null,
            winData: null
        };
    },
    computed: {
        ...mapState({
            ndata: state => state.agr.data,
            inilidCallback: state => state.typhoon.inilidCallback,
            bigScreen: state => state.toolsBar.bigScreen
        }),

        /**
         * 获取弹窗位置
         */
        getPosition() {
            return { 'left': (this.pixel[0] + 10 + 'px'), 'top': (this.pixel[1] + 10 + 'px') };
        }
    },
    watch: {

    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化不需要setter的函数
         */
        initConstData() {
            this.updateParam([ 'typhoon', { callback: this.initWindData } ]);
            this.winParam = {
                bjdatetime: '时       间',
                center: '中心位置',
                windspeed: '最大风速',
                pressure: '中心气压',
                rr07: '七级风圈',
                rr08: '八级风圈',
                rr010: '十级风圈',
                rr012: '十二风圈'
            };
        },

        /**
         * 移动弹窗创建
         *
         * @param {object} val 相应point点值
         */
        initWindData(val) {
            if (!val) { this.winData = val; return; }
            const v = JSON.parse(JSON.stringify(val));
            v.center = v.lon + '°E,' + v.lat + '°N';
            v.inilid = this.inilidCallback(v.tsid);
            if (!!v.windspeed) v.windspeed += '米/秒';
            if (!!v.pressure) v.pressure += '百帕';
            if (!!v.rr07) v.rr07 += '千米';
            if (!!v.rr08) v.rr08 += '千米';
            if (!!v.rr010) v.rr010 += '千米';
            if (!!v.rr012) v.rr012 += '千米';
            this.pixel = v.pixelPosition;
            this.winData = v;
        }
    },
    mounted() {
        this.initConstData();
    }
}
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';

.typhoonInfo {
    position: absolute;
    right: 0px;
    top: 0px;
    width: 310px;
    z-index: @pop-index;
    background-color: #fff;
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    -moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);

    &.big-screen {
        width: 410px;

        li {
            height: 35px;
            line-height: 35px;
        }
    }

    li {
        height: 26px;
        line-height: 26px;
        border-bottom: 1px solid #e0eaf5;
        border-left: 1px solid #e0eaf5;
        padding-left: 3px;
    }
    li:nth-child(1) {
        white-space: pre-wrap;
    }
    li:nth-child(3),li:nth-child(4),li:nth-child(5),li:nth-child(6),li:nth-child(7),li:nth-child(8) {
        box-sizing: border-box;
        width: 50%;
        float: left;
    }
}
</style>
