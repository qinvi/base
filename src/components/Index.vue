<template>
<div id="app" :class="[ { big: bigScreen }, 'app' ]">
    <nav class="app-top" v-if="mapStatus">
        <span class="top-title">{{ areaName }}应急指挥决策辅助系统<small>(EAGLE)</small><label @click="openAbout">{{ version }}</label></span>
        <div class="app-left">
            <v-user></v-user>
            <v-region></v-region>
        </div>
        <div class="app-right">
            <v-tools-bar></v-tools-bar>
        </div>
    </nav>
    <div class="app-content">
        <div :class="{ 'mask': mask }"></div>
        <div id="linkcm-map" class="linkcm-map"></div>

        <div id="gis-layer" v-if="mapStatus">
            <v-mountain-torrents v-if="mountainTorrents"></v-mountain-torrents>
            <v-radar v-if="radar"></v-radar>
            <v-site v-if="site"></v-site>
            <v-cloud v-if="cloud"></v-cloud>
            <v-thunder v-if="thunder"></v-thunder>
            <v-agr v-if="agr"></v-agr>
            <v-air v-if="air"></v-air>
            <v-ship v-if="ship"></v-ship>
            <v-geologic-hazard v-if="geologicHazard"></v-geologic-hazard>
            <v-resirvoir-both v-if="resirvoir || reservoirsSWJ"></v-resirvoir-both>
            <v-select-point></v-select-point>
            <v-poi v-if="poiTypes"></v-poi>
            <v-highway v-if="highway"></v-highway>
            <v-traffic-video v-if="realWeather"></v-traffic-video>
            <v-video v-if="videoTypes"></v-video>
            <v-rain-wran v-if="rainWarn"></v-rain-wran>
            <v-water-system v-if="waterSystem"></v-water-system>
            <v-live-thing v-if="liveThing"></v-live-thing>
            <v-liveVideo v-if="liveVideo"></v-liveVideo>
            <v-river v-if="river"></v-river>
        </div>

        <div id="sys-panel" v-if="mapStatus">
            <v-tip></v-tip>
            <v-model></v-model>
            <v-map-ctrl></v-map-ctrl>
            <v-level v-if="level"></v-level>
            <v-time></v-time>
            <v-base-info></v-base-info>
            <v-typhoon v-if="typhoon"></v-typhoon>
            <v-about v-if="about"></v-about>
            <v-track-min v-if="trackMin"></v-track-min><!--trackMin-->
            <v-horselamp></v-horselamp>
            <!-- <v-viewer></v-viewer> -->
            <!-- <v-suggestion v-if="suggestion"></v-suggestion> -->
        </div>
        <div id="popBox">
            <v-poi-normal v-if="normalType === 'normal'"></v-poi-normal>
            <v-poi-emergency v-if="normalType === 'emergency'"></v-poi-emergency>
            <v-geologicHazardPop v-if="normalType === 'geologicHazard'"></v-geologicHazardPop>
            <v-poi-reservoir v-if="reservoirsDetail && resirvoir"></v-poi-reservoir>
            <v-poi-reservoirSWJ v-if="reservoirsSWJDetail && reservoirsSWJ"></v-poi-reservoirSWJ>
            <v-poi-site v-if="!!poiSiteData"></v-poi-site>
            <v-typhoon-pop v-if="typhoon"></v-typhoon-pop>
            <v-legend></v-legend>
            <v-blockage v-if="typhoonPanel || sitePanel"></v-blockage>
            <v-poi-rain-warn v-if="rainWarnPoi"></v-poi-rain-warn>
            <v-imgGallery v-if="galleryImagesType"></v-imgGallery>
            <v-global-alerts></v-global-alerts>
            <v-sys-tip></v-sys-tip>
            <v-loading-indicator></v-loading-indicator>
        </div>
        <div id="pluginAll">
            <v-click-plugin></v-click-plugin>
        </div>
    </div>
    <div class="bottom">
        <div id="mouse-position" class="mouse-position"></div>
    </div>
</div>
</template>

<script>

import { mapActions, mapState } from 'vuex';
import User from './Nav/User';
import Region from './Nav/Region';
import ToolsBar from './Nav/ToolsBar';

import Time from './Panel/Time';
import MapCtrl from './Panel/MapCtrl';
import BaseInfo from './Panel/BaseInfo';

