/* eslint-disable */
var draw = require('../utils/draw');
var util = require('../utils/util');
var layerUtil = require('../utils/layer');
var style = require('../utils/style');

var DragCircle = {

    _param: {
        radius: 1000,
        pointA: undefined,
        pointB: undefined,
        handle: undefined,
        layer: undefined,
        lonlatA: undefined,
        lonlatB: undefined,
        polyline: undefined,
        circle: undefined,
        map: undefined,
        status: false,
        overlay: undefined,
        ele: undefined,
        downStatus: false
    },

    addIcon(param) {
        let point = new ol.geom.Point(param.lonlat);
        let feature = new ol.Feature({ 'geometry': point });
        feature.setStyle(style.getStyle(param.style));
        feature.set('code', 'point' + param.code);
        this._param['point' + param.code] = feature;
        this._param.layer.getSource().addFeature(feature);
    },

    initHandle(drawEnd) {
        let _that = this;

        this._param.handle = new ol.interaction.Pointer({
            handleDownEvent: handleDownEvent,
            handleDragEvent: handleDragEvent,
            handleMoveEvent: handleMoveEvent,
            handleUpEvent: handleUpEvent
        });

        function handleDownEvent(evt) {
            let feature = evt.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
                return feature;
            });
            let status = (!!feature && feature.get('code') === 'pointB');
            if (status) _that._param.downStatus = true;
            return status;
        }

        function handleDragEvent(evt) {
            let param = _that._param;
            let feature = param.pointB;
            if (!!feature && param.downStatus) {
                if (!!param.polyline && !!param.circle) {
                    let elon = evt.coordinate[0];
                    let lonlatB = param.lonlatB;
                    let deltaX = elon - lonlatB[0];
                    feature.getGeometry().translate(deltaX, 0);
                    param.lonlatB[0] = elon;

                    let lonlatA = param.lonlatA;
                    let radius = Math.abs(lonlatB[0] - lonlatA[0]);
                    let coordinates = [lonlatA, lonlatB];
                    param.polyline.setCoordinates(coordinates);
                    param.circle.setRadius(radius);
                    param.ele.innerHTML = _that.formatLength(radius);
                } else {
                    return;
                }
            } else {
                return;
            }
        }

        function handleMoveEvent(evt) {
        }

        function handleUpEvent(evt) {
            return drawEnd(_that.getCircle());
        }

        this._param.map.addInteraction(this._param.handle);
    },

    getCircle() {
        return { center: util.transform(this._param.lonlatA, true), radius: this._param.circle.getRadius() };
    },

    formatLength(radius) {
        return draw.formatLength(radius);
    },

    initRadiusTip() {
        let ele = document.createElement('div');
        ele.className = 'tooltip';
        let overlay = new ol.Overlay({
            element: ele,
            offset: [15, 15],
            positioning: 'bottom-left'
        });
        ele.innerHTML = this.formatLength(this._param.radius);
        overlay.setPosition(this._param.lonlatB);
        this._param.map.addOverlay(overlay);
        return {ele: ele, overlay: overlay};
    },

    initDragCircle() {
        let param = this._param;
        let coordinates = [param.lonlatA, param.lonlatB];
        this._param.polyline = new ol.geom.LineString(coordinates);
        this._param.circle = new ol.geom.Circle(param.lonlatA, param.radius);
        this._param.layer.getSource().addFeatures([ new ol.Feature({ 'geometry': this._param.polyline }), new ol.Feature({ 'geometry': this._param.circle }) ]);
    },

    init(param, drawEnd) {
        param.radius = parseFloat(param.radius);
        param.lonlatA = util.transformMeter(param.lonlatA);
        param.lonlatB = [param.lonlatA[0] + param.radius, param.lonlatA[1]];
        this._param = Object.assign({}, param);
        param = null;
        let layer = layerUtil.init(this._param.map, 'draw');
        let circleStyle = new ol.style.Style({
            fill: new ol.style.Fill({color: 'rgba(224, 76, 56, 0.2)'}),
            stroke: new ol.style.Stroke({
                color: '#1A1A1A',
                width: 1
            })
        });
        layer.setStyle(circleStyle);
        this._param.layer = layer;

        let pointB = {
            lonlat: this._param.lonlatB,
            style: {
                isIcon: true,
                icon: {
                    src: 'http://10.148.16.53/topic/little/dragCircle/02.png',
                    anchor: [0.5, 0.5],
                    size: [12, 12],
                    scale: 1
                }
            },
            code: 'B'
        };
        this.addIcon(pointB);

        this.initDragCircle();
        this.initHandle(drawEnd);
        let {ele, overlay} = this.initRadiusTip();
        this._param.ele = ele;
        this._param.overlay = overlay;

        drawEnd({ center: util.transform(this._param.lonlatA, true), radius: this._param.circle.getRadius() });
        return { handle: this._param.handle, layer: this._param.layer, map: this._param.map, overlay: this._param.overlay };
    },

    remove(param) {
        this._param = {
            radius: 1000,
            pointB: undefined,
            handle: undefined,
            layer: undefined,
            lonlatA: undefined,
            lonlatB: undefined,
            polyline: undefined,
            circle: undefined,
            map: undefined,
            status: false,
            downStatus: undefined,
            overlay: undefined,
            ele: undefined
        }
        param.map.removeOverlay(param.overlay);
        param.map.removeInteraction(param.handle);
        param.map.removeLayer(param.layer);
    }

};

module.exports = DragCircle;
