<!--应急指挥工具-->
<template>
    <div class="econtrol" ref="econtrol">
        <ul class="clearfix tools">
            <li v-for="(name, key) in list" @click="select(key)" :key="key" :class="['tool', 'icon-econtrol-' + key, { selected: key === last } ]" :title="name"></li>
            <li class="tool icon-econtrol-undo" title="撤销" @click="undo()"></li>
            <li class="tool icon-econtrol-delete" title="删除" @click="clear()"></li>
            <li class="tool icon-econtrol-save" title="保存" @click="status.save = !status.save"></li>
            <li class="tool icon-econtrol-close" title="关闭" @click="close()"></li>
            <li class="tool drag" ref="econtrol-drag"></li>
        </ul>
        <div class="color-panel" v-if="status.color">
            <div class="color-size">
                <ul class="clearfix">
                    <li @click="selected.size = key" :class="key" v-for="key in sizes" :key="key">
                        <div :class="{ 'size-c': key === selected.size }"></div>
                    </li>
                </ul>
            </div>
            <div class="color-choose">
                <div class="background-color" :style="{ backgroundColor: selected.color }"></div>
                <div class="choose-list">
                    <ul class="clearfix">
                        <li v-for="(color, index) in colors" :key="index" :style="{ backgroundColor: color }" @click="selected.color = color"></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="save-panel" v-if="status.save">
            <input class="font-text" type="text" v-model="content" :placeholder="saveInfo">
            <button @click="save()" class="btn hover">保存</button>
        </div>
        <div class="auto-panel" v-if="last === 'auto'">
            <v-dropdown :list="auto.list" :tip="auto.tip" class="dropdown-econtrol" @select="getAutoData"></v-dropdown>
        </div>
        <!--灾害导航详情窗口-->
        <div class="auto-detail" v-if="auto.status">
            <div class="title-nomove auto-detail-title">
                路线始点：{{ auto.address }}
                <a class="close" @click="auto.status = false"></a>
            </div>
            <div class="road-info">
                <ul class="clearfix">
                    <li v-for="(item, index) in auto.data.resp" :key="index">
                        <div>路线{{ indexMap[index] }}</div>
                        <div class="endRoad"><span>{{ item.poiName }}</span></div>
                        <ul class="clearfix">
                            <li><i class="icon-car"></i>{{ item.costTime }}</li>
                            <li>{{ item.length }}公里</li>
                            <li :class="item.roadName">途径：{{ item.roadName }}</li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import WinDrag from '../../utils/tools/WinDrag.js';
import Dropdown from '../Plugins/Dropdown';

