/* eslint-disable */
var style = require('./style');

var layer = {

    getIndex(type = 'basic') {
        let indexData = { basic: 1, model: 2, impact: 3, draw: 4, drawImpact: 5, poi: 5, poitop: 6, point: 7, active: 8 };
        return indexData[type];
    },

    init(map, index) {
        let layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: []
            })
        });
        layer.setZIndex(this.getIndex(index));
        map.addLayer(layer);
        return layer;
    },

    initDrawParam(map, index) {
        let features = new ol.Collection();
        let layer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: features }),
            style: style.getStyle({}, true)
        });
        layer.setZIndex(this.getIndex(index));
        map.addLayer(layer);
        return { map: map, features: features, layer: layer };
    },

    remove(map, layer) {
        if (!!layer) map.removeLayer(layer);
        return null;
    }

};

module.exports = layer;
