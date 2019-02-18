/* eslint-disable */
var util = require('./utils/util');
var image = require('./utils/image');
var layer = require('./utils/layer');
var style = require('./utils/style');
var draw = require('./utils/draw');
var icon = require('./utils/icon');
var polygon = require('./utils/polygon');
var ctrl = require('./utils/ctrl');
var custom = require('./custom/custom');

var lmap = {

    config: {
        prov_center: [113.2637, 23.1314],
        center: [113.2637, 23.1314],
        zoom: 8,
        minZoom: 5,
        maxZoom: 16,
        url: sysconfig.IP
        // url: 'http://10.148.10.208'
        // url: 'http://120.26.220.66:8090/web_static/{t}/{z}/{x}/{y}.png'
        // url: 'http://mt3.google.cn/vt/lyrs=m&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&apistyle=s.t%3A3%7Cp.v%3Aoff'
    },

    initMap(id) {
        try {
            let map = new ol.Map({
                target: id,
                interactions: ol.interaction.defaults({ mouseWheelZoom: false }).extend([
                    new ol.interaction.MouseWheelZoom({
                        constrainResolution: true // force zooming to a integer zoom
                    })
                ]),
                view: new ol.View({
                    projection: sysconfig.SYSTEM_PROJECTION,
                    zoom: this.config.zoom,
                    minZoom: this.config.minZoom,
                    maxZoom: this.config.maxZoom
                })
            });
            map.setLayerGroup(new ol.layer.Group({ layers: [this.initWMTS()] }));
            let view = map.getView();
            view.setCenter(util.transform(this.config.center));
            this.map = map;
            this.view = view;
            return true;
        } catch (e) {
            return false;
        }
    },

    initWMTS() {
        let extent = ol.proj.get(sysconfig.SYSTEM_PROJECTION).getExtent();
        let size = ol.extent.getWidth(extent) / 256; // 512
        let resolutions = [];
        let matrixIds = [];
        for (let z = 0; z < 14; ++z) {
            resolutions[z] = size / Math.pow(2, z);
            matrixIds[z] = z;
        }
        let layer = new ol.layer.Tile({
            source: new ol.source.WMTS({
                url: this.config.url + '/zs/data/Gmap/DH/DH_Colour_All_MKT_NEW/wmts', // http://10.148.10.131:9080
                layer: 'img',
                matrixSet: 'default028mm',
                format: 'image/png',
                style: 'default',
                wrapX: true,
                projection: sysconfig.SYSTEM_PROJECTION,
                crossOrigin: 'Anonymous',
                tileGrid: new ol.tilegrid.WMTS({
                    origin: [-20037508.34278924, 20037508.34278924],
                    resolutions: resolutions,
                    matrixIds: matrixIds
                })
            })
        });
        return layer;
    },

    switchMap(type) {
        let layers = this.map.getLayers().getArray();
        if (type === 'dh') {
            layers[0] = this.initWMTS();
        } else {
            layers[0] = this.initBaseLayer(type);
        }
        this.map.setLayerGroup(new ol.layer.Group({ layers: layers }));
    },

    initBaseLayer(type = 'dt') {
        let url = this.config.url + '/' + type + '/{z}/{x}/{y}.png';
        let layer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                crossOrigin: 'Anonymous',
                projection: sysconfig.SYSTEM_PROJECTION,
                tileSize: 256,
                tileUrlFunction(tileCoord) {
                    return url.replace('{z}', tileCoord[0]).replace('{x}', tileCoord[1]).replace('{y}', (-tileCoord[2] - 1));
                }
            })
        });
        return layer;
    },

    changeMap(type) {
        let layers = [...this.map.getLayers().getArray()];
        let nlayers;
        let count = 1;
        if (type === 'td') {
            nlayers = this.initTianDiLayer();
        } else {
            nlayers = [this.initBaseLayer(type)];
            if (layers[0].get('type') === 'td' && layers[1].get('type') === 'td') {
                count = 2;
            }
        }
        layers = layers.splice(count, layers.length - 1);
        layers = nlayers.concat(layers);
        this.map.setLayerGroup(new ol.layer.Group({ layers: layers }));
    }

};

lmap.layer = layer;
lmap.style = style;
lmap.util = util;
lmap.image = image;
lmap.draw = draw;
lmap.icon = icon;
lmap.polygon = polygon;
lmap.ctrl = ctrl;
lmap.custom = custom;
module.exports = lmap;
