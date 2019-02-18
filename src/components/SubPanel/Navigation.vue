<template>
    <div class="navigation hover">
        <ul class="location clearfix" :class="[ loading ? '' : 'loadingShow' ]">
            <li class="location-item" @click="initHandle('start')">
                <i class="icon-location"></i>
                <span class="input" :title="info.start">{{ info.start }}</span>
            </li>
            <li class="location-item none-border"></li>
            <li class="location-item" @click="initHandle('end')">
                <i class="icon-location"></i>
                <span class="input" :title="info.end">{{ info.end }}</span>
            </li>
            <li class="route-start location-item" @click="drawRoad()">
                <i class="icon-location-arrow" style="padding-right: 5px"></i>
                <span>路线规划</span>
            </li>
            <!-- <div data-loader="circle" class="loading" v-show="loading"></div> -->
        </ul>
        <div v-show="loading" class="cel">
            <div class="route">
                <ul>
                    <li v-for="(item, index) of ways" :class="{ unselect: item.status }" :key="index">
                        <input :name="navigationName + 'ways'" class="radio" type="radio" :id="'route-' + navigationName + '-' + index" :checked="item.status && 'checked'" :disabled="!item.status && 'disabled'"/> <!--:disabled="item.status && 'disabled'"-->
                        <label :for="'route-' + navigationName + index">{{ item.text }}</label>
                    </li>
                </ul>
            </div>
            <div class="route-info">
                <div class="tip">
                    <label>{{ route.time }}</label><label>{{ route.long }}</label><label :title="route.via">{{ route.via }}</label>
                </div>
                <p>交通实况气象条件：暂无</p>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
    name: 'Navigation',
    props: [ 'navigationName' ],
    data() {
        return {
            info: { start: null, end: null },
            loading: false,
            route: {},
            ways: [
                { text: '最短路径', status: true },
                { text: '备选路径', status: false }
            ]
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            type: state => state.model.type,
            param: state => state.model.param,
            code: state => state.sys.code,
            liPendingPool: state => state.loadingIndicator.pendingPool,
            alerts: state => state.globalAlerts.alerts
        })
    },
    watch: {

    },
    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认参数
         */
        initConstData() {
            // 画笔 - 集合
            this.drawParam = null;

            // 画笔 - 修改画笔
            this.modify = null;

            // 画笔 - 对象
            this.handle = null;

            // 起点、终点坐标
            this.lonlats = {
                start: null,
                end: null
            }

            // 默认提示
            this.defaultInfo = {
                start: '点击在地图选择起点',
                end: '点击在地图选择终点'
            }

            // 接口URL
            this.urls = {
                getRoadName: sysconfig.TESTPATH + '/atwill/getRoadName',
                getShortPath: sysconfig.TESTPATH + '/atwill/getShortCut',
                getPollutantPath: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelGeomPath'
            }

            // 图标信息
            this.getLogo = function(name) {
                return {
                    isIcon: true,
                    icon: {
                        src: `${sysconfig.TESTIP}/topic/little/toolbar/${name}.png`,
                        anchor: [0.5, 1],
                        size: [25, 41],
                        scale: 1
                    }
                }
            }

            // 路线图层
            this.road = lmap.layer.init(lmap.map, 'drawImpact');

            this.timestamps = {
                pathDrawing: null
            }
        },

        /**
         * 初始化起点终点
         * @param {string} name 类型
         */
        initHandle(name) {
            if (name === 'start') this.lonlats.start = null
            if (name === 'end') this.lonlats.end = null

            if (this.lonlats.start === null && this.lonlats.end === null) {
                this.timestamps.pathDrawing = null
                lmap.icon.clear(this.road);
            }

            this.cancelHandle();
            if (!this.drawParam) {
                this.initLayer();
            }
            if (!!this.drawParam.layer) {
                lmap.icon.clearOne(this.drawParam.layer, 'name', name);
                this.info[name] = this.defaultInfo[name];
            }
            lmap.icon.clearType(this.drawParam.layer, 'line');
            let event = {
                end: (e) => this.end(e.feature)
            }
            let eventParam = { map: lmap.map, data: { name: name } };
            this.handle = lmap.draw.initHandle(this.drawParam, 'point', event, eventParam, this.getLogo(name));
        },

        /**
         * 画笔结束回调事件
         * @param {object} feature 要素对象
         */
        end(feature) {
            let name = feature.get('name');
            let style = this.getLogo(name);
            feature.set('style', style);
            feature.setStyle(lmap.style.getStyle(style));
            this.lonlats[name] = feature.getGeometry().clone().transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION).getCoordinates();
            this.getRoadName(this.lonlats[name].join(' '), name);
            if (name === 'start') {
                if (!this.lonlats.end) {
                    this.initHandle('end');
                } else {
                    this.cancelHandle();
                    this.drawRoad();
                }
            } else {
                this.cancelHandle();
                this.drawRoad();
            }
        },

        /**
         * 取消画笔
         * @param {object} feature 要素对象
         */
        cancelHandle() {
            if (!!this.handle) {
                lmap.draw.cancel(lmap.map, this.handle);
                this.handle = null;
            }
        },

        /**
         * 获取路名
         * @param {array} lonlat 经纬度
         * @param {string} name 点类型
         */
        getRoadName(lonlat, name) {
            const param = { code: this.code, lonlat, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') };
            utils.GET(this.urls.getRoadName, param).then((json) => {
                const status = !!Object.keys(json.data)[0] && json.data.fullAddress !== '';
                this.info[name] = status ? json.data.fullAddress : '未知';
            });
        },

        /**
         * 路线渲染
         */
        drawRoad() {
            if (!!this.lonlats.start && !!this.lonlats.end) {
                lmap.icon.clear(this.road);
                this.loading = false;
                if (this.type === 'pollutantDispersion') this.getPollutionRoadData(this.urls.getPollutantPath, this.drawRoatWKT);
                else this.getRoadData(this.urls.getShortPath, this.drawRoatWKT);
            } else {
                this.alerts.push({ type: 'warning', message: '请先选择起始点' })
            }
        },
        getPollutionRoadData() {
            let [url, callback] = Array.from(arguments);
            const startPoint = `${this.lonlats.start.join(',')}`;
            const endPoint = `${this.lonlats.end.join(',')}`;
            let {levels, modelType, code, dateTime} = this.param;
            const timestamp = Date.now()

            this.timestamps.pathDrawing = timestamp
            this.liPendingPool.push({ id: 'pollutant-path' })
            utils.GET(url, {startPoint, endPoint, dateTime, code, levels, modelType}).then((json) => {
                if (json.status !== 500) {
                    let data = JSON.parse(json.data.data);

                    if (+data.status === 2) {
                        this.updateParam(['sysTip', {
                            status: true,
                            text: '起点/终点在污染范围内，无法避开，请重新选择起点/终点',
                            type: 'error'
                        }])
                        throw new Error('DISCARD')
                    }

                    this.loading = true;
                    let {pathName, pointList, time, totalLength} = data;
                    this.route = { time: time, via: pathName.join('、'), long: totalLength };
                    const wkt = pointList.map((item) => {
                        return item.multiLineString;
                    });
                    callback(wkt, timestamp);
                }

                this.updateParam(['loadingIndicator', { sigCancel: 'pollutant-path' }])
            }).catch((ex) => {
                this.updateParam(['loadingIndicator', { sigCancel: 'pollutant-path' }])
            })
        },
        getRoadData() {
            let [url, callback] = Array.from(arguments);
            const slonlat = `${this.lonlats.start.join(' ')}`;
            const elonlat = `${this.lonlats.end.join(' ')}`;
            const param = { slonlat, elonlat, code: this.code, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') };
            const timestamp = Date.now()

            this.timestamps.pathDrawing = timestamp
            utils.GET(url, param).then((json) => {
                if (json.status !== 500) {
                    this.loading = true;
                    let data = json.data.linestring;
                    this.route = { time: json.data.costTime, via: json.data.roadName, long: json.data.length };
                    callback(data, timestamp);
                }
            })
        },
        drawRoatWKT(data, timestamp) {
            let border = { stroke: { color: '#ffffff', width: 6 } };
            let fill = { stroke: { color: '#00a8ff', width: 3 } };
            let style = lmap.style.getStyles([ border, fill ]);
            if (!!data && Array.isArray(data)) {
                data.forEach((item, index) => {
                    let feature = lmap.polygon.addWKT(item)[0];
                    feature.set('line', 'line');
                    feature.setStyle(style);
                    ((index, that) => {
                        window.setTimeout(() => {
                            if (timestamp !== this.timestamps.pathDrawing) return
                            that.road.getSource().addFeature(feature);
                        }, 50 * index)
                    })(index, this);
                })
            }
        },
        offsetLonLat(lineStr) {
            // lineStr = lineStr.replace('LINESTRING(', '').replace(')', '');
            // const lonlats = lineStr.split(',');
            // let newLineStr = 'LINESTRING(';
            // for (const lonlat of lonlats) {
            //     const [ lon, lat ] = lonlat.split(' ');
            //     newLineStr += ((lon - 0.0063) + ' ' + (lat - 0.0063) + ',');
            // }
            // newLineStr = newLineStr.substring(0, newLineStr.length - 1) + ')';
            return lineStr;
        },

        /**
         * 初始化图层
         */
        initLayer() {
            const drawParam = lmap.layer.initDrawParam(lmap.map, 'drawImpact');
            const event = {
                end: (e) => {
                    const features = e.features.getArray();
                    for (const feature of features) {
                        const name = feature.get('name');
                        this.lonlats[name] = feature.getGeometry().clone().transform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION).getCoordinates();
                        this.getRoadName(this.lonlats[name].join(' '), name);
                    }
                    this.drawRoad();
                }
            }
            this.modify = lmap.draw.initModify(drawParam, event);
            this.drawParam = drawParam;
        },

        /**
         * 删除图层
         */
        remove() {
            this.cancelHandle();
            if (!!this.drawParam) {
                lmap.map.removeLayer(this.drawParam.layer);
            }
            if (!!this.road) {
                lmap.map.removeLayer(this.road);
            }
            lmap.draw.cancel(lmap.map, this.modify);
        }

        // testBezier() {
        //     /* eslint-disable */
        //     function bezier(lineStrArr) {
        //         const line = turf.lineString(lineStrArr);
        //         const curved = turf.bezierSpline(line, { resolution: 1000000, sharpness: 1 });
        //         return curved;
        //     }

        //     const test = 'MULTIPOLYGON(((112.43488372093 24.1719298245614,112.437706552681 24.2390464187925,112.450871046892 24.2957396340426,112.474214546426 24.3419371866655,112.50505213183 24.3793676710965,112.541039708198 24.4080738130097,112.579869482779 24.4264822857928,112.618475820354 24.4326396784562,112.652818404797 24.4255208333333,112.678363321972 24.4059534665027,112.690961551372 24.3769449476234,112.687781506549 24.3432557597663,112.668133447337 24.3101011008547,112.634267204311 24.2809881496018,112.592361767356 24.2549717295245,112.571708429034 24.240948312862,112.553779609342 24.2240446999805,112.540973202575 24.2019523144928,112.536046511628 24.1719298245614,112.43488372093 24.1719298245614)))';

        //     const wktFeat = lmap.polygon.addWKT(test)[0];
        //     wktFeat.setStyle(lmap.style.getStyles([ { stroke: { color: '#1f7ed0', width: 3 } } ]));
        //     this.road.getSource().addFeature(wktFeat);

        //     let lineStrArr = [];
        //     const linePoints = test.replace('MULTIPOLYGON(((', '').replace(')))', '').split(',');
        //     for (const point of linePoints) {
        //         const [ lon, lat ] = point.split(' ');
        //         lineStrArr.push([ Number(lon), Number(lat) ]);
        //     }

        //     let curved = bezier(lineStrArr);
        //     const count = 1;
        //     for (let i = 0; i < count; i++) {
        //         curved = bezier(curved.geometry.coordinates);
        //     }

        //     const geoJsonFeat = lmap.polygon.addGeoJson(curved)[0];
        //     geoJsonFeat.setStyle(lmap.style.getStyles([ { stroke: { color: '#92d01f', width: 3 } } ]));
        //     this.road.getSource().addFeature(geoJsonFeat);

        // }

    },
    mounted() {

        this.initConstData();
        this.info = Object.assign({}, this.defaultInfo);
        this.initHandle('start');

        // this.testBezier();

    },
    destroyed() {
        this.remove();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.app-right .navigation {
    position: absolute;
}

.navigation {
    top: @top-normal;
    right: -5px;
    width: 413px;
    z-index: @panel-index;
    background: #fff;
    box-shadow: @shadow;
    .location {
        // height: 100%;
        // overflow: hidden;
        .location-item {
            position: relative;
            float: left;
            margin: 5px;
            // padding: 5px;
            border: 1px solid #bbb;
            border-radius: 4px;
            text-align: left;
            i {
                position: absolute;
                top: 50%;
                left: 6px;
                transform: translateY(-50%);
                font-size: 14px;
                color: #4f4f4f;
            }
            &.none-border {
                border: none;
                padding: 2px 0;
                margin: 0;
                &::before {
                    content: "➡";
                    font-size: 18px;
                }
            }
            span {
                text-indent: 20px;
                line-height: 24px;
                display: block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .input {
                width: 140px;
            }
            &.route-start {
                text-align: left;
                span {
                    width: 74px;
                }
                i {
                    // position: relative;
                    // bottom: 2px;
                }
            }
            & > div.loading {
                position: relative;
                top: 1px;
                right: 1px;
                border: 2px solid #bbb;
                border-top-color: transparent;
                border-radius: 100%;
                display: inline-block;
                width: 8px;
                height: 8px;
            }
        }
    }
    .cel {
        display: flex;
        height: 64px;
        .route {
            flex: 1 4 90px;
        }
        .route-info {
            flex: 4 1 320px;
            .tip {
                height: 32px;
            }
        }
    }
    .route {
        width: 80px;
        li {
            height: 30px;
            line-height: 30px;
        }
        .unselect {
            border-top: 1px solid #bbb;
            border-right: 1px solid #bbb;
            border-bottom: 1px solid #bbb;
            background-color: @title-color;
        }
        // .radio + label::after {
        //     top: 12px;
        // }
    }
    .route-info {
        text-align: left;
        margin-left: 5px;
        label {
            padding: 5px;
            height: 20px;
            line-height: 20px;
            display: inline-block;
            overflow: hidden;
            color: @select-font-color;
            border: 1px solid transparent;
            &::after {
                content: '';
                display: inline-block;
                width: 1px;
                height: 12px;
                background: #ccc;
                margin-left: 8px;
                vertical-align: middle;
                margin-top: -2px;
            }
            &:nth-child(3) {
                width: 160px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
        p {
            margin: 0 0 0 5px;
            height: 30px;
            line-height: 30px;
            // position: relative;
            // bottom: 9px;
        }
    }
}
.model-analysis-out {
    .navigation.hover {
        width: 100%;
    };
    .location {
        position: relative;
        &.loadingShow {
            bottom: 0px;
        }
        &:not(.loadingShow) {
            top: 61px;
        }
    }
    .cel {
        position: relative;
        top: -36px;
    }
    .route .unselect {
        border-top: none;
    }
}
.big {
    .navigation {
        top: @top-big;
        width: 540px;
        .location {
            .location-item {
                span {
                    .height-big();
                }
                .input {
                    width: 180px;
                }
                &.route-start {
                    span {
                        width: 110px;
                    }
                }
                &.none-border {
                    .height-big();
                }
                i {
                    font-size: 18px;
                    top: 54%;
                    left: 3px;
                }
            }
        }

        .route {
            li {
                .height-big();
            }
        }

        .cel {
            height: 76px;
        }

        .route-info {
            .tip {
                height: 38px;
            }
            p {
                height: 36px;
                line-height: 36px;
            }
            label {
                height: 26px;
                line-height: 26px;
            }
        }

        .radio:checked + label::after {
            top: 10px;
        }

    }

    .model-analysis-out {
        .cel {
            top: -48px;
        }
        .location {
            &:not(.loadingShow) {
                top: 72px;
            }
        }
    }
}
</style>
