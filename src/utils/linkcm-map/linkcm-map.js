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
        url: sysconfig.IP,
        layerNote: { // 0: 瓦片图层 1：标注图层
            dt1: [
                // 'http://10.148.10.131:9080/zs/data/TdtMkt/TdtMktMap/wmts',
                // 'http://10.148.10.131:9080/zs/data/TdtMkt/TdtMktMapAnno/wmts'
                sysconfig.IP + '/zs/data/TdtMkt/TdtMktMap/wmts',
                sysconfig.IP + '/zs/data/TdtMkt/TdtMktMapAnno/wmts'
            ],
            wx1: [
                // 'http://10.148.10.131:9080/zs/data/TdtMkt/TdtMktImage/wmts',
                // 'http://10.148.10.131:9080/zs/data/TdtMkt/TdtMktMapAnno/wmts'
                sysconfig.IP + '/zs/data/TdtMkt/TdtMktImage/wmts',
                sysconfig.IP + '/zs/data/TdtMkt/TdtMktMapAnno/wmts'
            ],
            dh: [
                // 'http://10.148.16.56/zs/data/Gmap/DH/DH_Colour_All_MKT_NEW/wmts'
                sysconfig.IP + '/zs/data/Gmap/DH/DH_Colour_All_MKT_NEW/wmts/'
            ]
        }
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
            map.setLayerGroup(new ol.layer.Group({ layers: [this.initWMTS('dh')] }));
            let view = map.getView();
            view.setCenter(util.transform(this.config.center));
            this.map = map;
            this.view = view;
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * 加载注记图层、目前只有dt1跟wx1会调用
     * @param {String} type 类型
     */
    initNote(type) {
        let extent = ol.proj.get(sysconfig.SYSTEM_PROJECTION).getExtent();
        let size = ol.extent.getWidth(extent) / 256; // 512
        let resolutions = [];
        let matrixIds = [];
        for (let z = 0; z < 19; ++z) {
            resolutions[z] = size / Math.pow(2, z);
            matrixIds[z] = z;
        }
        const source = new ol.source.WMTS({
            url: this.config.layerNote[type][1],
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
        source.set('mapName', 'note')
        let layer = new ol.layer.Tile({
            source: source
        });
        return layer;
    },

    /**
     * 加载wmts图层
     * @param {string} type 图层类型
     */
    initWMTS(type) {
        let extent = ol.proj.get(sysconfig.SYSTEM_PROJECTION).getExtent();
        let size = ol.extent.getWidth(extent) / 256; // 512
        let resolutions = [];
        let matrixIds = [];
        for (let z = 0; z < 19; ++z) {
            resolutions[z] = size / Math.pow(2, z);
            matrixIds[z] = z;
        }
        const source = new ol.source.WMTS({
            // url: this.config.url + '/zs/data/Gmap/DH/DH_Colour_All_MKT_NEW/wmts', // http://10.148.10.131:9080
            url: this.config.layerNote[type][0],
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
        source.set('mapName', 'map')
        let layer = new ol.layer.Tile({
            source: source
        });
        return layer;
    },

    switchMap(type) {
        let layers = this.map.getLayers().getArray();
        let noteIndex = -1, mapIndex = -1;
        layers.forEach((ele, i) => {
            if (ele.getSource().get('mapName') === 'map') mapIndex = i
            if (ele.getSource().get('mapName') === 'note') noteIndex = i
        })

        if (type === 'dh' || type === 'dt1' || type === 'wx1') { // 切换wmts图层
            layers[mapIndex] = this.initWMTS(type);
        } else { // 切换wms图层
            layers[mapIndex] = this.initBaseLayer(type);
        }
        if ('dt1' === type || 'wx1' === type) { // 添加标注图
            if (noteIndex !== -1) layers[noteIndex] = this.initNote(type);
            else this.map.addLayer(this.initNote(type))
        } else { // 移除标注图
            if (-1 !== noteIndex) this.map.removeLayer(layers[noteIndex]);
        }
        this.map.setLayerGroup(new ol.layer.Group({ layers: layers }));
        // let layers = this.map.getLayers().getArray();
        // if (type === 'dh') {
        //     layers[0] = this.initWMTS();
        // } else {
        //     layers[0] = this.initBaseLayer(type);
        // }
        // this.map.setLayerGroup(new ol.layer.Group({ layers: layers }));
    },

    initBaseLayer(type = 'dt') {
        let url = this.config.url + '/' + type + '/{z}/{x}/{y}.png';
        const source = new ol.source.XYZ({
            crossOrigin: 'Anonymous',
            projection: sysconfig.SYSTEM_PROJECTION,
            tileSize: 256,
            tileUrlFunction(tileCoord) {
                return url.replace('{z}', tileCoord[0]).replace('{x}', tileCoord[1]).replace('{y}', (-tileCoord[2] - 1));
            }
        })
        source.set('mapName', 'map')
        let layer = new ol.layer.Tile({
            source: source
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