import Tip from './SubPanel/Tip';
import Model from './SubPanel/Model';
import Level from './SubPanel/Level';
import About from './SubPanel/About';

import Tag from './SubPanel/Tag';
import Typhoon from './SubPanel/Typhoon';
import TrackMin from './SubPanel/TrackMin';
import HorseLamp from './SubPanel/HorseLamp';

import Radar from './GisLayer/Radar';
import Site from './GisLayer/Site';
import Cloud from './GisLayer/Cloud';
import Thunder from './GisLayer/Thunder';
import Agr from './GisLayer/Agr';
import Air from './GisLayer/Air';
import Ship from './GisLayer/Ship';
import GeologicHazard from './GisLayer/GeologicHazard';
import ResirvoirBoth from './GisLayer/Reservoir';
import SelectPoint from './GisLayer/SelectPoint';
import PoiLayers from './GisLayer/Poi';
import MountainTorrents from './GisLayer/MountainTorrents';
import RainWarn from './GisLayer/RainWarn';
import Video from './GisLayer/Video'
import TrafficVideo from './GisLayer/TrafficVideo'
import HighWay from './GisLayer/Highway'
import WaterSystem from './GisLayer/WaterSystem';
import Viewer from './PopupBox/Viewer';

import PoiNormal from './PopupBox/PoiNormal';
import PoiEmergency from './PopupBox/PoiEmergency';
import GeologicHazardPop from './PopupBox/GeologicHazard';
import PoiSite from './PopupBox/Site';
import PoiReservoir from './PopupBox/PoiReservoir';
import PoiReservoirSWJ from './PopupBox/PoiReservoirSWJ';
import TyphoonPop from './PopupBox/Typhoon';
import Legend from './PopupBox/Legend';
import Blockage from './PopupBox/Blockage';
import PoiRainWarn from './PopupBox/PoiRainWarn';
import ImageGallery from './PopupBox/imgGallery';

import ClickPlugin from './Plugins/PoiClick';
import GlobalAlerts from './Plugins/GlobalAlerts';
import SysTip from './PopupBox/SysTip';

import 'perfect-scrollbar/css/perfect-scrollbar.css';

import LiveThing from './GisLayer/LiveThing';
import River from './GisLayer/River';
import LoadingIndicator from './PopupBox/LoadingIndicator'

