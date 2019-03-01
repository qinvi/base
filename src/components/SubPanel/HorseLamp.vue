<template>
    <div class="marquee" :style="{width: hideLamp ? '100%' : 'auto'}"><!--v-show="realLength || showHistory"-->
        <div class="leftMar marAbsolute">
            <span class="cbox" :class="{'checked': cancelBox}" @click="cancel()"></span>
            <span>告警提醒</span>
        </div>
        <span class="hideHorse hideMain" :class="[hideLamp? 'show' : 'hide']" @click="hideMarquee()"></span>
        <div class="marqueeContent" @mouseover="hoverMarquee = true" @mouseout="hoverMarquee = false">
            <div id="lampContent" v-show="hideLamp && (historyStatus === 1)">
                <span v-for="(item1, index) in lampList" :key="index" v-show="item1['show']">
                    <span class="lampList" v-for="(item, index1) in item1['list']" :key="index1">
                        <img :src="imgUrl + item.poiType + '16&code=44'" alt="">
                        <span class="lampText">{{item.text}}</span> <!--http://127.0.0.1:8080/icon/16X16/-->
                    </span>
                </span>
            </div>
            <div v-show="hideLamp && (historyStatus === 2)">结果正在计算中，大概1分钟，请稍等......</div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              HorseLamp list
 * ----------------------------------------------------------------------------
 * hideMarquee              - 隐藏/显示走马灯
 * cancel                   - 告警点击
 * initConstData            - 初始化不需要setter的变量
 * initMarquee              - 初始化走马灯
 * initLamp                 - 初始化HorseLamp、每次告警列表标记操作都会调用
 * clearAnimate             - 清除当前动画
 * marqueeChunk             - 监听走马灯块动画完成情况
 * lampStyle                - 计算lamplist的width
 * wmsImage                 - 后台画poi
 */
