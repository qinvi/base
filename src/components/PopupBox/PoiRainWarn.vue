<template>
    <div class="site-min-panel poiPop" :style="position" ref="rain-warn-box">
        <div class="title"  ref="rain-warn-title">{{site.townName}}<a class="close" @click="close()"></a></div>
        <div class="site-min-ui">
            <div class="site-info">
                <span>站点号：{{site.siteCode}}</span>
                <span>更新：{{site.updateTime}}</span>
            </div>
            <div class="info">
                <span>累计雨量</span>
                <table>
                    <tr>
                        <td v-for="val in tableTitle">{{val}}</td>
                    </tr>
                    <tr>
                        <td v-for="(val, key) in tableTitle">
                            {{warnData[key]}}mm
                            <span v-if="overData[key] !== '--' && overData[key]">(超{{overData[key]}}mm)</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    data() {
        return {
            reqUrl: sysconfig.TESTPATH + '/realTimeMonitor/getWarnList',
            site: {},
            townName: '',
            siteCode: '',
            time: '',
            tableTitle: {last1: '过去1小时', last3: '过去3小时', last24: '过去24小时'},
            warnData: {},
            overData: {},
            position: {
                left: '',
                top: ''
            }
        }
    },
    computed: {
        ...mapState({
            sysTime: state => {
                return TU(state.time.sysTime).format('YYYY-MM-DD HH:00:00')
            },
            rainWarn: state => state.rainWarn
        })
    },
    watch: {
        sysTime() {
            this.getWarnList();
        },
        'rainWarn.areaCode'() {
            this.getWarnList();
        },
        'rainWarn.pix': {
            handler() {
                this.getPosition();
            },
            deep: true
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        close() {
            this.updateParam([ 'rainWarn', {poiStatus: false} ]);
        },
        getWarnList() {
            utils.GET(this.reqUrl, {dateTime: this.sysTime, code: this.rainWarn.areaCode})
            .then(({data: {warnData: db}}) => {
                let {siteCode = '', townName = '', updateTime = '', warnData, overData} = db;
                this.site = {siteCode, townName, updateTime};
                this.setRainData(warnData, 'warnData');
                this.setRainData(overData, 'overData');
            })
        },
        setRainData(obj, name) {
            let {last1 = '--', last3 = '--', last24 = '--'} = obj;
            this[name] = {last1, last3, last24}
        },
        // 获取窗口定位
        getPosition() {
            this.$nextTick(() => {
                const clientWidth = document.documentElement.clientWidth;
                const clientHeight = document.documentElement.clientHeight;
                let [left, top] = this.rainWarn.pix;
                const target = document.getElementsByClassName('site-min-panel')[0];
                let targetWidth = target.clientWidth + 15;
                let targetHeight = target.clientHeight + 30;
                // 判断位置是否超出浏览器
                let calLeft = (left + targetWidth > clientWidth) ? clientWidth - targetWidth : left + 10;
                let calTop = (top + targetHeight > clientHeight) ? clientHeight - targetHeight - 50 : top + 10;
                console.log(top + targetHeight, clientHeight, calTop);
                this.position.left = calLeft + 'px';
                this.position.top = calTop + 'px';
            })
        }
    },
    mounted() {
        WinDrag.init(this.$refs['rain-warn-title'], this.$refs['rain-warn-box'], lmap.map);
        this.getWarnList();
        this.getPosition();
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WinDrag.zIndex + 1
            WinDrag.zIndex += 1
        }
    }
}
</script>

<style scoped lang='less'>
@import "../../assets/css/common.less";

.poiPop {
    height: auto;
    position: absolute;
    z-index: @pop-index;
    background: #fff;
    -moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
}

.big div.site-min-panel {
    width: 450px;
}

div.site-min-panel {
    top: 300px;
    right: 250px;
    width: 300px;
}

.site-min-ui {
    margin: 5px;
    .site-info {
        margin-bottom: 3px;
        span:first-child {
            margin-left:5px;
            margin-right: 20px;
        }
    }
}

.info {
    overflow: hidden;
    height: auto;
    span {
        font-weight: bold;
        color: @eye-color;
    }
    table {
        width: 100%;
        border-top: 1px solid #E5E8EC;
        border-left: 1px solid #E5E8EC;
        td {
            border: 0;
            height: 22px;
            line-height: 22px;
            text-align: center;
            width: 72px;
            border-bottom: 1px solid #E5E8EC;
            border-right: 1px solid #E5E8EC;
        }
        td span {
            color: red;
        }
        tr:first-child {
            background: #ecf2fc;
        }
    }
}
.nodata {
    height: 400px;
}
</style>
