/* eslint-disable */
var util = require('./util');
var styles = require('./style');

var icon = {

    /**
     * 添加图标到图层里
     * @param {object} layer 图层对象
     * @param {object} style 样式对象
     * @param {array} lonlats 经纬度
     * @param {object} [attrs={}] feature额外属性
     * @returns
     */
    add(layer, style, lonlats, attrs = {}) {
        let feature = new ol.Feature(new ol.geom.Point(util.transform(lonlats)));
        let keys = Object.keys(attrs);
        keys.forEach(function(key) {
            feature.set(key, attrs[key]);
        });
        feature.setStyle(styles.getStyle(style));
        layer.getSource().addFeature(feature);
        return feature;
    },

    /**
     * 添加图标到图层里
     * @param {object} layer 图层对象
     * @param {object} feature feature
     * @returns
     */
    addFeature(layer, feature) {
        if (!!layer) {
            layer.getSource().addFeature(feature);
        }
    },

    /**
     * 添加图标到图层里
     * @param {object} layer 图层对象
     * @param {array} features features
     * @returns
     */
    addFeatures(layer, features) {
        if (!!layer) {
            layer.getSource().addFeatures(features);
        }
    },

    /**
     * 检查是否存在某个feature
     * @param {object} layer 图层对象
     * @param {string} key 关键字
     * @param {string} val 值
     */
    existFeature(layer, key, val) {
        let features = layer.getSource().getFeatures();
        for (let feature of features) {
            if (key && val && feature.get(key) === val) {
                return feature;
            }
        }
        return null;
    },

    /**
     * 删除最后一个feature
     * @param {object} layer 图层对象
     */
    undo(layer) {
        let source = layer.getSource();
        let features = source.getFeatures();
        let l = features.length;
        if (l > 0) source.removeFeature(features[l - 1]);
    },

    /**
     * 删除图层里全部、某种或单个feature
     * @param {object} layer 图层对象
     * @param {object} param 删除对象信息
     */
    clear(layer, param) {
        if (!param) {
            if (layer) layer.getSource().clear();
        } else {
            if (param.type === 'type') {
                this.clearType(layer, param.key);
            } else if (param.type === 'one') {
                this.clearOne(layer, param.key, param.val);
            }
        }
    },

    /**
     * 删除图层里某一种feature
     * @param {object} layer 图层对象
     * @param {string} key 关键字
     */
    clearType(layer, key) {
        let features = layer.getSource().getFeatures();
        for (let feature of [...features]) {
            if (!!feature.get(key)) {
                layer.getSource().removeFeature(feature);
            }
        }
    },

    /**
     * 删除图层里单个feature
     * @param {object} layer 图层对象
     * @param {string} key 关键字
     * @param {string} val 值
     */
    clearOne(layer, key, val) {
        let feature = this.existFeature(layer, key, val);
        if (!!feature) {
            layer.getSource().removeFeature(feature);
        }
    }

};

module.exports = icon;