import { mapActions, mapState } from 'vuex';
export default {
    data() {
        return {
            lampList: [],
            realLength: 0,
            hoverMarquee: false,
            hideLamp: false, // 走马灯隐藏
            showHistory: true, // 展示数据
            cancelBox: true, // 告警提醒点击
            historyStatus: 2, // 历史查询状态
            imgUrl: sysconfig.TESTPATH + '/basedata/getIconImage?iconName='
        }
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            sysMinTime: state => state.time.sysMinTime,
            code: state => state.sys.code,
            marquee_Time: state => state.alarm.marquee_Time,
            alarmListClick: state => state.alarm.alarmListClick,
            marquee_level: state => state.alarm.marquee_level,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            belongTo: state => state.normalPoiDetail.belongTo,
            pointsVisible: state => state.alarm.pointsVisible,
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        hoverMarquee(val) {
            if (val) {
                document.getElementById('lampContent').style.animationPlayState = 'paused';
            } else {
                document.getElementById('lampContent').style.animationPlayState = 'running';
            }
            // const t = document.getElementById('lampContent').style.animation.replace(/ paused| running/g, '');
            // document.getElementById('lampContent').style.animation = val ? (t + ' paused') : (t + ' running');
        },
        realLength(val) {
            this.updateParam(['alarm', { realLength: this.realLength }]);

            if (val === 0) {
                if (this.hideLamp) this.hideMarquee()
            } else {
                this.hideLamp = true
                this.updateParam(['alarm', { marqueeHide: true }]);
            }
        },
        cancelBox: function (val) {
            this.updateParam(['alarm', { pointsVisible: val }])
        },
        pointsVisible: function (val) {
            if (typeof val === 'number') {
                this.cancel()
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 点击
         * @param {object} e 地图参数
         */
        click(e) {
            if (!this.cancelBox || !this.lampList.length) return;
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const clickIndex = this.getClickIndex();
            const { poiTypes, warningTypes, mark } = this.poi.params;
            const zoom = lmap.util.getZoom(lmap.view);
            const { code, dateTime } = this.getParams();
            const params = { lon, lat, poiTypes, warningTypes, mark, code, dateTime, zoom };
            utils.clearTimer(this.timer.detailTimer);
            this.timer.detailTimer = window.setTimeout(() => {
                utils.GET(this.urls.detail, params).then((json) => {
                    if (!utils.isEmptyObject(json.data)) this.clickPlugin('alarmCallback', json, clickIndex); // 触发poi点击插件
                });
            }, 50);
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json { 组装过的传送数据, poi详情请求过来的数据 }
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            this.removeSelectPoint('monitor', 'alarm');
            this.updateParam([ 'selectPoint', { lonlat: [ json.data.lon, json.data.lat ], type: 'normal&alarm' } ]); // 高亮poi
            this.updateParam([ 'normalPoiDetail', { data: json, type: 'normal', belongTo: 'alarm', selectPoiType: 'alarm' } ]);
            this.alarmListClick();
        },

        /**
         * 隐藏/显示走马灯
         */
        hideMarquee() {
            this.hideLamp = !this.hideLamp;
            this.updateParam(['alarm', { marqueeHide: this.hideLamp }]);
            this.computeBottom(this.hideLamp);
        },

        /**
         * 计算地图底层高度
         * @param {boolean} b 走马灯是否有数据
         */
        computeBottom(b) {
            this.hideLamp = b;
            if (!!this.marquee_Time) this.marquee_Time(b);
            if (!!this.marquee_level) this.marquee_level(b);
        },

        /**
         * 告警点击
         */
        cancel() {
            // 对poi进行操作
            this.cancelBox = !this.cancelBox;
            if (this.cancelBox) this.wmsImage();
            else {
                this.wms = lmap.layer.remove(lmap.map, this.wms);
                const t = this.callbackActiveType();
                if (t.normal === 'alarm') this.removeSelectPoint('normal', 'alarm');
                this.removeSelectPoint('monitor', 'alarm');
                if (this.belongTo === 'alarm') {
                    this.updateParam([ 'normalPoiDetail', { type: '' } ]);
                }
            }
        },

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.updateParam(['clickCallback', { alarmCallback: this.carryDataAndStatus }]);
            this.updateParam(['alarm', { initLamp: this.initLamp }]);
            this.updateParam(['alarm', { wmsImage: this.wmsImage }]);
            this.marquee_Time(true)
            this.space = 50;
            this.firstTime = 0;
            this.marqueeIndex = 0; // 走马灯分块下标
            this.animateName = 'marquee'; // 动画名称
            this.params = null; // 告警列表传过来的参数
            this.wms = null;
            this.wmsTimer = null;
            this.marqueeTimer = null;
            this.timer = { wmsTimer: null, marqueeTimer: null, detailTimer: null };
            this.urls = {
                marqueeList: sysconfig.TESTPATH + '/warnPoi/getMarquee',
                detail: `${sysconfig.TESTPATH}/warnPoi/getPoiDetail`,
                imageMark: `${sysconfig.TESTPATH}/warnPoi/getWarnPoiImageMark`
            };
            this.poi = {
                url: sysconfig.TESTPATH + '/warnPoi/getWarnPoiImage'
            };
            this.marqueeChunk();
        },

        /**
         * 初始化走马灯
         * @param {array} marquee 未处理的走马灯数据
         */
        initMarquee(marquee) {
            const space = this.space;
            let mar = [];
            const len = Math.ceil(marquee.length / space);
            for (let i = 0; i < len; i++) { // 将走马灯分块展示
                mar[i] = { show: false };
                mar[i].list = marquee.slice(i * space, i * space + space);
            }
            mar[len] = { show: false, list: mar[0].list };
            mar[0].show = Boolean(mar[0]);
            this.lampList = mar;
            this.wmsImage(); // 加载wms服务
            this.$nextTick(() => {
                let w = document.getElementById('lampContent').offsetWidth;
                this.lampStyle(w); // 计算走马灯偏移的left值
            });
        },

        /**
         * 后台画poi
         */
        wmsImage(params = this.params) {
            if (!this.cancelBox) return;
            if (!!this.timer.wmsTimer) window.clearTimeout(this.timer.wmsTimer);
            this.timer.wmsTimer = window.setTimeout(() => {
                const { poiTypes, warningTypes, excludePoi, selectPoi, mark } = params;
                const { code, dateTime } = this.getParams();
                const param = { poiTypes, warningTypes, excludePoi, selectPoi, code, dateTime, mark };
                utils.POST(this.urls.imageMark, param).then((json) => {
                    this.poi.params = { imageMark: json.data.imageMark, poiTypes, warningTypes, code, dateTime, mark };
                    if (!!this.wms) lmap.image.updateWMS(this.wms, this.poi, '');
                    else this.wms = lmap.image.WMS(lmap.map, this.poi, 'poi', '');
                });
            }, 80);
        },

        /**
         * 获取请求参数
         */
        getParams() {
            let time = this.firstTime ? this.sysMinTime : new Date();
            return {
                code: this.code,
                dateTime: TU(time).format('YYYY-MM-DD HH:mm:ss')
            };
        },

        /**
         * 初始化HorseLamp、每次告警列表标记操作都会调用
         * @param {object} params 传参
         */
        initLamp(params) {
            utils.clearTimer(this.timer.marqueeTimer);
            this.timer.marqueeTimer = window.setTimeout(() => {
                this.params = JSON.parse(JSON.stringify(params));
                this.params.selectPoi = '';
                this.params = Object.assign({}, this.params, {});
                const { poiTypes, warningTypes, excludePoi, mark } = params;
                const { code, dateTime } = this.getParams();
                const param = { poiTypes, warningTypes, excludePoi, code, dateTime, mark };
                utils.POST(this.urls.marqueeList, param).then((json) => {
                    this.historyStatus = json.status;
                    if (json.status === 1) {
                        this.updateParam(['alarm', { marqueeLength: json.data.resp.length }]);
                        this.showHistory = json.data.resp.length;
                        this.realLength = json.data.resp.length;
                        if (!json.data.resp.length) {
                            this.lampList = [];
                            this.wms = lmap.layer.remove(lmap.map, this.wms);
                            this.computeBottom(false);
                            // this.marquee_Time(false);
                            if (!excludePoi) this.realLength = json.data.resp.length;
                        } else {
                            this.realLength = 1;
                            if (!excludePoi) this.computeBottom(Boolean(json.data.resp.length));
                            this.initMarquee(json.data.resp);
                        }
                    } else {
                        utils.clearTimer(this.timer.marqueeTimer);
                        this.timer.marqueeTimer = window.setTimeout(() => {
                            return this.initLamp(params);
                        }, 3000);
                    }
                    this.firstTime = 1;
                });
            }, 80);
        },

        /**
         * 清除当前动画
         *
         * @param {object} parentSheet 父styleSheet
         * @param {number} index 当前动画在cssStyleSheet的位置
         */
        clearAnimate(parentSheet, index) {
            if (parentSheet.cssRules.length) {
                if (parentSheet.deleteRule) {
                    parentSheet.deleteRule(index);
                } else if (parentSheet.removeRule) {
                    parentSheet.removeRule(index);
                }
            }
        },

        /**
         * 监听走马灯块动画完成情况
         */
        marqueeChunk() {
            document.getElementById('lampContent').addEventListener('webkitAnimationEnd', () => {
                if (this.lampList[this.marqueeIndex]) {
                    this.lampList[this.marqueeIndex].show = false;
                    this.marqueeIndex = (this.marqueeIndex + 1) % (this.lampList.length);
                    this.lampList[this.marqueeIndex].show = true;
                    this.$nextTick(() => {
                        let w = document.getElementById('lampContent').offsetWidth;
                        this.lampStyle(w);
                    });
                }
            });
        },

        /**
         * 计算lamplist的width
         * @param {number} w1 走马灯宽度
         * @param {number} animateNum 动画编号
         */
        lampStyle(w1, animateNum = this.marqueeIndex + 1) {
            const defaultScreen = 1707; // 默认宽分辨率
            const screen = document.body.offsetWidth; // 当前设备宽分辨率
            let w2 = (w1 < screen) ? screen : w1;
            const duration = (w2 / screen) * 25 * (screen / defaultScreen) + 's';
            const w = -w1 + 'px';
            let rule, cssRule;
            let ss = document.sheet || document.styleSheets;
            const t = Object.keys(ss);
            let t1;
            let parentSheet, index, breakFor;
            if (this.animateName) { // 获取上个动画的cssRule、保持一个动画cssRule完成走马灯动画
                t.every((ele, i) => {
                    t1 = Object.keys(ss[i]);
                    t1.every((t, x) => {
                        rule = ss[i].cssRules[x];
                        if (rule.name === this.animateName && rule.type === CSSRule.KEYFRAMES_RULE) {
                            parentSheet = ele;
                            index = x;
                            cssRule = rule;
                            breakFor = true;
                        }
                        return !breakFor;
                    });
                    return !breakFor;
                });
            }
            const token = window.WebKitCSSKeyframesRule ? '-webkit-' : '';
            if (!parentSheet) { // 没有找到动画、通过cssRule添加动画
                const style = document.createElement('style');
                document.head.appendChild(style);
                parentSheet = style.sheet;
                index = 0;
                this.animateName = 'marquee' + animateNum;
            } else {
                animateNum = (this.animateName === ('marquee' + animateNum)) ? 0 : animateNum; // 动画轮循
                this.animateName = 'marquee' + animateNum; // 保存动画 便于下次删除
            }
            if (parentSheet) {
                this.clearAnimate(parentSheet, index); // 清除上一个动画
                parentSheet.insertRule('@' + token + 'keyframes ' + this.animateName + ' {}', index);
                cssRule = parentSheet.cssRules[index];
                (cssRule.insertRule || cssRule.appendRule).call(cssRule, '0% {}');
                (cssRule.insertRule || cssRule.appendRule).call(cssRule, '100% {}');
                cssRule.cssRules[0].style.left = screen + 'px';
                cssRule.cssRules[1].style.left = w;
            }
            let div = document.getElementById('lampContent');
            div.style.animation = div.style.WebkitAnimation = this.animateName + ' ' + duration + ' linear 1'; // infinite
        }
    },
    mounted() {
        this.initConstData();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.marquee {
    position: absolute;
    z-index: @panel-index;
    bottom: 0px;
    background: rgba(230, 239, 252, 0.9);
    // border: 1px solid #aaa;
    padding-left: 8px;
    .leftMar {
        position: absolute;
        line-height: 30px;
        border-right: 1px solid #ccc;
        padding-right: 6px;
        .cbox {
            position: relative;
            display: inline-block;
            cursor: pointer;
            top: 3px;
            width: 15px;
            height: 15px;
            border: 1px solid #ccc;;
            // margin-right: 7px;
        }
        .cbox + span {
            color: rgb(48, 134, 210);
            font-weight: bold;
        }
        .checked:after {
            content: "";
            display: inline-block;
            width: 4px;
            height: 8px;
            position: absolute;
            left: 4px;
            top: 1px;
            border-right: 2px solid #676767;;
            border-bottom: 2px solid #676767;;
            transform: rotate(45deg);
            -webkit-transform: rotate(45deg);
            -moz-transform: rotate(45deg);
            -ms-transform: rotate(45deg);
        }
    }
    .hideHorse {
        position: absolute;
        cursor: pointer;
        margin-left: 79px;
        width: 50px;
        padding-top: 11px;
    }
    .hideMain:before, .hideMain:after {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        position: absolute;
        transform: rotate(45deg);
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        -ms-transform: rotate(45deg);
    }
    .show:before {
        left: 4px;
        border-left: 2px solid #676767;
        border-bottom: 2px solid #676767;
    }
    .show:after {
        left: 10px;
        border-left: 2px solid #676767;
        border-bottom: 2px solid #676767;
    }
    .hide:before {
        left: 4px;
        border-right: 2px solid #676767;
        border-top: 2px solid #676767;
    }
    .hide:after {
        left: 10px;
        border-right: 2px solid #676767;
        border-top: 2px solid #676767;
    }
    .marqueeContent {
        height: 30px;
        overflow: hidden;
        position: relative;
        margin-left: 110px;
        #lampContent {
            white-space: nowrap;
            height: 30px;
            line-height: 30px;
            position: absolute;
            overflow: hidden;
            & + div {
                height: 30px;
                line-height: 30px;
            }
            .lampList {
                margin: 0 30px 0 0px;
                img {
                    position: relative;
                    line-height: 30px;
                    top: 3px;
                    left: 23px;
                }
                .lampText {
                    margin-left: 35px;
                }
            }
            .lampList:nth-child(1) {
                margin-left: 0px;
            }
        }
    }
}
.big {
    .marquee {
        .leftMar {
            .cbox {
                top: 0px;
            }
        }
        .hideHorse {
            margin-left: 117px;
        }
        .marqueeContent {
            margin-left: 140px;
        }
    }
}
</style>
