/* eslint-disable */
var util = require('./util');

var image = {
    /**
     * 初始化动态图层
     *
     * @param {any} map 地图源对象
     * @param {any} param 图层参数
     * @param {any} [index='model'] 图层层级
     * @param {string} [dataType='param'] 参数数据格式
     * @param {boolean} [autoAdd=true] 是否自动添加到地图上
     * @returns 图层对象
     */
    WMS(map, param, index = 'model', dataType = 'param', autoAdd = true) {
        const opacity = Number(param.opacity);

        const func = !!param.loadFunc ? param.loadFunc : defalut;

        const image = {
            url: param.url,
            projection: sysconfig.SYSTEM_PROJECTION,
            params: this._param(param, dataType),
            imageLoadFunction: func,
            ratio: 1
        };

        function defalut(feature, src) {
            const ZOOM = Math.ceil(map.getView().getZoom());
            const EXTENT = util.transform(map.getView().calculateExtent(map.getSize()), true).join(',');
            feature.getImage().src = `${src}&${utils.serialize({ ZOOM, EXTENT })}&${utils.serializeWithAuth()}`;
        }

        const source = new ol.source.ImageWMS(image);
        const layer = new ol.layer.Image({ opacity, source });
        layer.setZIndex(util.getIndex(index));
        if (autoAdd) map.addLayer(layer);
        return layer;
    },

    /**
     * 更新动态图层
     *
     * @param {any} layer 图层对象
     * @param {any} param 图层参数
     * @param {string} [dataType='param'] 参数数据格式
     */
    updateWMS(layer, param, dataType = 'param') {
        if (!!layer) {
            layer.getSource().updateParams(this._param(param, dataType));
        } else {
            console.error('layer is undefined!');
        }
    },

    /**
     * 初始化静态图层
     *
     * @param {any} map 地图源对象
     * @param {any} param 图层参数
     * @param {string} [index='model'] 图层层级
     * @param {string} [dataType='param'] 参数数据格式
     * @param {boolean} [autoAdd=true] 是否自动添加到地图上
     * @returns 图层对象
     */
    Static(map, param, index = 'model', dataType = 'param', autoAdd = true) {
        const source = this._source(param, dataType);
        const layer = new ol.layer.Image({
            opacity: param.opacity,
            projection: sysconfig.SYSTEM_PROJECTION,
            source: source
        });
        layer.setZIndex(util.getIndex(index));
        if (autoAdd) map.addLayer(layer);
        return layer;
    },

    /**
     * 更新静态图层
     *
     * @param {any} layer 图层对象
     * @param {any} param 图层参数
     * @param {string} [dataType='param'] 参数数据格式
     * @returns 图层源对象
     */
    updateStatic(layer, param, dataType = 'param') {
        if (!!layer) {
            const source = this._source(param, dataType);
            layer.setSource(source);
            return source;
        } else {
            console.error('layer is undefined!');
        }
    },

    _source(param, dataType = 'param') {
        const extent = param.moving ? param.extent : util.transform(param.extent);
        const url = param.url + (dataType !== 'url' ? '?' + utils.serialize(this._param(param, dataType)) : '');
        return new ol.source.ImageStatic({
            url: url,
            imageExtent: extent,
            projection: sysconfig.SYSTEM_PROJECTION
        });
    },

    _param(param, dataType = 'param') {
        const otherParam = dataType === 'json' ? { PARAM: JSON.stringify(param.params) } : param.params;
        return Object.assign(dataType === 'json' ? { LAYERS: param.name } : {}, otherParam);
    },

    canvas(map, index, func, ratio = 1) {
        let layer = new ol.layer.Image({
            source: new ol.source.ImageCanvas({
                canvasFunction: func,
                ratio: ratio
            })
        });
        layer.setZIndex(util.getIndex(index));
        return layer;
    }
};

module.exports = image;
