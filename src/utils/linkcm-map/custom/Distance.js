/* eslint-disable */
var draw = require('../utils/draw');
var util = require('../utils/util');
var Distance = {

    /**
     * 初始化测距功能
     * @param {object} param 初始化参数
     */
    init(param) {
        // 地图
        this.map = param.map;
        this.initConstData();
        this.initLayer();
        this.initHandle();
    },

    /**
     * 初始化默认参数
     */
    initConstData() {
        // 图层
        this.layer = null;
        // 画笔
        this.handle = null;
        // 保存提示框
        this.overlays = [];
        // 经纬度存放数组
        this.lonlats = [];
        // 长度
        this.lengths = [];
    },

    /**
     * 初始化图层
     */
    initLayer() {
        let source = new ol.source.Vector();
        this.layer = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#fd8044',
                    width: 3
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });
        this.layer.setZIndex(4);
        this.map.addLayer(this.layer);
    },

    /**
     * 初始化画笔
     */
    initHandle() {
        let source = this.layer.getSource();
        let handle = new ol.interaction.Draw({
            source: source,
            type: 'LineString',
            finishCondition: ol.events.condition.DoubleClick,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    })
                })
            })
        });
        this.handle = handle;
        this.map.addInteraction(handle);

        handle.on('drawstart', (e) => {
            this.lonlats = [];
            this.endStatus = false;
        });

        handle.on('drawend', (e) => {
            this.endStatus = true;
            this.overlays.forEach(function(o) {
                o.getElement().classList.remove('tooltip-measure');
                o.getElement().classList.add('tooltip-static');
            }, this);

            if (this.lengths.length > 1) {
                let length = 0;
                this.lengths.forEach(function(len) {
                    if (len.indexOf('km')) {
                        length += Number.parseFloat(len.replace(' km', '')) * 1000;
                    } else if (len.indexOf('m')) {
                        length += Number.parseFloat(len.replace(' m', ''));
                    }
                });

                length = '总长度：' + (length / 1000).toFixed(2) + ' km';
                this.createLengthTip(length, e.feature.getGeometry().getLastCoordinate(), 'tooltip-bottom', 'sum');
            }
            this.lengths = [];

        });

        this.listener = this.map.on('click', this.clickEvt.bind(this));
        this.initTipBox({ map: this.map, text: '双击结束标绘' });
    },

    /**
     * 点击生成距离提示框
     * @param {ol.Object.Event} 点击回调函数返回值
     */
    clickEvt(e) {
        if (!this.endStatus) {
            this.lonlats.push(e.coordinate);
            let index = this.lonlats.length - 1;
            if (this.lonlats.length > 1) {
                const point1 = this.lonlats[index - 1];
                const point2 = this.lonlats[index];
                const length = this.haversineDistance(point1, point2);
                if (length.indexOf('m') !== -1) {
                    this.lengths.push(length);
                    this.createLengthTip(length, point2, 'tooltip-measure');
                } else {
                    this.lonlats.splice(0, this.lonlats.length - 1);
                }
            }
        }
    },

    /**
     * 生成长度提示框
     * @param {string} length 长度
     * @param {array} point2 点2
     * @param {string} cls 样式名称
     * @param {string} position 定位
     */
    createLengthTip(length, point2, cls, position) {
        const overlay = this.initTip(length, point2, cls, position);
        this.overlays.push(overlay);
        this.map.addOverlay(overlay);
    },

    /**
     * 生成提示框
     * @param {string} text 提示内容
     * @param {array} lonlat 经纬度
     * @param {string} cls 样式
     * @param {string} position 定位
     */
    initTip(text, lonlat, cls = 'tooltip-measure', position) {
        let ele = document.createElement('div');
        ele.className = 'tooltip ' + cls;
        ele.innerHTML = text;
        let option = {
            projection: sysconfig.SYSTEM_PROJECTION,
            offset: !position ? [0, -15] : [0, 35],
            positioning: 'bottom-center',
            element: ele,
            lonlat: lonlat,
            transform: false,
            stopEvent: false
        }
        return draw.getOverlay(option);
    },

    /**
     * 生成长度提示框
     * @param {object} param 覆盖框类型
     */
    initTipBox(param) {
        let map = param.map;
        let pointerMoveEvt = function(evt) {
            if (evt.dragging) return;
            const text = param.text;
            tipBox.ele.classList.remove('hidden');
            tipBox.ele.innerHTML = text;
            try {
                tipBox.overlay.setPosition(evt.coordinate);
            } catch (e) {
                param.map.un('pointermove', pointerMoveEvt);
            }
        };
        if (this.tipBox) {
            map.removeOverlay(this.tipBox.overlay);
            map.un('pointermove', pointerMoveEvt);
            this.tipBox = {};
        }
        let ele = document.createElement('div');
        ele.className = 'tooltip hidden';
        let tip = new ol.Overlay({
            element: ele,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(tip);
        let tipBox = {
            ele: ele,
            overlay: tip,
            pointerMoveEvt: pointerMoveEvt
        };
        this.tipBox = tipBox;
        map.on('pointermove', pointerMoveEvt);
    },

    /**
     * 计算两个经纬度距离
     * @param {array} point1 点1
     * @param {array} point2 点2
     * @return {string} 长度
     */
    haversineDistance(point1, point2) {
        point1 = util.transform(point1, true);
        point2 = util.transform(point2, true);
        const wgs84Sphere = new ol.Sphere(6378137);
        // point1 = [113.1556, 24.8822]
        // point2 = [113.1367, 24.7242]
        let distance = wgs84Sphere.haversineDistance(point1, point2) + '';
        distance = distance.split('.')[0];
        distance = (distance.length > 3) ? ((Number(distance) / 1000) + ' km') : (distance + ' m');
        return distance;
    },

    /**
     * 格式化距离长度单位
     * @param {number} length 长度
     * @return {string} 长度+单位
     */
    formatLength(length) {
        length = Number(length);
        if (Number.isNaN(length)) {
            return '0 m';
        } else {
            length = (length > 100) ? (length / 1000).toFixed(2) + ' km' : (length).toFixed(2) + ' m';
            return length;
        }
    },

    /**
     * 取消画笔
     */
    remove() {
        this.map.removeLayer(this.layer);
        this.map.removeInteraction(this.handle);
        this.map.un('singleclick', this.clickEvt);
        ol.Observable.unByKey(this.listener);
        for (let o of this.overlays) {
            this.map.removeOverlay(o);
        }
        this.initConstData();
        if (!!this.tipBox.overlay) {
            this.map.removeOverlay(this.tipBox.overlay);
            this.map.un('pointermove', this.tipBox.pointerMoveEvt);
            this.tipBox = {};
        }
    }

};

module.exports = Distance;
