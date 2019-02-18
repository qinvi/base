/* eslint-disable */
var util = require('./util');
var style = require('./style');

// 控制地图行为
var ctrl = {

    setCenter(map, lonlat, zoom) {
        lonlat = lonlat.map(function(data) {
            return parseFloat((data + '').trim());
        });
        if (!!zoom) map.getView().setZoom(zoom);
        map.getView().setCenter(util.transform(lonlat));
    },

    // 导出当前地图图片
    exportMap(map, ele) {
        map.once('postcompose', function(event) {
            let canvas = event.context.canvas;
            ele[0].href = canvas.toDataURL('image/png');
        });
        map.renderSync();
    },

    zoomIn(map) {
        this.zoom(map, 1);
    },

    zoomOut(map) {
        this.zoom(map, -1);
    },

    zoom(map, num) {
        let view = map.getView();
        let zoom = view.getZoom();
        view.setZoom(zoom + num);
    },

    panTo(map, lonlat, zoom) {
        let view = map.getView();
        view.animate({
            duration: 1000,
            center: util.transform(lonlat),
            zoom: zoom || 8
        });
    },

    flyTo(map, lonlat, zoom) {
        let duration = 1000;
        let view = map.getView();
        view.animate({
            center: util.transform(lonlat),
            duration: duration,
            zoom: zoom || 8
        }, function() {

        });
        view.animate({
            zoom: zoom - 1,
            duration: duration / 2
        }, {
            zoom: zoom,
            duration: duration / 2
        }, function() {

        });
    },

    addZoomSlider(map) {
        let zoomslider = new ol.control.ZoomSlider();
        map.addControl(zoomslider);
    },

    addScaleLine(map) {
        let scaleLine = new ol.control.ScaleLine();
        map.addControl(scaleLine);
    },

    getLonLat(evt) {
        return util.transform(evt.coordinate, true);
    },

    // 鼠标经纬度显示控件
    mousePosition(map, id) {
        const controler = new ol.control.MousePosition({
            target: document.getElementById(id),
            undefinedHTML: '未知',
            projection: sysconfig.SOURCE_PROJECTION,
            coordinateFormat(coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);  // 经纬度显示的格式 lon, lat
            }
        });
        map.addControl(controler);
    },

    // 地图网格线组件
    addGraticule(map) {
        let stroke = style.getStroke({
            color: 'rgba(192, 190, 190, 1)',
            width: 1
        });
        let graticule = new ol.Graticule({
            targetSize: 150,
            projection: sysconfig.SOURCE_PROJECTION,
            strokeStyle: stroke
        });
        graticule.setMap(map);
        return graticule;
    },

    removeGraticule(grat) {
        grat.setMap(null);
    },

    // 获取鼠标所在的像素
    mousePageXY(e) {
        let mouseCoordInMapPixels = [e.originalEvent.offsetX, e.originalEvent.offsetY];
        return mouseCoordInMapPixels;
    }
};

module.exports = ctrl;
