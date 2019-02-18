/* eslint-disable */
var util = require('./util');
var style = require('./style');

// 地图画图类
let draw = {

    geomType: {
        point: 'Point',
        text: 'Point',
        arrow: 'LineString',
        circleLine: 'LineString',
        polyline: 'LineString',
        fixCircle: 'Circle',
        circle: 'Circle',
        box: 'Circle',
        line: 'LineString',
        polygon: 'Polygon'
    },

    active: {},

    /**
     * 初始化画笔
     *
     * @param {any} param 请求参数
     * @param {any} type
     * @param {any} event
     * @param {any} eventParam
     * @param {any} featureStyle
     * @returns
     */
    initHandle(param, type, event, eventParam, featureStyle) {
        const featureType = this.geomType[type];

        const freehand = ['box', 'line', 'polygon', 'circle', 'fixCircle'].includes(type);

        let geometryFunction = type === 'box' ? ol.interaction.Draw.createBox() : null;

        const isArrow = type === 'arrow';

        geometryFunction = isArrow ? this.arrow.createArrow(param.map, this.arrow.middle, this.arrow.solution, this.arrow.distance) : geometryFunction;

        let drawStyle = null;
        if (utils.isArray(featureStyle)) {
            drawStyle = style.getStyles(featureStyle, utils.isEmptyObject(featureStyle));
        } else {
            drawStyle = style.getStyle(featureStyle, utils.isEmptyObject(featureStyle));
        }
        const draw = {
            clickTolerance: 1,
            snapTolerance: 1,
            freehand: freehand,
            features: param.features,
            type: featureType,
            style: drawStyle,
            geometryFunction: geometryFunction
        };

        if (isArrow) draw.maxPoints = 2;

        const handle = new ol.interaction.Draw(draw);

        param.map.addInteraction(handle);

        let funcStart, funcEnd;
        switch (type) {
            case 'circle':
                param.text = '鼠标按住拖拽，松开鼠标结束标绘';
                funcStart = this.circle.default.start;
                funcEnd = this.circle.default.end;
                this.initTipBox(param);
                break;
            case 'fixCircle':
                param.text = '鼠标点击放下结束';
                funcStart = this.circle.fixed.start;
                funcEnd = this.circle.fixed.end;
                this.initTipBox(param);
                break;
            case 'line':
                funcEnd = this.defaultEnd;
                param.text = '鼠标按住拖拽，松开鼠标结束标绘';
                this.initTipBox(param);
                break;
            case 'circleLine':
            case 'text':
                funcEnd = this.defaultEnd;
                break;
            case 'box':
            case 'polygon':
                param.text = '鼠标按住拖拽，松开鼠标结束标绘';
                this.initTipBox(param);
                break;
            case 'arrow':
                param.text = '单击开始，单击结束';
                this.initTipBox(param);
                break;
            case 'polyline':
                param.text = '双击结束标绘';
                this.initTipBox(param);
                break;
            default:
                break;
        }
        this.handle = handle;
        handle.set('drawStyle', drawStyle);

        let _that = this;

        if (freehand) {
            this.cursor(param.map, true);
            let dragEvt = function() {
                _that.lock.dragEvt.call(_that);
            };
            let moveEvt = function() {
                _that.lock.moveEvt.call(_that);
            };
            param.map.on('pointerdrag', dragEvt);
            param.map.on('pointermove', moveEvt);
            handle.set('dragEvt', dragEvt);
            handle.set('moveEvt', moveEvt);
        }

        let isCircle = this.geomType[type] === 'Circle';
        if (!utils.isEmptyObject(event)) {
            if (funcStart || event.start) {
                handle.on('drawstart', function(e) {
                    handle.set('status', true);
                    e.feature.set('isCircle', isCircle);
                    if (!!funcStart) funcStart.call(_that, e, handle, param);
                    if (!!event.start) return event.start(e);
                });
            }

            if (funcEnd || event.end) {
                handle.on('drawend', function(e) {
                    handle.set('status', false);
                    e.feature.set('type', type);
                    e.feature.set('style', featureStyle);
                    if (!!funcEnd) funcEnd.call(_that, e, handle, param);
                    if (!!eventParam.data) {
                        let attrs = Object.keys(eventParam.data);
                        for (let a of attrs) {
                            e.feature.set(a, eventParam.data[a]);
                        }
                    }
                    if (!!event.end) return event.end(e);
                });
            }
        }
        return handle;
    },

    initModify(param, event) {
        const modify = new ol.interaction.Modify({
            features: param.features
        });
        if (!!event) {
            if (!!event.start) {
                modify.on('modifystart', function(evt) {
                    event.start(evt);
                });
            }
            if (!!event.end) {
                modify.on('modifyend', function(evt) {
                    event.end(evt);
                });
            }
        }
        param.map.addInteraction(modify);
        return modify;
    },

    undo(layer) {
        let features = this.getFeatures(layer);
        let index = features.length - 1;
        if (index >= 0) {
            this.removeFeature(layer, features[index]);
        } else {
            return;
        }
    },

    getSource(layer) {
        return layer.getSource();
    },

    getFeatures(layer) {
        return [...this.getSource(layer).getFeatures()];
    },

    removeFeature(layer, feature) {
        this.getSource(layer).removeFeature(feature);
    },

    clear(layer) {
        this.getSource(layer).clear();
    },

    getCircle(feature) {
        let geom = feature.getGeometry();
        let center = geom.getCenter();
        let radius = geom.getRadius();
        center = util.transform(center, true);
        return { center: center, radius: radius };
    },

    getWKT(feature) {
        if (feature.get('isCircle')) {
            return this.getCircleWKT(feature);
        } else {
            let format = new ol.format.WKT();
            return format.writeGeometry(
                feature
                    .clone()
                    .getGeometry()
                    .transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION)
            );
        }
    },

    getCircleWKT(feature) {
        feature = feature.clone();
        let circle = feature.getGeometry();
        let center = circle.getCenter();
        let geom = new ol.geom.Circle(center, circle.getRadius());
        let polygon = ol.geom.Polygon.fromCircle(geom, 36);
        let format = new ol.format.WKT();
        return format.writeGeometry(polygon.transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION));
    },

    defaultEnd(evt, handle, param) {
        let drawStyle = handle.get('drawStyle');
        evt.feature.setStyle([drawStyle]);
    },

    hexToRgba(hex, opacity) {
        let color;
        opacity = opacity || 1;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            color = hex.substring(1).split('');
            if (color.length === 3) {
                color = [color[0], color[0], color[1], color[1], color[2], color[2]];
            }
            color = '0x' + color.join('');
            return 'rgba(' + [(color >> 16) & 255, (color >> 8) & 255, color & 255].join(',') + ',' + opacity + ')';
        }
    },

    lock: {
        dragEvt() {
            if (!!this.timer) {
                window.clearTimeout(this.timer);
                this.timer = null;
            }
            this.handle.set('status', false);
        },
        moveEvt() {
            if (!!this.handle && this.handle.get('status')) {
                this.timer = window.setTimeout(() => {
                    this.handle.setActive(false);
                    this.handle.setActive(true);
                }, 150);
                this.handle.set('status', false);
            }
        }
    },

    circle: {
        setRadius(feature, radius) {
            feature.getGeometry().setRadius(radius);
        },
        fixed: {
            start(evt, handle, param) {
                handle.finishDrawing();
            },
            end(evt, handle, param) {
                let view = param.map.getView();
                let projection = view.getProjection();
                let resolutionAtEquator = view.getResolution();
                let center = param.map.getView().getCenter();
                let pointResolution = ol.proj.getPointResolution(projection, resolutionAtEquator, center);
                let resolutionFactor = resolutionAtEquator / pointResolution;
                let radius = (param.radius / ol.proj.METERS_PER_UNIT.m) * resolutionFactor;
                this.circle.setRadius(evt.feature, radius);

                // this.circle.setRadius(evt.feature, param.radius);
            }
        },
        default: {
            start(evt, handle, param) {
                if (this.active && this.active.overlay) param.map.removeOverlay(this.active.overlay);
                this.active = {};
                let _that = this;
                let element = document.createElement('div');
                element.className = 'tooltip hidden';
                let option = {
                    element: element,
                    offset: [15, 0],
                    positioning: 'center-left'
                };
                let overlay = this.getOverlay(option);
                param.map.addOverlay(overlay);
                param.map.on('pointerdrag', dragEvt);
                function dragEvt(evt) {
                    overlay.setPosition(evt.coordinate);
                }
                let change = evt.feature.getGeometry().on('change', function(evt) {
                    const center = evt.target.getCenter()
                    const radius = evt.target.getRadius()
                    const edgeCoordinate = [center[0] + radius, center[1]]
                    var wgs84Sphere = new ol.Sphere(6378137)
                    var groundRadius = wgs84Sphere.haversineDistance(
                        util.transform(center, true),
                        util.transform(edgeCoordinate, true)
                    )
                    element.innerHTML = _that.formatLength(groundRadius);
                });
                this.active = { dragEvt: dragEvt, change: change, overlay: overlay };
            },
            end(evt, handle, param) {
                param.map.removeOverlay(this.active.overlay);
                param.map.un('pointerdrag', this.active.dragEvt);
                ol.Observable.unByKey(this.active.change);
                this.active = {};
            }
        }
    },

    arrow: {
        createArrow(map, middle, solution, distance) {
            return function(coordinates, geometry) {
                if (!geometry) geometry = new ol.geom.Polygon(null);
                let [startA, endA] = coordinates;
                let [startB, endB] = coordinates;
                if (util.isEquirectangular()) {
                    startB = util.transformMeter(startA);
                    endB = util.transformMeter(endA);
                }
                let dist = distance(map);
                let middleA = middle(startB, endB, 4);
                let k = -1 / ((endB[1] - startB[1]) / (endB[0] - startB[0]));
                let bA = middleA[1] - k * middleA[0];
                let outPoints = solution(middleA, k, bA, dist);
                let middleB = middle(startB, endB, 4);
                let bB = middleB[1] - k * middleB[0];
                let inPoints = solution(middleB, k, bB, dist / 2.5);
                if (util.isEquirectangular()) {
                    outPoints[0] = util.transformMeter(outPoints[0], false);
                    outPoints[1] = util.transformMeter(outPoints[1], false);
                    inPoints[0] = util.transformMeter(inPoints[0], false);
                    inPoints[1] = util.transformMeter(inPoints[1], false);
                }
                geometry.setCoordinates([[startA, inPoints[0], outPoints[0], endA, outPoints[1], inPoints[1], startA]]);
                return geometry;
            };
        },

        // 获取一直线上的中间一点
        middle(start, end, p) {
            let atwill = [];
            let x = (start[0] + p * end[0]) / (1 + p);
            let y = (start[1] + p * end[1]) / (1 + p);
            atwill[0] = x;
            atwill[1] = y;
            return atwill;
        },

        // 求二次方程解
        solution(point, k, lb, dist) {
            let _A = point[0];
            let _B = point[1];
            let a = 1 + Math.pow(k, 2);
            let b = -1 * (2 * _A - 2 * k * lb + 2 * _B * k);
            let c = Math.pow(lb, 2) + Math.pow(_B, 2) + Math.pow(_A, 2) - 2 * _B * lb - Math.pow(dist, 2);
            let dt = Math.sqrt(Math.pow(b, 2) - 4 * a * c);
            let x0 = (-b + dt) / (2 * a);
            let x1 = (-b - dt) / (2 * a);
            let y0 = k * x0 + lb;
            let y1 = k * x1 + lb;
            let _obj1 = [x0, y0];
            let _obj2 = [x1, y1];
            let result = [_obj1, _obj2];
            return result;
        },

        // 按地图缩放层级设置距离值大小
        distance(map) {
            let zoom = map.getView().getZoom(); // min 5
            let total = 50000;
            let item = 6000;
            // if (zoom >= 10 && zoom < 14) {
            //     total = 6000;
            //     item = 1300;
            // } else if (zoom >= 14) {
            //     total = 600;
            //     item = 80;
            // }
            return total - (zoom - 5) * item;
        }
    },

    cancel(map, handle) {
        this.cursor(map);
        if (!!handle) {
            let dragEvt = handle.get('dragEvt');
            let moveEvt = handle.get('moveEvt');
            if (!!dragEvt) map.un('pointerdrag', dragEvt);
            if (!!moveEvt) map.un('pointermove', moveEvt);
        }
        if (!utils.isEmptyObject(this.tipBox)) {
            map.removeOverlay(this.tipBox.overlay);
            map.un('pointermove', this.tipBox.pointerMoveEvt);
            this.tipBox = {};
        }
        map.removeInteraction(handle);
    },

    initTipBox(param) {
        let map = param.map;
        let pointerMoveEvt = function(evt) {
            if (evt.dragging) return;
            const text = param.text;
            tipBox.ele.classList.remove('hidden');
            tipBox.ele.innerHTML = text;
            try {
                tipBox.overlay.setPosition(evt.coordinate);
            } catch (e) {
                param.map.un('pointermove', pointerMoveEvt);
            }
        };
        if (this.tipBox) {
            map.removeOverlay(this.tipBox.overlay);
            map.un('pointermove', pointerMoveEvt);
            this.tipBox = {};
        }
        let ele = document.createElement('div');
        ele.className = 'tooltip hidden';
        let tip = new ol.Overlay({
            element: ele,
            offset: [15, 0],
            positioning: 'center-left'
        });
        map.addOverlay(tip);
        let tipBox = {
            ele: ele,
            overlay: tip,
            pointerMoveEvt: pointerMoveEvt
        };
        this.tipBox = tipBox;
        map.on('pointermove', pointerMoveEvt);
    },

    getOverlay(param) {
        if (typeof param.stopEvent === 'undefined') param.stopEvent = true;
        let option = {
            projection: sysconfig.SYSTEM_PROJECTION,
            offset: param.offset,
            element: param.element,
            positioning: param.positioning,
            stopEvent: param.stopEvent
        };
        let overlay = new ol.Overlay(option);
        let lonlat = param.lonlat;
        if (param.transform) {
            lonlat = util.transform(lonlat);
        }
        overlay.setPosition(lonlat);
        return overlay;
    },

    formatLength(radius) {
        radius = Number(radius);
        if (Number.isNaN(radius)) {
            return '0 m';
        } else {
            radius = (radius > 100) ? (radius / 1000).toFixed(2) + ' km' : (radius).toFixed(2) + ' m';
            return radius;
        }
        // let length = Math.round(radius * ol.proj.METERS_PER_UNIT[util.getUnit()] * 100) / 100;
        // let output;
        // let num;
        // if (length > 100) {
        //     num = Math.round(length / 1000 * 100) / 100;
        //     output = num > 0 ? num + ' km' : '';
        // } else {
        //     num = Math.round(length * 100) / 100;
        //     output = num > 0 ? num + ' m' : '';
        // }
        // return output;
    },

    cursor(map, status = false) {
        let target = map.getTargetElement();
        if (status) target.style.cursor = 'crosshair';
        else target.style.cursor = 'default';
    }
};

module.exports = draw;
