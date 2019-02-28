<template>
    <div class="tools-bar">
        <div class="nav-tools">
            <ul>
                <li v-for="(item, key) in navItems" :key="key" @click="select(key, item)" :title="item.name" :class="[ 'icon-toolsbar-' + (!!item.cls ? item.cls : key), { tooled : item.status }, { 'not-allowed': (![ 'maptab', 'historyCase' ].includes(key) && historyCase) } ]">
                    <span :class="{'alarmNum': marqueeLength}" v-if="key === 'warn'"></span>
                </li>
            </ul>
        </div>
        <div class="more-tools" v-if="moreStatus">
            <ul>
                <li v-for="(item, key) in moreItems" :key="key">
                    <div @click="select(key, item)" :class="{ 's-item' : item.status }">
                        <i :class="'icon-toolsbar-' + (!!item.cls ? item.cls : key)"></i>
                        <label>{{ item.name }}</label>
                    </div>
                </li>
            </ul>
        </div>
        <div class="link" v-if="link.url">
            <div class="title-nomove">省突平台链接<a href="#" class="close" @click="close"></a></div>
            <div class="box" v-if="link.status">
                <div class="tip">
                    <span>请复制以下链接，在IE浏览器中打开省突平台。</span>
                    <span>注意：需将省突平台加入“兼容性视图”</span>
                </div>
                <div class="copy">
                    <textarea id="link-path" v-model="link.url" />
                    <div class="cp-tip">
                        <label>{{ link.tip }}</label>
                        <a class="btn" @click="copy">复制</a>
                    </div>
                </div>
            </div>
            <div class="box" v-else>
                <div class="tip error">
                    <span class="icon-sysTip-error"></span>
                    <span class="info">该账号未绑定省突账号或没有绑定权限，不能直接登陆省突。请在后台管理中进行绑定或使用专属账号登陆。</span>
                </div>
            </div>
        </div>
        <v-map-tab v-if="navItems.maptab.status"></v-map-tab>
        <v-opacity v-if="moreItems.opacity.status"></v-opacity>
        <v-grid-rain v-if="navItems.gridRain.status"></v-grid-rain>
        <v-atwill v-if="navItems.atwill.status"></v-atwill>
        <v-decide-serve v-if="navItems.decisionServe.status" ></v-decide-serve>
        <v-navigation v-if="navItems.navigation.status" :navigationName="'topTools'"></v-navigation>
        <v-global-search v-if="navItems.globalSearch.status"></v-global-search>
        <v-econtrol v-if="navItems.econtrol.status"></v-econtrol>
        <v-tag v-if="moreItems.tag.status"></v-tag>
        <v-track v-if="moreItems.track.status"></v-track>
        <v-emergency-lib v-if="navItems.emergencyLib.status"></v-emergency-lib>
        <v-video-back v-if="navItems.video.status"></v-video-back>
        <v-suggestion v-if="moreItems.suggestion.status"></v-suggestion>
        <v-history-case v-if="navItems.historyCase.status"></v-history-case>
        <v-alarm></v-alarm>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import MapTab from '../SubPanel/MapTab';
import Atwill from '../SubPanel/Atwill';
import Navigation from '../SubPanel/Navigation';
import GlobalSearch from '../SubPanel/GlobalSearch';
import Model from '../SubPanel/Model';
import Level from '../SubPanel/Level';
import Opacity from '../SubPanel/Opacity';
import GridRain from '../SubPanel/GridRain';
import Typhoon from '../SubPanel/Typhoon';
import Econtrol from '../SubPanel/Econtrol';
import Track from '../SubPanel/Track';
import Tag from '../SubPanel/Tag';
import EmergencyLib from '../SubPanel/EmergencyLib';
import DecideServe from '../SubPanel/DecideServe';
import VideoBack from '../SubPanel/VideoBack';
import Suggestion from '../SubPanel/Suggestion';
import Warn from '../SubPanel/Alarm';
import HistoryCase from '../SubPanel/HistoryCase/HistoryCaseMain';
import { Base64 as base64 } from 'js-base64'