export default {
    components: {
        'v-dropdown': Dropdown
    },
    data() {
        return {
            last: '',
            list: {
                point: '标注',
                polyline: '动态线',
                text: '文字',
                arrow: '箭头',
                circle: '画圆',
                box: '画矩形',
                polygon: '画任意面',
                line: '画任意线',
                auto: '自动导航'
            },

            indexMap: { 0: 'A', 1: 'B', 2: 'C', C: 2, B: 1, A: 0 },

            sizes: ['o-size', 't-size', 'td-size'],
            colors: ['#000000', '#6F706B', '#6F180E', '#F28837', '#266D28', '#0E37B8', '#6D0B62', '#13807F', '#FFFFFF', '#B3B5AE', '#ED3F2B', '#EBDE37', '#96C130', '#0A78C8', '#D523C8', '#1AC1CA'],

            selected: { size: 'o-size', color: '#ED3F2B' },
            status: { save: false, color: false },

            content: '',

            auto: {
                address: '',
                list: [{ text: '导航至：避难点', value: 'SJZX_KEYPLACE_REFUGES' }, { text: '导航至：医院', value: 'MEDICAL_HOSPITAL' }, { text: '导航至：学校', value: 'EDUCATION_SCHOOL' }],
                data: null,
                status: false,
                tip: '导航至：避难点'
            },

            saveInfo: '请输入预案名'
        };
    },

    computed: {
        ...mapState({
            code: state => state.sys.code,
            mapType: state => state.mapType,
            planId: state => state.toolsBar.planId
        })
    },

    watch: {
        planId(id) {
            this.restore(id);
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        initConstData() {
            this.autoEnd = true
            const drawParam = lmap.layer.initDrawParam(lmap.map, 'draw');

            this.drawParam = drawParam;

            this.layer = drawParam.layer;

            this.modify = lmap.draw.initModify(drawParam);

            this.autoParam = {
                // 避灾导航图层
                layer: lmap.layer.init(lmap.map, 'impact'),

                // 导航灾害定点位置
                lonlat: [],

                poi: 'SJZX_KEYPLACE_REFUGES'
            };

            // 导航动态线状态
            this.autoTimeout = false;

            // 导航动态线定时器记录
            this.timeoutArr = [];

            // 文本弹出窗口
            this.popup = { feature: null, overlay: null };

            // 动态线打点
            this.lineMap = {};

            // 操作历史
            this.historys = [];

            this.timestamps = {
                navigation: null
            }
        },

        select(type) {
            this.last = this.last !== type ? type : null;
            this.initHandle(this.last);
        },

        /**
         * 初始化画笔
         * @param {string} type 画笔类型
         */
        initHandle(type) {
            lmap.draw.cancel(lmap.map, this.drawHandle);
            this.removePopup();
            if (type) {
                const event = { end: e => this.end(e.feature, type) };
                let featureInfo = {};
                if (type === 'auto') {
                    const style = {
                        isIcon: true,
                        icon: {
                            src: sysconfig.TESTIP + '/topic/little/necImage/demage.png',
                            anchor: [0.5, 1],
                            size: [25, 41]
                        }
                    };
                    this.status.color = false;
                    featureInfo = { data: { auto: 'auto' } };
                    this.drawHandle = lmap.draw.initHandle(this.drawParam, 'point', event, featureInfo, style);
                } else {
                    this.status.color = true;
                    if (type === 'text') {
                        featureInfo = { data: { tempText: true } };
                    }
                    this.drawHandle = lmap.draw.initHandle(this.drawParam, type, event, featureInfo, {});
                }
            }
        },

        /**
         * 撤消上一次画图
         */
        undo() {
            const features = this.layer.getSource().getFeatures();
            const index = features.length - 1;
            const feature = features[index];
            if (index >= 0 && feature.get('type') === 'polyline') {
                const id = feature.get('id');
                const linePoints = this.lineMap[id];
                for (const point of linePoints) {
                    this.layer.getSource().removeFeature(point);
                }
                delete this.lineMap[id];
            }
            if (feature.get('auto') === 'auto') {
                this.auto.status = false;
                if (!!this.autoParam.layer) {
                    lmap.icon.clear(this.autoParam.layer); // 清理导航图层图层
                }
            }
            if (feature.get('type') === 'text') {
                this.removePopup();
            }
            lmap.draw.undo(this.layer);
            this.historys = this.historys.splice(0, this.historys.length - 1);
        },

        // 画笔结束回调函数
        end(feature, type) {
            this.historys.push(type);
            if (type === 'auto') {
                if (!this.autoEnd) {
                    this.updateParam([ 'sysTip', { status: true, text: '请耐心等待上次结果', type: 'warn' } ]);
                    return
                }
                this.autoEnd = false
                lmap.icon.clearType(this.layer, 'auto');
                const wkt = lmap.draw.getWKT(feature);
                const lonlat = wkt.replace('POINT(', '').replace(')', '').split(' ');
                this.autoParam.lonlat = lonlat;
                this.getAutoData();
            } else if (type === 'text') {
                this.removePopup();
                this.popup.overlay = this.initPopup(feature);
                this.popup.feature = feature;
            }

            const id = 'line-' + new Date().getTime();

            const style = this.getCustomizeStyle(type);
            feature.setStyle(lmap.style.getStyle(style));
            if (feature.get('type') === 'polyline') {
                const wkt = lmap.draw.getWKT(feature);
                const points = wkt.replace('LINESTRING(', '').replace(')', '').split(',');
                const features = [];
                for (const point of points) {
                    const feature = lmap.icon.add(this.layer, { circle: { radius: 4, fill: { color: lmap.draw.hexToRgba(this.selected.color, 0.5) } } }, point.split(' '));
                    features.push(feature);
                }
                this.lineMap[id] = features;
            }

            feature.set('id', id);
            feature.set('style', style);
            feature.set('type', type);
        },

        getCustomizeStyle(type) {
            let style;
            const size = { 'o-size': 1, 't-size': 3, 'td-size': 5 };
            if (type === 'point' || type === 'text') {
                const scale = { 'o-size': 0.5, 't-size': 0.8, 'td-size': 1 };
                style = {
                    isIcon: true,
                    icon: {
                        anchor: [0.5, 1],
                        size: [46, 70],
                        src: `${sysconfig.TESTIP}/topic/little/econtrol/${this.selected.color.replace('#', '')}.png`,
                        scale: scale[this.selected.size]
                    }
                };
            } else if (type === 'line' || type === 'polyline') {
                style = {
                    stroke: {
                        color: this.selected.color,
                        width: size[this.selected.size]
                    }
                };
            } else if (type === 'auto') {
                style = {
                    isIcon: true,
                    icon: {
                        anchor: [0.5, 1],
                        size: [25, 41],
                        src: sysconfig.TESTIP + '/topic/little/necImage/demage.png'
                    }
                };
            } else {
                style = {
                    fill: { color: this.selected.color, opacity: 0.2 },
                    stroke: { color: '#27303F', width: size[this.selected.size] }
                };
            }
            return style;
        },

        initPopup(feature) {
            const $measure = document.createElement('div');
            $measure.style = 'padding: 3px; background-color: #fff; box-shadow: 0 2px 4px 0 rgba(0, 0, 0,.3); border-radius: 4px';

            const $input = document.createElement('input');
            $input.setAttribute('placeholder', '请输入文字');
            $input.style = 'margin-right: 4px;';

            const $btn = document.createElement('a');
            $btn.className = 'btn';
            $btn.innerHTML = '完成';

            $measure.appendChild($input);
            $measure.appendChild($btn);

            const popup = lmap.draw.getOverlay({
                element: $measure,
                offset: [10, 30],
                positioning: 'bottom-center'
            });

            const coord = feature.getGeometry().getCoordinates();
            popup.setPosition(coord);

            lmap.map.addOverlay(popup);

            $btn.onclick = () => {
                setTextStyle();
            };

            $input.onkeydown = () => {
                const event = window.event; // 消除浏览器差异
                if (event.keyCode === 13) setTextStyle();
            };

            // 输入框提交事件
            const that = this;
            function setTextStyle() {
                const text = $input.value;
                const size = { 'o-size': '30px', 't-size': '40px', 'td-size': '50px' };
                const style = {
                    text: {
                        text: text,
                        size: size[that.selected.size],
                        fill: { color: that.selected.color, width: 6 }
                    }
                };
                that.popup.feature.set('style', style);
                that.popup.feature.set('tempText', false);
                that.popup.feature.setStyle(lmap.style.getStyle(style));
                that.removePopup();
            }

            return popup;
        },

        removePopup() {
            if (!!this.popup.overlay) {
                lmap.icon.clearType(this.layer, 'tempText');
                lmap.map.removeOverlay(this.popup.overlay);
                this.historys = this.historys.splice(0, this.historys.length - 1);
                this.popup.overlay = null;
            }
        },

        /**
         * 获取灾害导航结果事件
         * @param {Object} param select选中的对象
         */
        getAutoData(param) {
            if (this.autoParam.layer) {
                lmap.draw.clear(this.autoParam.layer); // 清理导航图层图层
            }
            utils.clearTimer(this.timer);

            const timestamp = Date.now()
            this.timestamps.navigation = timestamp
            this.timer = window.setTimeout(() => {
                if (!!param) this.autoParam.poi = param.value;
                const [ lon, lat ] = this.autoParam.lonlat;
                if (!!lon && !!lat) {
                    const url = sysconfig.TESTPATH + '/atwill/analysisPath';
                    const param = { code: this.code, poiType: this.autoParam.poi, lonlat: `${lon} ${lat}` };
                    utils.get(url, param).then(bd => {
                        if (timestamp !== this.timestamps.navigation) return
                        this.auto.data = bd.data;
                        this.drawAutoPath(); // 绘制导航路线
                    });
                    this.getAddress(lon, lat);
                }
            }, 500);
        },

        /**
         * 地图选点回调事件
         * @param {object} feature 要素对象
         */
        getAddress(lon, lat) {
            const url = `${sysconfig.TESTPATH}/atwill/getRoadName`;
            const param = { code: this.code, lonlat: `${lon} ${lat}` }
            utils.GET(url, param).then((json) => {
                if (json.status === 0) {
                    this.auto.address = json.data.fullAddress;
                } else {
                    this.auto.address = '暂无匹配地点';
                }
            });
        },

        /**
         * 避灾导航
         */
        drawAutoPath: function() {
            this.auto.status = true;
            const paths = this.auto.data.resp;
            for (let index in paths) {
                const type = this.indexMap[index];
                this.renderLine(paths[index].linestring, 0, type);
            }
            this.autoEnd = true
        },

        /**
         * 渲染导航路径
         * @param {array} data 路线数据
         * @param {number} index 数组索引
         * @type {string} A/B/C 类型
         */
        renderLine: function(data, index, type) {
            this.lineString(this.autoParam.layer, data[index], type);
            index++;
            if (index < data.length) {
                this.renderLine(data, index, type);
            } else {
                this.setPoiIcon(type); // 画到最后加个类型点
            }
        },

        /**
         * 画线
         * @param {object} layer 图层对象
         * @param {string} wkt 路径信息
         * @param {string} type 类型
         */
        lineString(layer, wkt, type) {
            const format = new ol.format.WKT();
            const feature = format.readFeature(wkt);
            feature.getGeometry().transform(sysconfig.SOURCE_PROJECTION, sysconfig.SYSTEM_PROJECTION);
            const style = { A: '#828DDD', B: '#FF6733', C: '#2B32D6' };
            if (!!style) {
                const storck = lmap.style.getStyle({ stroke: { color: '#fff', width: 8 } });
                const fill = lmap.style.getStyle({ stroke: { color: style[type], width: 4 } });
                feature.setStyle([storck, fill]);
            }
            layer.getSource().addFeature(feature);
        },

        /**
         * 添加避难点图标
         * @param type 路线类别
         */
        setPoiIcon(type) {
            const index = this.indexMap[type];
            const style = {
                isIcon: true,
                icon: {
                    src: sysconfig.TESTIP + '/topic/little/toolbar/' + type + '.png',
                    size: [20, 20]
                }
            };
            const point = this.auto.data.resp[index].lonlat.split(' ');
            lmap.icon.add(this.autoParam.layer, style, point);
        },

        /**
         * 还原预案
         */
        restore(planId) {
            const url = sysconfig.TESTPATH + '/atwill/getEmergencyPlanInfo';
            utils.GET(url, { planId }).then((json) => {
                const data = JSON.parse(json.data.layerEle);
                const features = [];
                let auto = { status: false };
                data.forEach(function(ele) {
                    if (ele.type === 'map') {
                        lmap.map.getView().setCenter(ele.center);
                        lmap.map.getView().setZoom(ele.zoom);
                        this.updateParam([ { mapType: ele.mapType } ]);
                    } else if (ele.type === 'autoData') {
                        auto = { status: true, lonlat: ele.lonlat, poi: ele.poi };
                    } else {
                        const feature = lmap.polygon.addWKT(ele.wkt)[0];
                        let styles = [ lmap.style.getStyle(ele.style) ];
                        feature.setStyle(styles);
                        feature.set('type', ele.type);
                        feature.set('style', ele.style);
                        if (ele.type === 'auto') {
                            feature.set('auto', 'auto');
                        }
                        features.push(feature);
                    }
                }, this);
                if (auto.status) {
                    this.select('auto');
                    this.autoParam.poi = auto.poi;
                    this.autoParam.lonlat = auto.lonlat;
                    const mapping = { SJZX_KEYPLACE_REFUGES: '导航至：避难点', MEDICAL_HOSPITAL: '导航至：医院', EDUCATION_SCHOOL: '导航至：学校' };
                    this.auto.tip = mapping[auto.poi];
                    this.getAutoData();
                }
                lmap.draw.clear(this.layer);
                this.layer.getSource().addFeatures(features);
            });
        },

        /**
         * 保存预案
         */
        save() {

            if (this.content.trim() !== '') {
                const str = this.getSaveParam();
                const url = sysconfig.TESTPATH + '/atwill/saveEmergencyPlan';
                const param = { code: this.code, planName: this.content, layerEle: str, commandId: -1 };
                utils.post(url, param).then(bd => {
                    utils.clearTimer(this.saveTimer);
                    this.content = '';
                    if (bd.data.id === -1) {
                        this.saveInfo = '预案名重复，请重新输入！';
                        this.saveTimer = window.setTimeout(() => {
                            this.saveInfo = '请输入预案名';
                        }, 1500);
                    } else {
                        this.saveInfo = '保存成功！';
                        this.saveTimer = window.setTimeout(() => {
                            this.status.save = false;
                        }, 1500);
                    }
                });
            } else {
                this.saveInfo = '预案名为空，请重新输入！';
                this.saveTimer = window.setTimeout(() => {
                    this.saveInfo = '请输入预案名';
                }, 1500);
            }

        },

        /**
         * 获取预案图层矢量数据
         */
        getSaveParam() {
            const features = this.layer.getSource().getFeatures();
            const objArr = [];
            for (const feature of features) {
                const wkt = lmap.draw.getWKT(feature);
                const obj = { type: feature.get('type'), style: feature.get('style'), wkt };
                objArr.push(obj);
            }
            if (!!this.auto.data) {
                const obj = { type: 'autoData', lonlat: this.autoParam.lonlat, poi: this.autoParam.poi };
                objArr.push(obj);
            }
            const mapObj = { type: 'map', zoom: lmap.util.getZoom(lmap.view), center: lmap.util.getCenter(lmap.view), mapType: this.mapType };
            objArr.push(mapObj);
            return JSON.stringify(objArr);
        },

        /**
         * 外部触发关闭
         */
        close() {
            this.updateParam(['toolsBar', { econtrol: false }]);
        },

        clear() {
            lmap.icon.clear(this.layer);
            lmap.icon.clear(this.autoParam.layer);
            this.removePopup();
            this.auto.status = false;
        }
    },

    mounted: function() {
        WinDrag.init(this.$refs['econtrol-drag'], this.$refs['econtrol'], lmap.map);
        this.initConstData();
        if (!!this.planId) {
            this.restore(this.planId);
        }
    },

    destroyed: function() {
        this.removePopup();
        this.updateParam([ 'toolsBar', { planId: null } ]);
        lmap.draw.cancel(lmap.map, this.modify);
        lmap.draw.cancel(lmap.map, this.drawHandle);
        lmap.map.removeLayer(this.layer);
        lmap.map.removeLayer(this.autoParam.layer);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
@images: '../../assets/img';
.econtrol {
    position: fixed;
    top: @top-normal;
    right: -4px;
    width: 414px;
    z-index: @panel-index;
}

.tools {
    // padding: 2px 2px;
    width: auto;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    background-color: #fff;

    .tool {
        width: 26px;
        .height(26px);
        margin: 2px 2px;
        float: left;
        background: linear-gradient(#fff, #eee);

        &:nth-child(1) {
            margin-left: 2px;
        }

        &:nth-last-child(1) {
            margin-right: 2px;
            background: none;
        }

        &::before {
            font-size: 26px;
            border: 1px solid rgb(199, 199, 199);
        }

    }

    .selected::before {
        color: @select-font-color;
        border-color: @select-font-color;
    }

    .drag {
        cursor: move;
        width: 16px;
        height: 16px;
        &::before {
            content: '';
            display: inline-block;
            border: none;
            width: 100%;
            height: 26px;
            line-height: 26px;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-image: url('@{images}/common/drag.png');
            background-position: right top;
            background-size: auto;
        }
    }
}

.color-panel {
    width: 270px;
    height: 34px;
    background-color: #fff;
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}

.color-size {
    width: 102px;
    height: 34px;
    float: left;

    ul li {
        width: 34px;
        height: 34px;
        line-height: 34px;
        float: left;

        div {
            width: 34px;
            height: 34px;
        }
    }
}

.color-choose {
    width: auto;
    height: 30px;
    float: left;

    .background-color {
        width: 32px;
        height: 32px;
        float: left;
    }
}

.choose-list {
    width: 136px;
    height: 34px;
    float: left;

    ul li {
        width: 15px;
        height: 15px;
        float: left;
        margin: 1px 1px;
    }
}

.save-panel {
    width: 218px;
    height: 34px;
    background-color: #fff;
    position: absolute;
    right: 0px;
    top: 30px;
    box-shadow: @shadow;
    z-index: @pop-index + 1;

    input.font-text {
        width: 154px;
        margin-top: 4px;
    }
}

.auto-panel {
    position: absolute;
    right: 60px;
    background: #fff;
    z-index: @pop-index;
}

.auto-detail {
    position: absolute;
    right: 0px;
    width: 100%;
    background-color: #fff;
    margin-top: 5px;
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);

    .auto-detail-title {
        border-bottom: 1px solid @title-color;
    }

    .road-info {
        margin: 0 5px;
        text-align: left;

        ul {
            width: 100%;

            li {
                list-style: none;
                margin: 6px 0;
                height: auto;
                overflow: hidden;
                border-bottom: 1px solid @title-color;

                div {
                    float: left;
                    height: 24px;
                    line-height: 24px;
                    margin-right: 10px;
                }
                div:first-child::before {
                    height: 4px;
                    width: 30px;
                    margin: 10px;
                    float: right;
                    content: '';
                }
                div.endRoad {
                    width: 300px;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    margin-right: 0;
                }
                ul {
                    width: 100%;
                    margin-right: 0;

                    li {
                        float: left;
                        text-align: left;
                        border-bottom: 0;
                        color: @select-font-color;
                        line-height: 20px;

                        i {
                            display: inline-block;
                            width: 15px;
                            height: 14px;
                            vertical-align: middle;
                            /*color: #ccc;*/
                            margin-right: 10px;
                            margin-top: -2px;
                            /*font-size: 14px;*/
                            background: url('../../assets/img/common/car.png') no-repeat;
                        }

                        &:nth-child(3) {
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            width: 230px;
                        }

                    }
                    li:before {
                        content: '';
                        width: 1px;
                        height: 14px;
                        background: #ccc;
                        margin: 3px 10px;
                        float: left;
                    }
                    li:first-child::before {
                        width: 0;
                        margin: 3px 5px;
                    }
                }
            }
            li:last-child {
                border-bottom: 0;
            }
            li:first-child div:first-child::before {
                background: #828ddd;
            }
            li:nth-child(2) div:first-child::before {
                background: #ff6733;
            }
            li:nth-child(3) div:first-child::before {
                background: #2b32d6;
            }
        }
    }
}

.o-size {
    background: url('@{images}/econtrol/o-size.png') no-repeat center center;
}

.t-size {
    background: url('@{images}/econtrol/t-size.png') no-repeat center center;
}

.td-size {
    background: url('@{images}/econtrol/td-size.png') no-repeat center center;
}

.size-c {
    background: url('@{images}/econtrol/size-c.png') no-repeat center center;
}

/* big */
.big {
    .econtrol {
        top: 45px;
        right: 0;
        width: 462px;

        .tools {
            width: auto;

            .tool {
                width: 30px;
                .height-big(30px);
                margin: 2px 2px;

                &::before {
                    .height-big(30px);
                    font-size: 30px;
                }

                &:last-child {
                    width: 16px;
                }
                div {
                    width: 30px;
                    height: 30px;
                }
            }
        }

        .auto-detail.road-info ul li {
            margin: 8px 0px;
        }

        .auto-detail.road-info ul li div.endRoad {
            width: 368px;
        }

        .auto-detail.road-info ul li ul li:before {
            margin: 6px 10px;
        }

        .auto-detail.road-info ul li ul li img {
            margin-top: -4px;
        }

        .color-panel {
            width: 305px;
            height: 42px;

            .color-size {
                margin-top: 7px;
            }

            .color-choose {
                .background-color {
                    width: 40px;
                    height: 40px;
                }
            }

            .choose-list {
                width: 162px;
                li {
                    width: 18px;
                    height: 18px;
                }
            }
        }

        .save-panel {
            width: 280px;
            height: 42px;
            top: 34px;

            input.font-text {
                width: 220px;
                font-size: 18px;
            }
        }
    }
    .econtrol.tools ul li:last-child {
        width: 16px;
    }

    .econtrol.tools ul li div.drag {
        width: 16px;
        height: 16px;
        background-size: auto !important;
    }
}
</style>
