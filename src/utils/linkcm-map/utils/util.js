/* eslint-disable */
var util = {

    getExtent: function(map, reverse = false) {
        let extent = map.getView().calculateExtent(map.getSize());
        if (reverse) {
            extent = ol.proj.transformExtent(extent, sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION);
        }
        return extent;
    },

    getCenter(view) {
        return view.getCenter();
    },

    getZoom(view) {
        return Math.ceil(view.getZoom());
    },

    getIndex(type = 'basic') {
        let indexData = { basic: 1, model: 2, impact: 3, draw: 4, drawImpact: 5, poi: 5, poitop: 6, point: 7, active: 8 };
        return indexData[type];
    },

    projection() {
        return ol.proj.get(sysconfig.SYSTEM_PROJECTION);
    },

    getUnit() {
        return this.isEquirectangular() ? 'degrees' : 'm';
    },

    isEquirectangular() {
        return sysconfig.SYSTEM_PROJECTION === 'EPSG:4326';
    },

    floatLonLat(lonlat) {
        lonlat = lonlat.map(function(data) {
            return parseFloat((data + '').trim());
        });
        return lonlat;
    },

    transform(lonlat, reverse = false) {
        const SYSTEM_PROJECTION = reverse ? sysconfig.SOURCE_PROJECTION : sysconfig.SYSTEM_PROJECTION;
        const SOURCE_PROJECTION = reverse ? sysconfig.SYSTEM_PROJECTION : sysconfig.SOURCE_PROJECTION;
        return ol.proj.getTransform(SOURCE_PROJECTION, SYSTEM_PROJECTION)(this.floatLonLat(lonlat));
    },

    transforms(lonlatArr, reverse = false) {
        let lonlats = [];
        lonlatArr.forEach(function(element) {
            lonlats.push(this.transform(element, reverse));
        }, this);
        return lonlats;
    },

    transformMeter(lonlat, reverse = false) {
        const RESULT_PROJECTION = reverse ? sysconfig.SOURCE_PROJECTION : sysconfig.MERCATOR_PROJECTION;
        const SOURCE_PROJECTION = reverse ? sysconfig.MERCATOR_PROJECTION : sysconfig.SOURCE_PROJECTION;
        return ol.proj.getTransform(SOURCE_PROJECTION, RESULT_PROJECTION)(this.floatLonLat(lonlat));
    },

    getUUID() {
        var d = new Date().getTime();
        if (window.performance && typeof window.performance.now === 'function') {
            d += performance.now();
        }
        var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid.toUpperCase();
    },

    /**
     * 获取静态图片所需的地图要素
     * @param {object} params 合并的参数对象
     * @param {object} map 地图对象
     * @return 合并后的参数
    */
    getImageParam(params = {}, map) {
        if (Object.keys(map) === 0) return params;
        const bbox = this.getExtent(map);
        const BBOX = bbox ? bbox.join(',') : '';
        const [ WIDTH, HEIGHT ] = map.getSize();
        const ZOOM = map.getView().getZoom();
        return Object.assign({ BBOX, WIDTH, HEIGHT, ZOOM }, params);
    }
};

module.exports = util;
