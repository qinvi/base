<template>
<div>
    <div class="global-search hover">
        <div class="search-top">
            <div class="search-tab">
                <ul>
                    <li v-for="(item, key) of tabs" :key="key" :class="{ select: item.status }" @click="select(item)">{{ item.text }}</li>
                </ul>
            </div>
            <div class="search-hd">
                <div class="search-bg"></div>
                <input type="text" class="search-input" :placeholder="warnMsg" v-model="search.text" @keyup.enter="searchText" @input="searchText('input')">
                <!-- <span class="warn-msg">{{ warmText || (!!last && tabs[last.type].tip) }}</span> -->
                <button class="search-button" :class="{ 'only-search': !search.status }" @click="searchText">搜索</button>
                <button class="search-button" v-show="search.status" @click="clean()">清除</button>
            </div>
        </div>
        <span class="back" v-show="globalPopType" @click="backToGlobalSearch()">返回</span>
        <div v-show="showSearchList">
            <div class="search-content">
                <ul>
                    <li v-for="(item, index) in msgs" :key="index" v-if="(((page.curr - 1) * page.count <= index) && (index < (page.curr * page.count)))" @click="selectMsg(item)"><span><label>{{ index + 1 }}</label></span>{{ item.textMap.name }}</li>
                </ul>
            </div>
            <ul class="page-control">
                <li>第{{ page.curr }}页/共{{ page.sum }}页 {{ msgs.length }}条记录</li><li class="pageNext" @click="toPage('next')">下一页</li><li class="pagePre" @click="toPage('pre')">上一页</li>
            </ul>
        </div>
        <div class="globalPop" v-if="globalPopType === 'poiPop'">
            <v-normalPop v-if="globalPoiType === 'basic'" :childDetails="globalPopDetail" :popParams="popParams"></v-normalPop>
            <v-emergencyPop v-if="globalPoiType === 'emergency'" :childDetails="globalPopDetail" :popParams="popParams"></v-emergencyPop>
        </div>
        <v-min-base-info v-if="globalPopType !== 'poiPop' || lastPanel === 'BaseInfo'" v-show="showMinBox" :wkt="wkts" :type="'globalSearch'" :destory="!globalPopType && !showMinBox"></v-min-base-info>
        <v-cases v-if="!!cases" :data="cases" @close="close"></v-cases>
    </div>
    <!-- overlay 定点搜索-->
    <div class="cricle-box-panel" ref="overlay-radius" v-show="showOverlay">
        <div>
            <ul class="radius-box">
                <li><label>定点POI搜索:</label></li>
                <li><input class="radio" type="radio" value="1000" v-model="selectRadius" @change="clickRadius()" id="radius1" /><label for="radius1">1公里</label></li>
                <li><input class="radio" type="radio" value="5000" v-model="selectRadius" @change="clickRadius()" id="radius2" /><label for="radius2">5公里</label></li>
                <li><input class="radio" type="radio" value="10000" v-model="selectRadius" @change="clickRadius()" id="radius3" /><label for="radius3">10公里</label></li>
            </ul>
            <a @click="cacelRadius()" class="close"></a>
        </div>
    </div>
</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Cases from './Cases';
import NormalPop from '../PopupBox/PoiNormal';
import EmergencyPop from '../PopupBox/PoiEmergency';
import MinBaseInfo from './MinBaseInfo';