export default {
    name: 'app',
    components: {
        'v-user': User,
        'v-region': Region,
        'v-tools-bar': ToolsBar,
        'v-base-info': BaseInfo,
        'v-time': Time,
        'v-map-ctrl': MapCtrl,
        'v-tip': Tip,
        'v-model': Model,
        'v-level': Level,
        'v-about': About,
        'v-tag': Tag,
        'v-track-min': TrackMin,
        'v-highway': HighWay,
        'v-typhoon': Typhoon,
        'v-radar': Radar,
        'v-site': Site,
        'v-cloud': Cloud,
        'v-thunder': Thunder,
        'v-geologic-hazard': GeologicHazard,
        'v-resirvoir-both': ResirvoirBoth,
        'v-agr': Agr,
        'v-air': Air,
        'v-ship': Ship,
        'v-video': Video,
        'v-traffic-video': TrafficVideo,
        'v-mountain-torrents': MountainTorrents,
        'v-rain-wran': RainWarn,
        'v-select-point': SelectPoint,
        'v-poi': PoiLayers,
        'v-poi-normal': PoiNormal,
        'v-poi-emergency': PoiEmergency,
        'v-geologicHazardPop': GeologicHazardPop,
        'v-poi-site': PoiSite,
        'v-poi-reservoir': PoiReservoir,
        'v-poi-reservoirSWJ': PoiReservoirSWJ,
        'v-typhoon-pop': TyphoonPop,
        'v-legend': Legend,
        'v-blockage': Blockage,
        'v-click-plugin': ClickPlugin,
        'v-poi-rain-warn': PoiRainWarn,
        'v-imgGallery': ImageGallery,
        'v-global-alerts': GlobalAlerts,
        'v-horselamp': HorseLamp,
        // 'v-viewer': Viewer,
        'v-water-system': WaterSystem,
        'v-sys-tip': SysTip,
        'v-live-thing': LiveThing,
        'v-liveVideo': Viewer,
        'v-river': River,
        'v-loading-indicator': LoadingIndicator
    },
    data() {
        return {
            mapStatus: false
        }
    },
    computed: {
        ...mapState({
            name: state => state.sys.name,
            areaName: state => state.sys.areaName,
            ename: state => state.sys.ename,
            version: state => state.sys.version,
            code: state => state.sys.code,

            level: state => state.level.status,
            model: state => state.model.status,
            mountainTorrents: state => state.mountainTorrents.status,
            // modelMountain: state => state.mountainTorrents.model,

            poiTypes: state => state.poi.types,

            radar: state => state.radar.status,
            thunder: state => state.thunder.status,
            site: state => state.site.status,
            ship: state => state.ship.status,
            cloud: state => state.cloud.status,
            agr: state => state.agr.status,
            air: state => state.air.status,
            geologicHazard: state => state.geologicHazard.status,
            resirvoir: state => state.SOUTHRESERVOIR.status, // state.reservoirs.status,
            reservoirsDetail: state => state.SOUTHRESERVOIR.detail,
            reservoirsSWJ: state => state.reservoirsSWJ.status,
            reservoirsSWJDetail: state => state.reservoirsSWJ.detail,
            video: state => state.video.status,
            typhoon: state => state.typhoon.status,
            videoTypes: state => state.video.types,
            realWeather: state => state.realWeather.status,
            liveVideo: state => state.liveView.status,
            highway: state => state.highway.status,
            waterSystem: state => state.waterSystem.status,

            tag: state => state.toolsBar.tag,
            about: state => state.toolsBar.about,
            // suggestion: state => state.toolsBar.suggestion,

            bigScreen: state => state.toolsBar.bigScreen,

            normalType: state => state.normalPoiDetail.type,
            poiSiteData: state => state.site.poiData,
            typhoonPanel: state => state.typhoon.panelCallback,
            sitePanel: state => state.site.panelCallback,
            rainWarn: state => state.rainWarn.status,
            rainWarnPoi: state => state.rainWarn.poiStatus,
            galleryImagesType: state => state.imgGallery.type,
            navItemsCallback: state => state.toolsBar.navItemsCallback,

            trackMin: state => state.trackMin.status,

            liveThing: state => state.liveThing.status,
            river: state => state.river.status,
            reservoirType: state => state.reservoirDetails.type,

            mask: state => state.mask.status

        })
    },
    watch: {
        normalType() {
            // console.info(this.normalType, 1);
        },
        code() {
            this.updateSysName();
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        openAbout() {
            this.updateParam([ 'toolsBar', { about: !this.about } ]);
            this.navItemsCallback('about');
        },
        updateSysName() {
            const title = utils.selectElem('#sysname');
            title.text = `${this.areaName}${this.name}${this.ename} ${this.version}`;
        }
    },
    mounted () {
        this.mapStatus = lmap.initMap('linkcm-map');
        lmap.ctrl.mousePosition(lmap.map, 'mouse-position');
        this.updateSysName();
    }
}
</script>

<style lang='less'>
@import "../assets/css/common.less";
@import "../assets/css/slider.less";
@import "../assets/css/icomoon/style.css";

.app {
    height: 100%;
    font-family: "Microsoft Yahei";
    min-width: 1200px;
    color: @font-color;
    font-size: @font-normal;
    cursor: default !important;
    .ps > .ps__rail-x,
    .ps > .ps__rail-y {
        opacity: 0.6;
        .ps__thumb-y {
            background-color: rgba(102, 102, 102, 0.4);
            // background-color: rgb(63, 62, 62);
        }
    }
    // 滚动条样式调整
    .iScrollIndicator {
        cursor: pointer;
        background: #ccc !important;
        border: 1px solid #ccc !important;
    }
    .app-top {
        width: 100%;
        height: 30px;
        text-align: center;
        background: @main-color;
        .app-left {
            position: absolute;
            top: 0px;
            left: 0px;
            width: auto;
            height: 30px;
            line-height: 30px;
        }
        .app-right {
            position: absolute;
            top: 0;
            right: 0;
            padding-left: 5px;
            height: 30px;
            line-height: 30px;
            // & > div {
            //     display: inline-block;
            // }
        }
        .top-title {
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            height: 30px;
            line-height: 30px;
            letter-spacing: 2px;
            width: auto;
            small {
                font-weight: 400;
                font-size: 16px;
                font-family: "Microsoft Yahei";
            }
            label {
                letter-spacing: 0;
                margin-left: 5px;
                font-weight: 400;
                cursor: pointer;
                font-size: @font-normal;
            }
        }
    }
    .app-content {
        width: 100%;
        position: absolute;
        top: 30px;
        bottom: 0px;
        left: 0px;
        right: 0px;
        overflow: hidden;
        .linkcm-map {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
    }
    .bottom {
        .mouse-position {
            position: absolute;
            bottom: 33px; //0;
            left: 50%;
            z-index: @panel-index;
            width: 140px;
            height: 25px;
            font-weight: 700;
            font-size: 14px;
            transform: translateX(-50%);
            text-shadow: #76a6fd 1px 0 0, #76a6fd 0 1px 0, #76a6fd -1px 0 0, #76a6fd 0 -1px 0;
            text-align: center;
            div {
                color: #fff;
            }
        }
    }

    .vue-slider-component {
        .vue-slider-dot {
            box-shadow: none;
            border: 1px solid #ccc;
        }
        .vue-slider-dot:after {
            content: '';
            position: absolute;
            width: 4px;
            height: 4px;
            top: 4px;
            left: 4px;
            border-radius: 100%;
            background: #aaa;
        }
    }
}

.param-panel {
    position: absolute;
    right: 0px;
    top: 0px;
    z-index: @panel-index;
    div {
        width: 40px;
        height: 40px;
        margin-bottom: 4px;
    }
}

.min-rectangle {
    cursor: pointer;
    width: 29px;
    height: 30px;
    line-height: 15px;
    margin-bottom: 5px;
    padding: 0 5px;
    letter-spacing: 1px;
    background: #fff;

    box-shadow: @shadow;

    text-align: center;

    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;

    align-items: center;

    justify-content: center;
}

.min-rectangle:hover {
    background: @select-font-color;
    color: #fff;
}

/*big*/
.big {
    font-size: @font-big;
    &.app {
        .app-top {
            height: 45px;
            .top-title {
                font-size: 24px;
                height: 45px;
                line-height: 45px;
                small {
                    font-size: 24px;
                }
                label {
                    font-size: 18px;
                }
            }
            .app-left {
                height: 45px;
                line-height: 45px;
            }
            .app-right {
                height: 45px;
                line-height: 45px;
            }
        }
        .app-content {
            top: 45px;
        }
        .param-panel {
            width: 75px;
            height: 56px;
            .min-rectangle {
                width: 65px;
                height: 56px;
                line-height: 23px;
            }
        }
    }
}
/* 公众实景图片冒泡样式 */
.img {
    width: 63px;
    height: 38px;
}

/* 圈选提示框 */
.tooltip {
    position: relative;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    color: white;
    padding: 4px 8px;
    opacity: 0.7;
    white-space: nowrap;
}

.tooltip-measure::before, .tooltip-static::before {
    border-top: 6px solid rgba(0, 0, 0, 0.5);
    bottom: -6px;
}

.tooltip-bottom::before {
    border-bottom: 6px solid rgba(0, 0, 0, 0.5);
    bottom: 24px;
}

.tooltip-measure::before, .tooltip-static::before, .tooltip-bottom::before {
    border-right: 6px solid transparent;
    border-left: 6px solid transparent;
    content: "";
    position: absolute;
    margin-left: -7px;
    left: 50%;
}

.tooltip-measure {
    opacity: 1;
}

.tooltip-static, .tooltip-bottom {
    background-color: #ffcc33;
    border: 1px solid white;
    color: black;
}

.tooltip-measure::before {
    border-top-color: rgba(0, 0, 0, 0.5);
}

.tooltip-static::before {
    border-top-color: #ffcc33;
}

.tooltip-bottom::before {
    border-bottom-color: #ffcc33;
}

.point-info-box {
    background: #fff;
    box-shadow: @shadow;
    padding: 6px;
    ul li {
        line-height: 30px;
        label {
            float: left;
        }
        textarea {
            height: 100px;
            max-width: 150px;
            max-height: 250px;
        }
    }
}

.mask {
    position: fixed;
    top: 0px;
    left: 0px;
    z-index: @mask-index;
    height: 100%;
    width: 100%;
    filter:alpha(opacity=60);
    background-color: #c2c2c2;
    opacity: 0.2;
}
</style>
