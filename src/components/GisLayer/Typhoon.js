import { mapActions, mapState } from 'vuex';
export default {
    template: `<div></div>`,
    data() {
        return {
            animationIsEnd: false,
            activePoint: null, // 所点击的poi点
            untreated: []
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            paths: state => state.typhoon.paths,
            triggerType: state => state.typhoon.triggerType,
            callback: state => state.typhoon.callback,
            influenceCallback: state => state.typhoon.influenceCallback,
            deleteTsid: state => state.typhoon.deleteTsid,
            bigScreen: state => state.toolsBar.bigScreen,
            timePlay: state => state.time.play,
            sysTime: state => {
                return TU(state.time.sysTime).format('YYYYMMDDHHmmss');
            }
        })
    },
    watch: {
        paths(data) {
            if (data.size) {
                if (this.sysTime >= TU(new Date()).format('YYYYMMDDHHmmss')) this.clearForcastImg() // 以前时间不需要先删除预报
                // if (!this.timePlay) this.clearForcastImg() // 如果不是处于播放状态，路径更新时，直接先删除预报图层
                this.untreated.push(new Map(data))
                // if (Object.keys(data).length < this.ts.live.length) { // 取消勾选
                //     this.packTS()
                //     utils.clearTimer(this.timer.cancelTimer);
                //     this.timer.cancelTimer = window.setTimeout(() => {
                //         this.run();
                //     }, 80);
                // } else {
                //     this.run(); // 勾选
                // }
            } else {
                this.runStatus = 'end'
                this.lastPaths = null
                this.lastTsid = []
                this.clear()
                this.clearForcastImg()
            }
        },
        untreated(data) {
            if (this.runStatus === 'running') return
            for (let i = 0; i < data.length; i++) {
                this.packTS()
                this.run(data[i])
            }
        },
        animationIsEnd(status) {
            if (status) {
                this.eyeAnimation(0);
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认数据
         */
        initConstData() {
            this.layer = lmap.layer.init(lmap.map, 'active');
            this.updateParam(['typhoon', { listToPoint: this.simulateMoveAndClick }]);
            lmap.map.on('pointermove', this.move);
            lmap.map.on('singleclick', this.click);
            this.wms = null;
            this.timer = { animation: null, eye: null, cancelTimer: null };
            this.ts = {
                box: null,
                live: [],
                time: [],
                eye: {
                    data: {},
                    style: {
                        isIcon: true,
                        icon: { src: `${sysconfig.TESTIP}/topic/little/necImage/typhoon.png`, size: [62, 62] }
                    }
                },
                color: {
                    type: { 'TD': 'rgba(0,228,0,opacity)', 'TS': 'rgba(6,95,184,opacity)', 'STS': 'rgba(255,255,0,opacity)', 'TY': 'rgba(255,126,0,opacity)', 'STY': 'rgba(255,0,0,opacity)', 'SUPER TY': 'rgba(117,0,33,opacity)' },
                    radius: { 'rr06': 'TD', 'rr07': 'TS', 'rr08': 'STS', 'rr010': 'TY', 'rr012': 'STY' }
                },
                levels: [ [ 0, 0.3 ], [ 0.3, 1.6 ], [ 1.6, 3.4 ], [ 3.4, 5.5 ], [ 5.5, 8.0 ], [ 8.0, 10.8 ], [ 10.8, 13.9 ], [ 13.9, 17.2 ], [ 17.2, 20.8 ], [ 20.8, 24.5 ], [ 24.5, 28.5 ], [ 28.5, 32.7 ], [ 32.7, 37.0 ], [ 37.0, 41.5 ], [ 41.5, 46.2 ], [ 46.2, 51.0 ], [ 51.0, 56.1 ], [ 56.1, 100 ] ]
            };
            this.movePoint = null
            this.forecastLayer = null
            this.lastPaths = null
            this.lastTsid = []
            this.forecastFeatures = new ol.Collection()
            this.runStatus = 'end' // 台风描述情况
        },

        /**
         * 重新组装ts数据
         */
        packTS() {
            let i = -1;
            this.ts.live.every((ele, index) => {
                if (ele === this.deleteTsid) i = index;
                return !(i === index);
            });
            if (i !== -1) this.ts.live.splice(i, 1);
            if (i !== -1) this.ts.time.splice(i, 1);
            // this.renderImage(); // 取消才画预报路径
        },

        /**
         * 开始渲染台风路径
         * @param {newMap} data
         * @param {boolean} status 控制台风渲染效果
         */
        async run(data, status) {
            // if (this.triggerType === 'time') this.clear();
            // else this.clearFeature()
            this.clear()
            this.animationIsEnd = false;
            let live = [];
            let time = [];
            let func;
            this.runStatus = 'running'
            if (data.size) {
                for (let [key, value] of data) {
                    // 时间轴播放和暂停生成台风的间隔不一样
                    if (this.timePlay) func = (this.lastPaths && this.lastPaths.get(key)) ? this.animation : this.animationAsync
                    else {
                        const index = this.lastTsid.indexOf(key);
                        func = (!!status || (index !== -1)) ? this.animation : this.animationAsync;
                    }

                    const fst = value.fst;
                    const obs = value.obs;
                    let timeIndex = -1;
                    // if ((this.triggerType === 'manMade' && !this.lastTsid.includes(ts.tsid) || (this.triggerType === 'time'))) {
                    // }
                    for (let i = 0; i < fst.data.length; i++) {
                        this.renderPoint(fst.data[i], 'fst', i);
                    }

                    for (let i = 0; i < obs.data.length; i++) {
                        await func(i, obs);
                        timeIndex = i; // 由Typhoon.vue来处理路径数据
                    }

                    live.push(key); // if (timeIndex !== -1)
                    if (timeIndex !== -1) time.push(obs.data[timeIndex].bjdatetime);
                    else time.push(TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'));
                }
                this.lastPaths = data
                this.ts.live = live;
                this.ts.time = time;
                this.animationIsEnd = true;
                this.renderImage();
                this.lastTsid = [...data.keys()]
                this.runStatus = 'end'
                this.untreated.shift()
            }
            // if (!!data && !utils.isEmptyArray(data)) {
            //     for (let i = 0; i < data.length; i++) {
            //         data[i] = this.paths[data[i]]
            //         const ts = data[i];
            //         // 时间轴播放和暂停生成台风的间隔不一样
            //         if (this.timePlay) func = (this.lastPaths && this.lastPaths[ts.tsid]) ? this.animation : this.animationAsync
            //         else {
            //             const index = this.ts.live.indexOf(ts.tsid);
            //             func = (!!status || (index !== -1)) ? this.animation : this.animationAsync;
            //         }

            //         const fst = data[i].fst;
            //         const obs = data[i].obs;
            //         let timeIndex = -1;
            //         // if ((this.triggerType === 'manMade' && !this.lastTsid.includes(ts.tsid) || (this.triggerType === 'time'))) {
            //         // }
            //         for (let i = 0; i < fst.data.length; i++) {
            //             this.renderPoint(fst.data[i], 'fst', i);
            //         }

            //         for (let i = 0; i < obs.data.length; i++) {
            //             await func(i, obs);
            //             timeIndex = i; // 由Typhoon.vue来处理路径数据
            //         }

            //         live.push(ts.tsid); // if (timeIndex !== -1)
            //         if (timeIndex !== -1) time.push(obs.data[timeIndex].bjdatetime);
            //         else time.push(TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'));
            //     }
            //     this.lastPaths = this.paths
            //     this.ts.live = live;
            //     this.ts.time = time;
            //     this.animationIsEnd = true;
            //     this.renderImage();
            //     this.lastTsid = Object.keys(this.paths)
            // }
            // this.wms = lmap.layer.remove(lmap.map, this.wms);
        },

        /**
         * 同步处理
         * @param {number} i 数据索引
         * @param {object} obs 台风实况点数据
         */
        animationAsync(i, obs) {
            return new Promise((resolve, reject) => {
                utils.clearTimer(this.timer.animation);
                this.timer.animation = window.setTimeout(() => {
                    this.animation(i, obs, resolve);
                }, 40);
            });
        },

        /**
         * 渲染动画
         * @param {number} i 数据索引
         * @param {object} obs 台风实况点数据
         * @param {promise} resolve 回调方法
         */
        animation(i, obs, resolve) {
            const data = obs.data;
            this.renderPoint(data[i], 'obs', i);
            if (!!this.ts.eye.data[data[i].tsid]) {
                this.layer.getSource().removeFeature(this.ts.eye.data[data[i].tsid]);
                this.ts.eye.data[data[i].tsid] = null;
                delete this.ts.eye.data[data[i].tsid];
            }
            this.ts.eye.data[data[i].tsid] = lmap.icon.add(this.layer, this.ts.eye.style, [ data[i].lon, data[i].lat ], { tse: 'tse', name: 'tsp', tsid: data[i].tsid, type: 'obs', index: i });
            const next = i + 1;
            if ((!!data[next] && i > 0) || next === obs.data.length) this.renderLine(data[i], data[i - 1]);
            this.renderAirRing(data[i]);
            if (!!resolve) resolve();
        },

        /**
         * 风眼动画
         * @param {number} i 下标
         */
        eyeAnimation(i) {
            utils.clearTimer(this.timer.eye);
            this.timer.eye = window.setTimeout(() => {
                let style = Object.assign({}, this.ts.eye.style);
                style.icon.rotation = i * 6;
                for (let tsid in this.ts.eye.data) {
                    this.ts.eye.data[tsid].setStyle(lmap.style.getStyle(style));
                }
                return this.eyeAnimation(i - 1);
            }, 25);
        },

        /**
         * 清除台风路径
         */
        clear() {
            utils.clearTimer(this.timer.animation);
            utils.clearTimer(this.timer.eye);
            lmap.icon.clear(this.layer);
            this.ts.eye.data = {};
        },

        /**
         * 清除feature，只针对没有实质数据的情况
         */
        clearFeature() {
            // const keys = Object.keys(this.paths)
            const keys = [...this.paths.keys()]
            const features = this.layer.getSource().getFeatures()
            this.lastTsid.forEach(ele => {
                if (!keys.includes(ele)) { // 对应tsid的台风被删除了
                    for (let i = features.length - 1; i >= 0; i--) {
                        if (features[i].get('tsid') === ele) this.layer.getSource().removeFeature(features[i])
                    }
                }
            })
        },

        /**
         * 生成实况台风点
         * @param {object} tp 台风点数据
         * @param {string} type 台风类型
         * @param {number} i 序号
         */
        renderPoint(tp, type, i) {
            const opacity = type === 'fst' ? 0.01 : 1;
            const color = (this.ts.color.type[tp.trank] || 'rgba(255, 255, 255, 0)').replace('opacity', opacity);
            const stroke = `rgba(0, 0, 0, ${opacity})`;
            const style = {
                circle: {
                    radius: 4,
                    fill: { color: color },
                    stroke: { color: stroke, width: 1 }
                }
            };
            if (i === 0 && opacity === 1) {
                style.text = { size: '16px', text: `<--${tp.tscname}`, fill: { color: '#000' }, stroke: { color: '#fff', width: 2 }, offsetX: 50 };
            }
            return lmap.icon.add(this.layer, style, [ tp.lon, tp.lat ], { name: 'tsp', index: i, tsid: tp.tsid, type });
        },

        /**
         * 两个台风点之间连线
         * @param {object} stsp 开始点
         * @param {object} etsp 结束点
         */
        renderLine(stsp, etsp) {
            if (!etsp) return;
            let color = this.ts.color.type[stsp.trank] || 'rgba(255, 255, 255, 1)';
            color = color.replace('opacity', 1);
            const style = { stroke: { color: color, width: 3 } };
            return lmap.polygon.add(this.layer, style, [ [ stsp.lon, stsp.lat ], [ etsp.lon, etsp.lat ] ], 'lineString', { name: 'tsl' });
        },

        /**
         * 生成风圈
         * @param {object} item 台风点数据
         */
        renderAirRing(item) {
            lmap.icon.clearType(this.layer, 'tsc');
            const radiusMap = { rr06: item.rr06, rr07: item.rr07, rr08: item.rr08, rr010: item.rr010, rr012: item.rr012 };
            const wgs84Sphere = new ol.Sphere(6378137);
            for (let rtype in radiusMap) {
                let radius = radiusMap[rtype];
                if (!!radius) {
                    const circle4326 = ol.geom.Polygon.circular(wgs84Sphere, [ item.lon, item.lat ], radius *= 1000, 64);
                    const circle3857 = circle4326.clone().transform(sysconfig.SOURCE_PROJECTION, sysconfig.SYSTEM_PROJECTION);
                    const feature = new ol.Feature(circle3857);
                    const tcolor = this.ts.color.type[this.ts.color.radius[rtype]];
                    const style = {
                        stroke: { color: tcolor.replace('opacity', 1), width: 3 },
                        fill: { color: tcolor.replace('opacity', 0.05) }
                    };
                    feature.setStyle(lmap.style.getStyle(style));
                    feature.set('tsc', 'tsc');
                    this.layer.getSource().addFeature(feature);
                }
            }
        },

        /**
         * 获取影响区域
         */
        getImageParam() {
            if (utils.isEmptyArray(this.ts.live)) {
                return false;
            } else {
                return {
                    name: 'tf',
                    url: sysconfig.TESTPATH + '/realTimeMonitor/getTyphoonImage',
                    params: {
                        dateTime: this.ts.time.join(','),
                        tsId: this.ts.live.join(','),
                        code: this.code,
                        pathType: true
                    }
                }
            }
        },

        /**
         * 初始化、更新影响区域
         */
        renderImage() {
            const params = this.getImageParam();
            if (params) {
                if (!!this.wms) {
                    lmap.image.updateWMS(this.wms, params);
                } else {
                    let wms = lmap.image.WMS(lmap.map, params, 'active');
                    this.wms = wms;
                }

                if (!this.forecastLayer) {
                    this.forecastLayer = new ol.layer.Vector({
                        source: new ol.source.Vector({
                            features: this.forecastFeatures
                        }),
                        style: new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#f00',
                                width: 1,
                                lineDash: [5, 5]
                            })
                        }),
                        zIndex: lmap.util.getIndex('active')
                    })
                    lmap.map.addLayer(this.forecastLayer)
                }

                const self = this
                const forecastPointsStyleFunction = function () {
                    const zoom = lmap.map.getView().getZoom()
                    const feature = this
                    const point = feature.get('waypointData')
                    const color = (self.ts.color.type[point.trank] || 'rgba(255, 255, 255, 0)').replace('opacity', 1);
                    const pointStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            radius: 3,
                            fill: new ol.style.Fill({
                                color: color
                            })
                        })
                    })
                    const textStyle = new ol.style.Style({
                        text: new ol.style.Text({
                            text: feature.get('dateString'),
                            font: zoom > 6 ? '16px "Microsoft Yahei", sans-serif' : '13px "Microsoft Yahei", sans-serif',
                            offsetY: -25,
                            fill: new ol.style.Fill({
                                color: '#f00'
                            })
                        })
                    })

                    if (zoom < 6) {
                        return [pointStyle]
                    } else {
                        return [pointStyle, textStyle]
                    }
                }
                this.forecastFeatures.clear();
                // let pathData = Object.keys(this.paths)
                let pathData = [...this.paths.keys()]
                pathData.forEach(path => {
                    // path = this.paths[path]
                    path = this.paths.get(path)
                    if (path.obs.time.length) {
                        // let lastPoint = '';
                        let lastIndex = 0;
                        let tiemArr = path.obs.time;
                        for (let i = 0; i < tiemArr.length; i++) {
                            if (tiemArr[i] === path.fstDateTime) {
                                lastIndex = i;
                                break;
                            }
                        }
                        const lastPoint = path.obs.data[lastIndex];
                        const forecastPts = path.fst.data
                        const lineGeom = new ol.geom.LineString([ol.proj.fromLonLat([+lastPoint.lon, +lastPoint.lat])])
                        const lineFeature = new ol.Feature(lineGeom)

                        this.forecastFeatures.push(lineFeature)
                        forecastPts.forEach(point => {
                            const coord = ol.proj.fromLonLat([+point.lon, +point.lat])
                            const feature = new ol.Feature(new ol.geom.Point(coord))
                            const dateParts = /\d+-\d+-(\d+) (\d+)/.exec(point.bjdatetime).slice(1)
                            const dateString = `${dateParts[0]}日${dateParts[1]}时`

                            feature.set('dateString', dateString)
                            feature.set('waypointData', point)
                            feature.setStyle(forecastPointsStyleFunction)
                            lineGeom.appendCoordinate(coord)
                            this.forecastFeatures.push(feature)
                        })
                    }
                })
            } else {
                this.clearForcastImg()
            }
        },

        /**
         * 清除预报路径
         */
        clearForcastImg() {
            this.wms = lmap.layer.remove(lmap.map, this.wms);
            lmap.map.removeLayer(this.forecastLayer)
            this.forecastLayer = null
        },
        /**
         * 移动事件
         * @param {object} e ol事件返回数据
         */
        move(e) {
            if (this.bigScreen) e.pixel[1] += 5
            let feature = lmap.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                return feature;
            });
            if (!!feature && feature.get('name') === 'tsp') {
                const tsid = feature.get('tsid');
                const dataIndex = this.ts.live.indexOf(tsid);
                if (dataIndex !== -1) {
                    // const tsData = this.paths[tsid];
                    const tsData = this.paths.get(tsid);
                    const data = tsData[feature.get('type')].data[feature.get('index')];
                    const key = `${data.tsid}-${TU(data.bjdatetime).format('YYYYMMDDHHmmss')}`;
                    this.renderAirRing(data);
                    if (this.ts.box !== key) {
                        const pixel = lmap.map.getPixelFromCoordinate(feature.getGeometry().getCoordinates())

                        this.ts.box = key;
                        this.movePoint = {data, pixel} // movePoint一定是当前风圈的点
                        this.popupBox(data, pixel);
                    }
                }
            } else {
                if (!!this.callback) this.callback(null);
                this.ts.box = null;
                // this.activePoint = null;

                if (this.movePoint) {
                    const maxPixel = [this.movePoint.pixel[0] + 7, this.movePoint.pixel[1] + 7]
                    const minPixel = [this.movePoint.pixel[0] - 7, this.movePoint.pixel[1] - 7]
                    if ((minPixel[0] <= e.pixel[0] && e.pixel[0] <= maxPixel[0]) && (minPixel[1] <= e.pixel[1] && e.pixel[1] <= maxPixel[1])) {
                        this.popupBox(this.movePoint.data, this.movePoint.pixel)
                    }
                }
            }
        },

        /**
         * 点击事件
         */
        click(e) {
            // console.info(this.activePoint)
            if (!this.activePoint) return
            const maxPixel = [this.activePoint.pixelPosition[0] + 7, this.activePoint.pixelPosition[1] + 3]
            const minPixel = [this.activePoint.pixelPosition[0] - 7, this.activePoint.pixelPosition[1] - 10]
            if ((e.pixel[0] < minPixel[0]) || (e.pixel[0] > maxPixel[0]) || (e.pixel[1] < minPixel[1]) || (e.pixel[1] > maxPixel[1])) return
            // if (!this.activePoint) return;
            const id = this.activePoint.id;
            // const type = this.activePoint.type === null ? 'obs' : 'fst';
            const type = this.activePoint.type; // 后续去掉
            let rr = '';
            this.influenceCallback(rr, type, id, this.activePoint.tsid, this.activePoint.pointIndex);
        },

        simulateMoveAndClick(item) {
            this.renderAirRing(item);
            this.influenceCallback('', item.type, item.id, item.tsid);
        },

        /**
         * 弹窗
         * @param {object} data 台风点
         * @param {array} pixel 对应像素
         */
        popupBox(data, pixel) {
            data.pixelPosition = pixel;
            const { tsid, bjdatetime, lon, lat, windspeed, pressure, gust, direction, id, type, rr07, rr08, rr010, rr012, pixelPosition, pointIndex } = data;
            let windlevel = null;
            for (let i = 0; i < this.ts.levels.length; i++) {
                const [ min, max ] = this.ts.levels[i];
                if (windspeed >= min && windspeed < max) {
                    windlevel = i;
                    break;
                }
            };
            const popupData = {
                id,
                type,
                tsid,
                gust,
                pressure,
                direction,
                windspeed,
                windlevel,
                bjdatetime,
                pointIndex,
                rr07,
                rr08,
                rr010,
                rr012,
                pixelPosition,
                summary: data.summary,
                tscname: data.tscname,
                lon: Number(lon).toFixed(2),
                lat: Number(lat).toFixed(2)
            };
            this.activePoint = popupData;
            // this.updateParam([ 'popupTyphoon', { status: true, data: popupData, pixel: pixel } ]);
            if (!!this.callback) this.callback(popupData);
        }
    },

    mounted() {
        this.initConstData();
        // this.run();
    },

    destroyed() {
        this.clear();
        this.layer = lmap.layer.remove(lmap.map, this.layer);
        this.clearForcastImg()
        lmap.map.un('pointermove', this.move);
    }
};