export default {
    name: 'GlobalSearch',
    components: { 'v-cases': Cases, 'v-normalPop': NormalPop, 'v-emergencyPop': EmergencyPop, 'v-min-base-info': MinBaseInfo },
    data() {
        return {
            msgs: [],
            tabs: {
                lonlat: { text: '经纬度', type: 'lonlat', tip: '请输入经纬度值，如：113.2637,23.1314 以","分隔', status: false },
                poi: { text: 'POI', type: 'poi', tip: '请输入POI名称', status: false },
                site: { text: '监测站', type: 'site', tip: '请输入站点编号或名称', status: false },
                demage: { text: '灾害点', type: 'demage', tip: '请输入灾害名称或地址', status: false }
                // case: { text: '案例库', type: 'case', tip: '请输入案例标题关键字', status: false }
            },
            search: {
                text: '',
                status: false
            },
            page: {
                curr: 1,
                count: 8,
                sum: 1
            },
            selectRadius: '',
            warmText: '',
            last: null,
            cases: null,
            globalPopType: '',
            globalPoiType: '',
            globalPopDetail: null,
            wkts: '',
            showOverlay: false,
            overlayDetail: false,
            showMinBase: false
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime,
            bigScreen: state => state.toolsBar.bigScreen,
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            userId: state => state.userSetting.userId
        }),
        warnMsg() {
            return this.warmText || (!!this.last && this.tabs[this.last.type].tip);
        },
        showMinBox() {
            const status = this.globalPopType && this.showMinBase;
            if (status) this.lastPanel = 'poiPop';
            return status;
        },
        showSearchList() {
            return !!this.msgs[0] && !this.globalPopType;
        }
    },
    watch: {
        'search.text'(text) {
            if (text !== '格式错误') {
                this.warmText = !!text ? ' ' : this.tabs[this.last.type].tip;
                this.clean(true, true)
            }
        },
        msgs(data) {
            const sum = Math.ceil(data.length / this.page.count);
            this.page.sum = sum;
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        initConstData() {
            this.updateParam(['globalSearch', { poiPopCallback: this.showPoiPop }]);
            this.updateParam(['globalSearch', { setOverlayDetail: this.setOverlayDetail }]);
            this.dragCircle = lmap.custom.init('dragCircle');
            this.feature = null;
            this.evt = null;
            this.layer = lmap.layer.init(lmap.map, 'poi');
            this.detailType = '';
            this.style = {
                isIcon: true,
                icon: {
                    src: `${sysconfig.TESTIP}/topic/little/necImage/point.png`,
                    anchor: [0.5, 1],
                    size: [18, 28],
                    scale: 1,
                    rotation: 0,
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    anchorOrigin: 'bottom-left'
                },
                text: {
                    text: '',
                    offsetY: 10,
                    fill: {
                        color: 'red',
                        width: 1
                    }
                }
            };
            this.urls = {
                lucene: sysconfig.TESTPATH + '/search/globalSearch',
                site: sysconfig.TESTPATH + '/realTimeMonitor/getSiteWindRainInfo',
                demage: sysconfig.TESTPATH + '/basedata/getGeologyInfo',
                poiDetails: sysconfig.TESTPATH + '/basedata/getPoiDetail'
            };
            this.lastPanel = '';
            this.firstJson = null;
        },

        /**
         * 选择搜索类型
         * @param {object} item 类型对象
         */
        select(item) {
            if (!!this.last) {
                this.last.status = false;
                if (this.last.text !== item.text) this.clean();
            }
            item.status = true;
            this.last = item;
            this.warmText = item.tip;
        },

        /**
         * 搜索
         * @param {string} trigger 触发方式
         */
        searchText(triggerType) {
            if (triggerType === 'input' && this.last.type === 'lonlat') return;
            if (!!this.lazyTimer) {
                window.clearTimeout(this.lazyTimer);
                this.lazyTimer = null;
            }
            this.lazyTimer = window.setTimeout(() => {
                this.page.curr = 1;
                const text = this.search.text;
                if (!!text.trim()) {
                    if (this.last.type !== 'lonlat') {
                        this.getData(text);
                    } else {
                        let lonlat = text.replace(/,;:，；：\/\s+/g, '#').match(/\d+/g);
                        let lon, lat;
                        if (lonlat.length > 2) {
                            lon = lonlat[0] + '.' + lonlat[1];
                            lat = lonlat[2] + '.' + lonlat[3];
                        } else {
                            [lon, lat] = lonlat;
                        }
                        if (this.last.type === 'lonlat' && (!lon || !lat)) {
                            this.warmText = ' ';
                            this.search.text = '格式错误';
                        } else {
                            this.selectMsg({ lon: lon, lat: lat, textMap: { name: '经纬度点：' + lon + '，' + lat } });
                        }
                        this.search.status = true;
                    }
                }
            }, 800);
        },

        /**
         * 获取POI数据
         * @param {string} text 查询文本
         */
        getData(text) {
            const param = { type: this.last.type, userId: this.userId, keyword: text, code: this.code, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'), page: 1, onePageNum: 100 };
            utils.GET(this.urls.lucene, param).then(json => {
                this.msgs = this.formatData(json.data.resp, this.last.type);
                this.search.status = true;
            });
        },

        /**
         * 重组数据
         */
        formatData(json, type) {
            json.forEach(ele => {
                ele.tabsType = type;
            });
            return json;
            // let result = null;
            // if (type === 'poi') {
            //     result = json.map(function(data) {
            //         return { text: data.paramVal, lon: data.lon, lat: data.lat };
            //     });
            // } else if (type === 'cases') {
            //     result = json.map(function(data) {
            //         return { type, text: data.title, time: data.crTime, content: data.content, source: data.articleSource };
            //     });
            // }
            // return result;
        },

        /**
         * 数据分页
         * @param {string} type 上、下一页
         */
        toPage(type) {
            let page = this.page.curr;
            page = type === 'next' ? page + 1 : page - 1;
            page = page <= 0 ? 1 : page;
            page = page >= this.page.sum ? this.page.sum : page;
            this.page.curr = page;
        },

        /**
         * 清空搜索
         *
         * @param {boolean} [keepIcon=false] 保留打点图标
         * @param {boolean} [keepSearchText=false] 保留搜索框内容
         */
        clean(keepIcon = false, keepSearchText = false) {
            if (!keepIcon) lmap.icon.clear(this.layer);
            if (!keepSearchText) this.search = { text: '', status: false };

            this.removeDragCircle();
            this.msgs = [];
            this.globalPopType = '';
            this.showMinBase = false;
            if (this.detailType === 'site') this.updateParam(['site', { poiData: null }]);
            else if (this.detailType === 'demage') this.updateParam(['normalPoiDetail', { type: '' }]);
        },

        /**
         * 地图打点
         * @param {object} item 打点数据对象
         */
        selectMsg(item) {
            if (item.tabsType === 'case') {
                item.textMap.time = '';
                item.textMap.source = '';
                this.cases = item.textMap;
            } else {
                lmap.icon.clear(this.layer);
                this.removeDragCircle();
                const lonlat = [item.lon, item.lat];
                this.last.point = item;
                this.triggerDetail(this.last.type, item);
                lmap.ctrl.panTo(lmap.map, lonlat, 12);
                let style = Object.assign({}, this.style);
                style.text.text = item.textMap.name;
                const feature = lmap.icon.add(this.layer, style, lonlat, { type: item.tabsType, name: 'search' });
                feature.set('name', 'search');

                // const formatNum = function(num) {
                //     return Math.round(num * 100) / 100;
                // }
                // for (let x = 0; x < 1; x = x + 0.05) {
                //     window.setTimeout(function() {
                //         style.icon.anchor[1] = formatNum(2 - x);
                //         style.icon.opacity = formatNum(x);
                //         feature.setStyle(lmap.style.getStyle(style));
                //     }, formatNum(x * 1500));
                // }

                // let tempStyle = JSON.parse(JSON.stringify(this.style));
                // tempStyle.icon.src = 'http://10.148.16.53/topic/little/search/spoint.png';
                // let selectStyle = lmap.style.getStyle(tempStyle);
                // feature.set('selectStyle', selectStyle);
                // feature.set('defaultStyle', feature.getStyle());

                this.feature = feature;
                if (this.last.type === 'poi') {
                    this.getNormalDetail(item); // 全局搜索poi点后清除poi图层
                }
            }
        },

        /**
         * Poi列表点击请求详情框
         * @param {object} item 列表项
         */
        getNormalDetail(item) {
            const { lon, lat } = item;
            const poiTypes = item.textMap.type;
            const zoom = lmap.util.getZoom(lmap.view);
            const param = { lon, lat, poiTypes, zoom, code: this.code };
            utils.GET(this.urls.poiDetails, param).then(json => {
                this.lastPanel = 'list';
                this.firstJson = json;
                this.showPoiPop(json);
            });
        },

        /**
         * 打开详情弹窗
         * @param {object} 原始json数据
         */
        showPoiPop(json, showSelect = false, lastType = 'list') {
            if (!utils.isEmptyObject(json.data)) {
                this.showMinBase = false;
                this.globalPopType = 'poiPop';
                if (json.data.poiType.includes('EMERGENCY')) this.globalPoiType = 'emergency';
                else this.globalPoiType = 'basic';
                this.lastPanel = lastType;
                this.globalPopDetail = json;
                this.popParams = { noWinDrag: false, close: false, showSelect: showSelect };
                this.evt = null;
            } else {
                this.clickEvtCallback();
            }
        },

        setOverlayDetail(b) {
            this.overlayDetail = b;
        },
        backToGlobalSearch() {
            if (this.lastPanel === 'list') {
                this.globalPopType = '';
            } else if (this.lastPanel === 'poiPop') {
                this.globalPopType = 'poiPop';
                this.showPoiPop(this.firstJson);
                this.lastPanel = 'list';
                this.removeDragCircle()
            } else {
                // BaseInfo
                this.globalPopType = 'BaseInfo';
                this.lastPanel = 'poiPop';
                const t = this.callbackActiveType();
                if (!!this.globalPopDetail.data && (t.normal === this.globalPopDetail.data.poiType)) {
                    this.removeSelectPoint('normal', this.globalPopDetail.data.poiType);
                }
            }
            this.showMinBase = this.globalPopType === 'BaseInfo';
        },

        /**
         * 获取固定请求参数
         */
        getParams() {
            return { dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'), code: this.code, zoom: lmap.util.getZoom(lmap.view) + '' };
        },

        /**
         * 触发详情弹窗
         * @param {string} type 类型
         * @param {object} item 列表项
         */
        triggerDetail(type, item) {
            if (type === 'site' || type === 'demage') {
                const { dateTime, code, zoom } = this.getParams();
                const [lon, lat, siteId] = [item.lon, item.lat, item.id];
                let param = {};
                if (type === 'site') param = { code, dateTime, zoom, lon, lat, siteId };
                else param = { code, lon, lat, zoom, dateTime };
                utils.GET(this.urls[type], param).then(json => {
                    if (type === 'site') {
                        let { data } = json;
                        let { siteData } = data;
                        if (!!siteData && siteData.lon) {
                            json.checkTime = dateTime;
                            this.updateParam(['site', { poiData: siteData }]);
                            this.detailType = 'site';
                        }
                    } else {
                        if (Object.keys(json.data).length > 1) {
                            this.updateParam(['normalPoiDetail', { data: json, type: 'geologicHazard' }]);
                            this.detailType = 'demage';
                        }
                    }
                });
            }
        },
        close() {
            this.cases = null;
        },
        clickEvtCallback() {
            if (!!this.evt) {
                let evt = this.evt;
                let feature = evt.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
                    return feature;
                });
                if (!!feature && feature.get('name') === 'search' && feature.get('type') === 'poi') {
                    //  && !this.dcParam
                    if (!this.overlay) {
                        let overlay = new ol.Overlay({
                            element: this.$refs['overlay-radius'],
                            positioning: 'bottom-right'
                        });
                        evt.map.addOverlay(overlay);
                        this.overlay = overlay;
                    }
                    this.showOverlay = true;
                    let lonlat = feature.getGeometry().getCoordinates();
                    const offset = this.bigScreen ? [190, -25] : [135, -35];
                    this.overlay.setOffset(offset);
                    this.overlay.setPosition(lonlat);
                    let style = Object.assign({}, this.style);
                    style.icon.src = `${sysconfig.TESTIP}/topic/little/necImage/spoint.png`;
                    this.feature.setStyle(lmap.style.getStyle(style));
                }
            }
        },
        clickEvt(evt) {
            this.evt = evt;
            this.clickEvtCallback()
            // if (!this.overlayDetail) this.clickEvtCallback();
        },
        clickRadius() {
            let lonlat = this.feature.getGeometry().getCoordinates();
            let [lon, lat] = lmap.util.transform(lonlat, true);
            this.initDragCircle(lon, lat, this.selectRadius);
            this.globalPopType = 'BaseInfo';
        },
        cacelRadius() {
            this.removeOverlay();
        },
        removeOverlay() {
            this.style.icon.src = `${sysconfig.TESTIP}/topic/little/necImage/point.png`;
            if (!!this.feature) this.feature.setStyle(lmap.style.getStyle(this.style));
            if (!!this.overlay) lmap.map.removeOverlay(this.overlay);
            this.overlay = null;
            this.selectRadius = '';
            this.showOverlay = false;
        },
        initDragCircle(lon, lat, radius = 1000) {
            this.removeDragCircle();
            let param = { map: lmap.map, lonlatA: [parseFloat(lon), parseFloat(lat)], radius: parseFloat(radius) };
            this.dcParam = this.dragCircle.init(param, this.dragEndEvt);
        },
        dragEndEvt(circle) {
            let center = lmap.util.transform(circle.center);
            let geom = new ol.geom.Circle(center, circle.radius);
            let polygon = ol.geom.Polygon.fromCircle(geom, 32);
            let wkt = new ol.format.WKT().writeGeometry(polygon.transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION));
            this.showMinBase = true;
            this.globalPopType = 'BaseInfo';
            this.wkts = wkt;
            const t = this.callbackActiveType();
            if (!!this.globalPopDetail.data && (t.normal === this.globalPopDetail.data.poiType)) {
                this.removeSelectPoint('normal', this.globalPopDetail.data.poiType);
            }
        },
        removeDragCircle() {
            if (!!this.dcParam) {
                this.dragCircle.remove(this.dcParam);
                this.dcParam = null;
            }
            this.removeOverlay();
        }
    },
    mounted() {
        lmap.map.on('singleclick', this.clickEvt);
        this.initConstData();
        this.select(this.tabs.poi);
    },
    destroyed() {
        lmap.map.un('singleclick', this.clickEvt);
        lmap.map.removeLayer(this.layer);
        this.clean();
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.global-search {
    position: absolute;
    right: -4px;
    top: @top-normal;
    z-index: @panel-index;
    width: 420px;
    height: auto;
    padding: 2px;
    background-color: #fff;
    box-shadow: @shadow;

    .search-tab {
        text-align: left;
        li {
            display: inline-block;
            width: auto;
            height: auto;
            padding: 0px 25px;
            text-align: center;
            cursor: pointer;
            border-radius: 5px 5px 0 0;
            &.select {
                background-color: @title-color;
                font-weight: 700;
            }
        }
    }

    .search-hd {
        height: 32px;
        background-color: @title-color;
        padding: 2px;
        position: relative;

        &:before {
            content: '';
            display: inline-block;
            height: 30px;
            width: 25px;
            z-index: 1;
            position: absolute;
            left: 8px;
            background: url(data:image/png;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wCEAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHB8fHx8fHx8fHx8BBwcHDQwNGBAQGBoVERUaHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fH//AABEIABAAEAMBEQACEQEDEQH/xABYAAADAQAAAAAAAAAAAAAAAAAAAwUIAQEAAAAAAAAAAAAAAAAAAAAAEAACAwEAAQUAAAAAAAAAAAABAhEDBAASMWGBIgURAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANK48lG6gatQNr2klVJMIJgKoHA/AXrv0ZSxeukoa2YyQrifEn2jgDgvrdjl0GmtyWasoHUE+pWYjgnMdn5Ow2WFtGTQw83j7Bvjg//Z) 0 8px no-repeat;
        }
        .search-bg {
            width: 330px;
            height: 32px;
            background-color: #fff;
            position: absolute;
            left: 2px;
            top: 2px;
        }
        .search-input {
            width: 77.8%;
            height: 32px;
            line-height: 32px;
            text-indent: 20px;
            border: 0;
            float: left;
            color: @font-color;
            position: relative;
            background: 0;
            margin-left: 10px;
            list-style-type: none;
            -webkit-text-size-adjust: none;
            outline: none;
            font-size: 12px;
        }
        .warn-msg {
            display: inline-block;
            padding: 2px 0;
            color: #999;
            position: absolute;
            left: 30px;
            top: 8px;
            height: 16px;
        }
        .search-button {
            height: 34px;
            line-height: 34px;
            border: 0;
            color: @font-color;
            background: 0 0;
            outline: 0;
            cursor: pointer;
            text-align: center;
            padding: 1px 4px;
            &.only-search {
                width: 68px;
            }
        }
    }

    .search-content {
        ul li {
            padding: 5px 0 8px 30px;
            text-align: left;
            border-bottom: 1px solid @title-color;
            position: relative;
            min-height: 22px;
            line-height: 22px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            & span {
                position: absolute;
                display: inline-block;
                width: 20px;
                height: 20px;
                left: 4px;
                top: 5px;
                &::before {
                    content: '';
                    position: absolute;
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 100% 100% 100% 0;
                    background: red;
                    transform: rotate(-45deg);
                }
                &::after {
                    content: '';
                    display: inline-block;
                    width: 2px;
                    height: 5px;
                    position: absolute;
                    left: 9px;
                    bottom: -6px;
                    background: red;
                }
                label {
                    display: inline-block;
                    height: 20px;
                    line-height: 20px;
                    width: 20px;
                    color: #fff;
                    text-align: center;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
            }
        }
    }

    .page-control {
        text-align: left;
        margin-left: 4px;
        height: 24px;
        line-height: 24px;
        li {
            display: inline-block;
            &.pageNext {
                float: right;
                margin-left: 10px;
                cursor: pointer;
                margin-right: 5px;
            }
            &.pagePre {
                float: right;
                cursor: pointer;
            }
        }
    }
}

.back {
    display: block;
    background: #fff;
    color: @eye-color;
    cursor: pointer;
    padding-left: 5px;
    text-align: left;
    &:before {
        content: '\21A9';
        font-size: 18px;
        font-weight: 700;
        margin-right: 5px;
    }
}
.globalPop {
    position: relative;
    margin-top: 8px;
    .poiPop {
        width: 100%;
        padding-right: 2px;
    }
}
.cricle-box-panel {
    background: #fff;
    box-shadow: @shadow;
    .close {
        top: -2px;
        right: -2px;
    }
}

.radius-box {
    height: 22px;
    line-height: 22px;
    padding-right: 17px;
    padding-left: 5px;
    li {
        display: inline-block;
    }
}

.big {
    .global-search {
        top: @top-big;
        width: 570px;
        .search-tab {
            li {
                padding: 0px 20px;
                border-radius: 8px 8px 0 0;
            }
        }
        .search-hd {
            height: 50px;
            line-height: 50px;
            .search-bg {
                width: 460px;
                height: 50px;
            }
            .search-button {
                font-size: @font-big;
                &.only-search {
                }
            }
            .search-input {
                width: 80%;
                height: 50px;
                line-height: 50px;
                font-size: 17px;
            }
            &::before {
                top: 13px;
            }
        }
        .search-content {
            ul {
                li {
                    padding: 8px 0 12px 32px;
                    span {
                        label {
                            height: 26px;
                            line-height: 26px;
                            width: 26px;
                        }
                        &::before {
                            width: 26px;
                            height: 26px;
                        }
                    }
                }
            }
        }
        .page-control {
            height: 30px;
            line-height: 30px;
        }
    }
    .cricle-box-panel {
        height: 36px;
        line-height: 36px;
    }
}
</style>