export default {
    components: {
        'v-map-tab': MapTab,
        'v-atwill': Atwill,
        'v-navigation': Navigation,
        'v-global-search': GlobalSearch,
        'v-model': Model,
        'v-level': Level,
        'v-opacity': Opacity,
        'v-grid-rain': GridRain,
        'v-typhoon': Typhoon,
        'v-econtrol': Econtrol,
        'v-track': Track,
        'v-tag': Tag,
        'v-emergency-lib': EmergencyLib,
        'v-decide-serve': DecideServe,
        'v-video-back': VideoBack,
        'v-suggestion': Suggestion,
        'v-alarm': Warn,
        'v-history-case': HistoryCase
    },
    data() {
        return {
            navItems: {
                historyCase: { name: '历史案例库', status: false },
                maptab: { name: '地图切换', status: false },
                warn: { name: '任意点风险预警', status: false },
                atwill: { name: '划任意面', status: false },
                gridRain: { name: '格点雨量', status: false },
                econtrol: { name: '应急指挥工具', status: false },
                decisionServe: { name: '决策服务', status: false },
                navigation: { name: '路线导航', status: false },
                globalSearch: { name: '全局搜索', status: false },
                emergencyLib: { name: '应急库', status: false },
                video: { name: '视频回传', status: false },
                about: { name: '关于', status: false },
                otherTools: { name: '其他工具', status: false }
            },
            moreItems: {
                distance: { name: '测距', status: false },
                lonlat: { name: '经纬线', status: false },
                tag: { name: '标签', status: false },
                track: { name: '信息追踪', status: false },
                monitor: { name: '数据监控', status: false },
                bigScreen: { name: '大屏', status: false },
                cover: { name: '遮罩', status: false },
                suggestion: { name: '意见', status: false },
                opacity: { name: '透明度', status: false },
                link: { name: '省突平台', status: false },
                oppLink: { name: '后台管理', status: false, cls: 'link' },
                exit: { name: '退出', status: false }
                // boxSelect: { name: '框选', status: false },
                // disaster: { name: '灾情', status: false }
            },
            moreStatus: false,
            link: {
                url: null,
                tip: '',
                status: false
            }
        };
    },

    computed: {
        ...mapState({
            userId: state => state.userSetting.userId,
            tag: state => state.toolsBar.tag,
            about: state => state.toolsBar.about,
            suggestion: state => state.toolsBar.suggestion,
            gridRain: state => state.toolsBar.gridRain,
            econtrol: state => state.toolsBar.econtrol,
            track: state => state.toolsBar.track,
            video: state => state.toolsBar.video,
            code: state => state.sys.code,
            bigScreen: state => state.toolsBar.bigScreen,
            showAlarmFunc: state => state.alarm.showAlarmFunc,
            marqueeLength: state => state.alarm.marqueeLength,
            historyCase: state => state.historyCase.play,
            userName: state => state.userSetting.userName
        })
    },

    watch: {
        marqueeLength(val) {
            this.navItems.warn.name = '任意点风险预警：' + val;
            this.navItems = Object.assign({}, this.navItems, {});
            if (val) {
                utils.clearTimer(this.timer.delay)
                this.timer.delay = window.setTimeout(() => {
                    this.showAlarmFunc(val)
                }, 80)
            }
        },
        'navItems.warn.status'(val) {
            if (this.selectTrigger) this.showAlarmFunc(val);
        },
        about() {
            this.moreItems.about.status = this.about;
        },
        tag() {
            this.moreItems.tag.status = this.tag;
        },
        suggestion() {
            this.moreItems.suggestion.status = this.suggestion;
        },
        gridRain() {
            this.navItems.gridRain.status = this.gridRain;
        },
        econtrol() {
            this.navItems.econtrol.status = this.econtrol;
        },
        track() {
            this.moreItems.track.status = this.track;
        },
        video() {
            this.navItems.video.status = this.video;
        },
        bigScreen() {
            this.moreItems.bigScreen.status = this.bigScreen;
        },
        historyCase(status) {
            if (status) {
                for (const type of this.activeTools) {
                    const item = this.navItems[type] || this.moreItems[type];
                    const status = item.status = false;
                    this.initTools(type, status);
                }
            }
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.distance = lmap.custom.init('distance');
            this.updateParam(['toolsBar', { navItemsCallback: this.updateTools }]);
            this.selectTrigger = true;
            this.activeTools = [];
            this.urls = {
                // exit: `/login/loginOut?code=${this.code}` // 退出登录
                exit: '/dss/'
                // exit: `http://127.0.0.1:8090/login/loginOut?code=${this.code}` // 退出登录
            }
            this.timer = { delay: null, copy: null }
        },

        updateTools(type, open = false) {
            this.selectTrigger = false;
            this.updateParam(['opacity', { status: this.moreStatus }]);
            this.navItems[type].status = open;
            this.navItems = Object.assign({}, this.navItems, {});
        },

        /**
         * 初始化工具
         * @param {object} type 工具类型
         */
        select(type, item) {
            if (![ 'maptab', 'historyCase' ].includes(type) && this.historyCase) {
                return;
            }
            const status = item.status = !item.status;
            if (status && ![ 'maptab', 'historyCase' ].includes(type)) {
                this.activeTools.push(type);
            } else {
                const index = this.activeTools.indexOf(type);
                this.activeTools.splice(index, 1);
            }
            this.initTools(type, status);
        },

        initTools(type, status) {
            this.selectTrigger = true;
            switch (type) {
                case 'otherTools':
                    this.moreStatus = !this.moreStatus;
                    this.updateParam(['opacity', { status: this.moreStatus }]);
                    break;
                case 'distance':
                    if (status) {
                        this.distance.init({ map: lmap.map });
                    } else {
                        this.distance.remove();
                    }
                    break;
                case 'lonlat':
                    if (status) {
                        this.graticule = lmap.ctrl.addGraticule(lmap.map);
                    } else {
                        if (!!this.graticule) {
                            lmap.ctrl.removeGraticule(this.graticule);
                        }
                    }
                    break;
                case 'about':
                case 'tag':
                case 'suggestion':
                case 'gridRain':
                case 'econtrol':
                case 'track':
                case 'video':
                case 'historyCase':
                    // 需要控制外部开关
                    this.updateParam([ 'toolsBar', { [type]: status } ]);
                    break;
                case 'bigScreen':
                    window.localStorage.setItem('bigScreen', status);
                    this.updateParam([ 'toolsBar', { [type]: status } ]);
                    break;
                case 'cover':
                    this.updateParam([{ [type]: status }]);
                    break;
                case 'exit':
                    this.moreItems.exit.status = false;
                    window.sessionStorage.setItem('user', '');
                    window.localStorage.setItem('j_view_autologin', '');
                    // this.updateParam([{ login: true }]);
                    // utils.get(this.urls.exit, {code: this.code}).then((json) => {
                    // });
                    window.location.href = this.urls.exit // 'http://10.148.16.53/dss/index.html';
                    break;
                case 'link':
                    if (status) {
                        const url = sysconfig.TESTPATH + '/login/checkUserInSt';
                        const param = { code: this.code, userId: base64.encode(this.userId) };
                        utils.get(url, param).then((json) => {
                            this.link.status = json.data.bind;
                            this.link.url = this.getLinkURL();
                        });
                    } else {
                        this.link.url = null;
                    }
                    break;
                case 'oppLink':
                    this.moreItems.oppLink.status = false;
                    // window.open('http://10.148.10.208:5008');
                    window.open('http://10.148.16.56:8080');
                    break;
                case 'monitor':
                    this.moreItems.monitor.status = false;
                    const host = window.location.host;
                    if (host.includes('localhost') || host.includes('10.148.10.208')) {
                        window.open(`http://10.148.10.208:8038/gdmonitor/login/freeLogin?userName=${this.userName}`);
                    } else {
                        window.open(`http://10.148.16.53/gdmonitor/login/freeLogin?userName=${this.userName}`);
                    }
                    break;
                default:
                    break;
            }
        },

        getLinkURL() {
            let t;
            if (window.location.host.includes('localhost')) {
                t = `${sysconfig.TESTPATH}/login/crossDomainSSO?code=44&userId=${base64.encode(this.userId)}&dateTime=${base64.encode(TU().format('YYYYMMDDHHmmss'))}`;
            } else {
                t = `${window.location.host}/dss-server-gd/login/crossDomainSSO?code=44&userId=${base64.encode(this.userId)}&dateTime=${base64.encode(TU().format('YYYYMMDDHHmmss'))}`;
            }
            return t;
        },

        initBigScreen() {
            const status = window.localStorage.getItem('bigScreen') === 'true';
            this.moreItems.bigScreen.status = status;
            this.updateParam([ 'toolsBar', { bigScreen: status } ]);
        },

        copy() {
            this.link.url = this.getLinkURL();
            document.getElementById('link-path').select();
            document.execCommand('copy');
            this.link.tip = '复制成功！'
            utils.clearTimer(this.timer.copy);
            this.timer.copy = window.setTimeout(() => {
                this.link.tip = ''
            }, 5000);
        },

        close() {
            this.moreItems.link.status = false;
            this.link.url = null;
        }

    },
    mounted() {
        this.initConstData();
        this.initBigScreen();
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
@images: '../../assets/img';

.tools-bar {
    ul {
        padding: 0px;
        margin: 0px;
        text-align: right;

        li {
            list-style-type: none;
        }
    }

    .nav-tools {

        .alarmNum {
            position: absolute;
            bottom: 1px;
            right: 2px;
            display: block;
            width: 6px;
            height: 6px;
            background: url('@{images}/toolsbar/alarm-red.png');
        }

        ul li {
            color: #a6a9b0;
            margin-left: 4px;
            width: 22px;
            height: 22px;
            line-height: 22px;
            font-size: 16px;
            display: inline-block;
            text-rendering: auto;
            text-align: center;
            position: relative;
            top: 2px;
        }

        ul li:hover:before {
            color: #fff;
        }

        ul li.tooled {
            background-color: @select-font-color;
            &:before {
                color: #fff;
            }
        }

        ul li.tooled:hover {
            background-color: @select-font-color;
        }
    }

    .more-tools {
        width: 486px;
        height: 60px;
        line-height: 30px;
        background-color: #fff;
        box-shadow: @shadow;
        position: fixed;
        top: 30px;
        right: 0px;
        z-index: @panel-index;

        ul li {
            float: left;
            cursor: pointer;
            height: 26px;
            line-height: 26px;
            width: auto;
            text-align: left;
            margin: 2px 10px;
            position: relative;
            min-width: 56px;

            label {
                cursor: pointer;
            }
            i {
                font-size: 18px;
                vertical-align: middle;
                position: relative;
                top: -1px;
            }
            &:hover i:before,
            .s-item i:before {
                color: @select-font-color;
            }
        }
        .s-item label {
            color: @select-font-color;
        }
    }

    .link {
        position: fixed;
        background: #fff;


        width: 370px;
        height: 168px;
        top: calc(~'50% - 84px');
        left: calc(~'50% - 185px');

        z-index: @pop-index;
        box-shadow: @shadow;

        .box {
            padding: 0px 6px 6px 6px;
            .tip {
                text-align: left;
                margin: 4px 4px;
                span {
                    display: block;
                    .height(22px);
                }
                &.error {
                    margin-top: 38px;
                    margin-left: 10px;
                    .icon-sysTip-error {
                        font-size: 24px;
                        float: left;
                        margin-top: 12px;
                        &::before {
                            color: red;
                        }
                    }
                    .info {
                        float: left;
                        width: 314px;
                        margin-left: 6px;
                    }
                }
            }
            .copy {
                textarea {
                    display: inline-block;
                    resize: none;
                    width: 260px;
                    height: 70px;
                }
                .cp-tip {
                    width: 82px;
                    display: inline-block;
                    position: relative;
                    bottom: 10px;

                    a {
                        width: 74px;
                    }
                    label {
                        display: block;
                        color: red;
                    }
                }
            }
        }

        // div {
        //     text-align: left;
        //     padding: 4px;

        //     textarea {
        //         resize: none;
        //         width: 200px;
        //         height: 78px;
        //         float: left;
        //     }

        //     a.btn {
        //         position: absolute;
        //         bottom: 9px;
        //         margin-left: 6px;
        //         width: 74px;
        //     }

        //     label {
        //         display: block;
        //         color: red;
        //     }
        // }
    }

}

.big {
    .tools {
        top: 10px;
    }
    .tools {
        width: 542px;
    }

    .more-tools {
        top: 45px;
        width: 616px;
        height: 68px;

        ul li {
            min-width: 70px;
            height: 30px;
            line-height: 30px;
            text-align: left;
            margin: 2px 9px;

            i {
                margin-top: 6px;
                width: 20px;
                height: 20px;
                font-size: 20px;
            }
        }
    }

    .nav-tools {
        ul li {
            width: 28px;
            height: 28px;
            line-height: 28px;
            font-size: 15px;
            font-size: 24px;
            position: relative;
            top: 4px;
        }
        ul li:before {
            width: 28px;
            height: 28px;
            background-size: auto auto !important;
        }
    }

    .link {
        width: 446px;
        height: 176px;
        top: calc(~'50% - 88px');
        left: calc(~'50% - 223px');
        .box {
            padding: 0px 10px 10px 10px;
            .copy {
                textarea {
                    width: 300px;
                    font-size: 18px;
                }
                .cp-tip {
                    width: 112px;
                    a {
                        width: 108px;
                    }
                }
            }
            .tip {
                &.error {
                    margin-top: 30px;
                    .info {
                        width: 370px;
                    }
                    .icon-sysTip-error {
                        margin-top: 24px;
                    }
                }
            }
        }
    }
}
</style>
