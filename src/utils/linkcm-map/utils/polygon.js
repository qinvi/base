/* eslint-disable */
var util = require('./util');
var styles = require('./style');

var polygon = {

    add(layer, style, lonlats, type, attrs) {
        let geom;
        if (type === 'lineString') {
            geom = new ol.geom.LineString(util.transforms(lonlats));
        } else if (type === 'Polygon') {
            geom = new ol.geom.Polygon(util.transforms(lonlats));
        }
        let feature = new ol.Feature(geom);
        let keys = Object.keys(attrs);
        keys.forEach(function(key) {
            feature.set(key, attrs[key]);
        });
        feature.setStyle(styles.getStyle(style));
        layer.getSource().addFeature(feature);
        return feature;
    },

    addGeoJson(json) {
        return this.addFormat('GeoJSON', json);
    },

    addWKT(wkt) {
        return this.addFormat('WKT', wkt);
    },

    addFormat(type, json) {
        let format = null;
        if (type === 'WKT') {
            format = new ol.format.WKT();
        } else if (type === 'GeoJSON') {
            format = new ol.format.GeoJSON();
        }
        const features = format.readFeatures(json, {
            dataProjection: sysconfig.SOURCE_PROJECTION,
            featureProjection: sysconfig.SYSTEM_PROJECTION
        });
        return features;
    },

    undo(layer) {
        let source = layer.getSource();
        let features = source.getFeatures();
        let l = features.length;
        if (l > 0) source.removeFeature(features[l - 1]);
    },

    clear(layer, name) {
        if (!!name) {
            let source = layer.getSource();
            let features = source.getFeatures();
            [...features].forEach(function(f) {
                if (f.get('name') === name) {
                    source.removeFeature(f);
                }
            });
        } else {
            layer.getSource().clear();
        }
    },

    getCircle(feature) {
        let tempGeom = feature.getGeometry();
        let center = tempGeom.getCenter();
        let rad = tempGeom.getRadius();
        center = util.transform(center, true);
        return { center: center, radius: rad };
    },

    getCircleWKT(feature) {
        let circle = this.getCircle(feature);
        let center = util.transform(circle.center);
        let geom = new ol.geom.Circle(center, circle.radius);
        let polygon = ol.geom.Polygon.fromCircle(geom, 32);
        return new ol.format.WKT().writeGeometry(polygon.transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION));
    },

    getWKT(feature, type) {
        let WKT = new ol.format.WKT();
        if (!!type && type.toLowerCase() === 'circle') {
            return this.getCircleWKT(feature);
        } else {
            return WKT.writeGeometry(feature.clone().getGeometry().transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION));
        }
    }
};

module.exports = polygon;
