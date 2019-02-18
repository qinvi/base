/* eslint-disable */
let style = {

    default: {
        fill: {
            color: 'rgba(224,76,56,0.2)',
            width: 1
        },
        stroke: {
            color: '#1A1A1A',
            width: 1,
            lineDash: []
        },
        circle: {
            radius: 5,
            fill: {
                color: 'rgba(224,76,56,0.2)'
            },
            stroke: {
                color: '#1A1A1A',
                width: 1
            },
            geometry: function(feature) {
                return feature;
            }
        },
        icon: {
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAwEBnHxMcgAAAABJRU5ErkJggg==',
            anchor: [0.5, 0.5],
            size: [1, 1],
            scale: 1,
            rotation: 0,
            opacity: 1,
            // anchorXUnits: 'fraction',   // 与anchor是匹配关系  pixels是像素
            // anchorYUnits: 'fraction',
            anchorOrigin: 'bottom-left'
        },
        text: {
            text: '',
            size: '14px',
            rotation: 0,
            offsetY: 0,
            offsetX: 0,
            fill: {
                color: '#000',
                width: 1
            },
            stroke: {
                color: '#fff',
                width: 3
            },
            geometry: function(feature) {
                return feature;
            }
        }
    },

    getStyles(params = [], status = false) {
        let result = [];
        params.forEach(function(p) {
            result.push(this.getStyle(p, status));
        }, this);
        return result;
    },

    getStyle(param = {}, status = false) {
        let fill, stroke, text, image, geometry;
        if (status || !!param.fill) fill = this.getFill(param.fill);
        if (status || !!param.stroke) stroke = this.getStroke(param.stroke);
        if (status || !!param.text) text = this.getText(param.text);
        if (status || !!param.geometry) geometry = param.geometry;
        if (status || !!param.icon || !!param.circle) {
            image = (!!param.isIcon) ? this.getIcon(param.icon) : this.getCircle(param.circle);
        }
        return new ol.style.Style({ fill, stroke, text, image, geometry });
    },

    getText(style = {}) {
        let option = Object.assign({}, this.default.text);
        style = Object.assign(option, style);
        return new ol.style.Text({
            text: style.text,
            offsetY: style.offsetY,
            offsetX: style.offsetX,
            font: (!!style.size ? style.size : '12px') + ' sans-serif',
            fill: this.getFill(style.fill),
            stroke: this.getStroke(style.stroke),
            rotation: (Math.PI / 180) * style.rotation
        });
    },

    getFill(style = {}) {
        let option = Object.assign({}, this.default.fill);
        style = Object.assign(option, style);
        let color = style.opacity ? this.colorRgb(style.color, style.opacity) : style.color;
        return new ol.style.Fill({
            color: color,
            width: style.width
        });
    },

    getStroke(style = {}) {
        let option = Object.assign({}, this.default.stroke);
        style = Object.assign(option, style);
        return new ol.style.Stroke({
            color: style.color,
            width: style.width,
            lineDash: style.lineDash
        });
    },

    getCircle(style = {}) {
        let option = Object.assign({}, this.default.circle);
        style = Object.assign(option, style);
        return new ol.style.Circle({
            radius: style.radius,
            fill: this.getFill(style.fill),
            stroke: this.getStroke(style.stroke)
        });
    },

    getIcon(style = {}) {
        let option = Object.assign({}, this.default.icon);
        style = Object.assign(option, style);
        return new ol.style.Icon({
            anchor: style.anchor,
            src: style.src,
            size: style.size,
            scale: style.scale,
            rotation: (Math.PI / 180) * style.rotation,
            opacity: style.opacity
        });
    },

    // 颜色值转rgb
    colorRgb(color, opacity) {
        let sColor = color.toLowerCase();
        let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        if (sColor && reg.test(sColor)) {
            if (sColor.length === 4) {
                let sColorNew = '#';
                for (let i = 1; i < 4; i += 1) {
                    sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
                }
                sColor = sColorNew;
            }
            // 处理六位的颜色值
            let sColorChange = [];
            for (let i = 1; i < 7; i += 2) {
                sColorChange.push(parseInt('0x' + sColor.slice(i, i + 2)));
            }
            return 'rgba(' + sColorChange.join(',') + ',' + opacity + ')';
        } else {
            return sColor;
        }
    }
}

module.exports = style;
