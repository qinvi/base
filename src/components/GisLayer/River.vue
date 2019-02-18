<template>
    <div>
        <v-RiverDetail :Detail="propData" v-if="!!propData.riverDetail" @close="close"></v-RiverDetail> <!--propData.riverDetail-->
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import riverDetail from '../PopupBox/River';
export default {
    name: 'River',
    components: {
        'v-RiverDetail': riverDetail
    },
    data() {
        return {
            propData: {
                riverDetail: null,
                rainDetail: null,
                infoDetail: null,
                both: 0
            }
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            sysTime: state => state.time.sysTime,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            removeSelectPoint: state => state.selectPoint.remove,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        sysTime() {
            this.render();
            this.updateDetail();
        },
        code(val) {
            this.render();
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.updateParam(['clickCallback', { RiverCallbak: this.carryDataAndStatus }]);
            this.urls = {
                image: sysconfig.TESTPATH + '/realTimeMonitor/getRiverLevelImage',
                detailRiver: sysconfig.TESTPATH + '/realTimeMonitor/getRiverLevelDetail',
                detailRain: sysconfig.TESTPATH + '/girdrain/getRain'
            };
            this.lastNotNull = null;
            this.timer = {};
            this.imageLayer = null;
            this.detailParams = null;
            this.activeCode = '';
        },

        /**
         * 获取图层参数
         */
        getImageParams() {
            return {
                url: this.urls.image,
                params: {
                    code: this.code,
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    zoom: lmap.util.getZoom(lmap.view)
                }
            }
        },

        getDetailParams() {
            return {
                code: this.code,
                dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                zoom: lmap.util.getZoom(lmap.view),
                poiType: 'river',
                type: 'all'
            }
        },

        /**
         * 渲染图层
         */
        render() {
            let param = this.getImageParams();
            if (!!this.layer) {
                lmap.image.updateWMS(this.layer, param, '');
            } else {
                this.layer = lmap.image.WMS(lmap.map, param, 'poi', '');
            }
        },

        click(e) {
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const { zoom, code, dateTime, poiType } = this.getDetailParams();
            let params = { lon, lat, zoom, code, dateTime, poiType };

            const clickIndex = this.getClickIndex();
            this.detailParams = params;
            utils.GET(this.urls.detailRiver, params).then((json) => {
                if (!utils.isEmptyObject(json.data)) this.clickPlugin('RiverCallbak', json.data, clickIndex); // 触发poi点击插件
            });
        },

        updateDetail() {
            if (!!this.detailParams) {
                this.detailParams.dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
                this.detailParams.code = this.code;
                utils.GET(this.urls.detailRiver, this.detailParams).then((json) => {
                    if (!utils.isEmptyObject(json.data)) this.clickPlugin('RiverCallbak', json.data, 'pass'); // 触发poi点击插件
                });
            }
        },

        /**
         * poi详情与高亮状态传送
         * @param {object} json 详情请求数据
         */
        carryDataAndStatus(data) {
            this.activeCode = data.code;
            this.clearTimer();
            this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: 'monitor&river' } ]); // 高亮poi
            const { dateTime, type } = this.getDetailParams();
            let params = { lon: data.lon, lat: data.lat, dateTime, type };
            utils.GET(this.urls.detailRain, params).then((json) => {
                this.packRainData(json.data);
            });
            if (!data.detailMap) {
                data.detailMap = {
                    level: '--',
                    warnLevel: '--',
                    stnm: '--',
                    riverName: '--',
                    basinName: '--',
                    address: '--',
                    updateTime: '--',
                    riverSystem: '--'
                }
            };
            this.packRiverData(data);
        },

        /**
         * 数据组装
         * @param {object} rainData 雨量变化源数据
         */
        packRainData(rainData) {
            const { past, future, max } = this.changeData(rainData);
            this.propData.rainDetail = {
                detail: {
                    height: 150,
                    xAxis: ['-24', '-3', '-1', '', '+1', '+3', '+24'],
                    showInLegend: false,
                    max: max
                },
                list: { past, future }
            };
            if ((this.propData.both + 1) === 2) {
                this.propData.both = 0;
                this.propData = Object.assign({}, this.propData, {});
            } else this.propData.both++;
        },

        changeData(data) {
            let {qpe, qpf, day} = data;
            const past1hour = this.returnChangeValue(qpe, 'rain01Hour');
            const past3hour = this.returnChangeValue(qpe, 'rain03Hour');
            const past24hour = this.returnChangeValue(qpe, 'rain24Hour');

            const future1hour = this.returnChangeValue(qpf, 'rain01Hour');
            const future3hour = this.returnChangeValue(qpf, 'rain03Hour');
            const future24hour = this.returnChangeValue(day, 'rain24Hour');
            const past = [ past24hour, past3hour, past1hour, '', '', '', '' ];
            const future = [ '', '', '', '', future1hour, future3hour, future24hour ];
            const maxArr = [ past24hour, past3hour, past1hour, future1hour, future3hour, future24hour ];
            const max = Math.max.apply(null, maxArr);
            return { past, future, max };
        },

        /**
         * 处理changeData的判断值
         * @param {objtct} data 处理的数据
         * @param {sring} pro 相应 处理的属性
         */
        returnChangeValue(data, pro) {
            return (!data.hasOwnProperty(pro) && !data.hasOwnProperty(pro)) ? '' : (data[pro] === 0 || data[pro] === 9999) ? '' : Math.round(parseFloat(data[pro]) * 100) / 100;
        },

        /**
         * 河流水位图表数据组装
         *
         * @param {object} data 河流水位源数据
         */
        packRiverData(data) {
            this.propData.infoDetail = data.detailMap;
            let pastArr = []; // 过去水位
            let futureArr = []; // 未来水位
            let levelArr = []; // 等级
            let dashData = []; // 虚线数据
            let warnlevel;
            if (data.detailMap.warnLevel !== '--') warnlevel = parseFloat(data.detailMap.warnLevel);
            else warnlevel = '--';
            let chartData = data.per24Level;
            let index = 0;
            chartData.reverse()
            chartData.forEach((ele) => {
                if (ele === null) index++
            });
            if (index !== chartData.length || chartData.length) {
                chartData.forEach((ele, i) => {
                    futureArr.push('');
                    pastArr.push('');
                    if (ele === null) {
                        ele = this.replaceNull(chartData, i);
                        levelArr.push('');
                    } else {
                        this.lastNotNull = ele;
                        levelArr.push(parseFloat(ele));
                    }
                });
            } else {
                pastArr = ['', '', '', '', '', '', '', '', '', '', '', ''];
                futureArr = ['', '', '', '', '', '', '', '', '', '', '', ''];
                levelArr = ['', '', '', '', '', '', '', '', '', '', '', ''];
                dashData = ['', '', '', '', '', '', '', '', '', '', '', ''];
            }
            const cid = 'river-charts';
            const [max, min] = this.getMaxMin(levelArr, warnlevel);
            const zone = (warnlevel === '--') ? undefined : warnlevel;
            const updatetime = data.detailMap.updateTime; // this.reservoir.list.updateTime;
            const noLevelData = chartData.every(item => item === null)
            let nowHour = Number(TU(this.sysTime).split().hour);
            let timeArr = [];

            for (let i = 0; i < chartData.length; i++) {
                timeArr.unshift(nowHour);
                nowHour = (nowHour - 1) <= 0 ? (nowHour - 1) + chartData.length : (nowHour - 1);
            }

            if (noLevelData) dashData = dashData.map(item => '')

            dashData = this.interpolateMissingValues(levelArr, warnlevel)
            const past = {
                name: '过去累计雨量(mm)',
                list: pastArr
            };
            const future = {
                name: '未来累计雨量(mm)',
                list: futureArr
            };
            const level = {
                name: '实测河流水位(m)',
                list: levelArr
            };
            const forecast = {
                name: '估测河流水位(m)',
                list: dashData
            }
            this.propData.riverDetail = { forecast, timeArr, zone, max, min, past, future, level, cid, warnlevel, updatetime };
            if ((this.propData.both + 1) === 2) {
                this.propData.both = 0;
                this.propData = Object.assign({}, this.propData, {});
            } else this.propData.both++;
        },

        /**
         * 获取图表y軕的max值和min值
         *
         * @param {array} level 等级数组
         * @param {nunmber} warn 预警值
         */
        getMaxMin(level, warn) {
            const warnLevel = Number(warn) || 0;
            const interval = 0.1;
            let copy = [...level];
            copy = copy.filter((a, b) => {
                return Object.prototype.toString.call(a) === '[object Number]';
            }).sort((a, b) => {
                return b - a;
            });
            if (!copy.length) {
                return [0, 0];
            }
            let maxmax = Number((copy[0] + interval).toFixed(2));
            let minin = Number((copy[copy.length - 1] - interval).toFixed(2));
            let max = 10;
            let min = 0;
            if (warnLevel > 0) { // 预警值大于0情况
                let warnHigh = Number((warnLevel + interval).toFixed(2));
                let warnLow = Number((warnLevel - interval).toFixed(2));
                max = maxmax > warnHigh ? maxmax : warnHigh; // y轴最大值
                min = minin < warnLow ? minin : warnLow;
            } else {
                max = maxmax; // y轴最大值
                min = minin;
            }
            return [max, min];
        },

        /**
         * 取代null值
         *
         * @param {string/null} i 待取代的值
         * @param {object} data 源数据
         */
        replaceNull(data, i) {
            let temp;
            if ((i + 1) >= data.length) return (temp = this.lastNotNull);
            else {
                temp = (!!data[i + 1] || data[i + 1] === 0) ? Number(data[i + 1]) : data[0];
                if (temp === null) return this.replaceNull(data, i + 1);
                else return temp;
            }
        },

        /**
         * 数据转换
         *
         * @param {string} val 待转换的值
         */
        format(val) {
            return (!val || Number(val) > 1000 || Number(val) < -1000 || val === 'null') ? null : Number(val);
        },

        /**
         * poi取消勾选
         */
        close() {
            this.removeSelectPoint('monitor', 'river');
            this.propData = {
                riverDetail: null,
                rainDetail: null,
                infoDetail: null,
                both: 0
            }
            this.detailParams = null
        },

        /*
         * 计算估测水位
         *
         * @param {number[]} dataArray 实测水位数据
         * @param {number} warningLevel 警戒水位
         */
        interpolateMissingValues: function (dataArray, warningLevel) {
            let interpolatedValues = []

            dataArray = dataArray.map(data => data === '' ? null : data)
            // 全部为空则返回true;
            if (!dataArray.every(item => item === null)) {
                let segStartIdx = -1
                let segEndIdx = -1
                let segment = []
                let segStartLevel
                let segEndLevel
                let continuousData = []
                dataArray.forEach((level, idx) => {
                    if (level === null) {
                        if (segStartIdx < 0) {
                            let prevLevel = null

                            if (segment.length > 0) {
                                segment = []
                                prevLevel = dataArray[idx - 1]

                                if (continuousData.length > 0) {
                                    segment.unshift({ x: idx - 1, y: prevLevel })
                                }

                                segStartLevel = level
                                segStartIdx = idx - 1
                            } else if (continuousData.length > 0) {
                                segment = []
                                prevLevel = dataArray[idx - 1]
                                segment.unshift({ x: idx - 1, y: prevLevel })
                                segStartLevel = level
                                segStartIdx = idx - 1
                            }

                            segStartIdx = prevLevel !== null ? idx - 1 : idx
                            segStartLevel = prevLevel !== null ? prevLevel : level

                            if (idx < dataArray.length - 1) {
                                segment.push({ x: idx, y: level })
                            }
                        } else {
                            segment.push({ x: idx, y: level })
                        }

                        continuousData = []
                    }

                    if (level !== null || idx >= dataArray.length - 1) {
                        continuousData.push([idx, level])
                        if (segStartIdx >= 0) {
                            segEndIdx = idx
                            segEndLevel = level
                            segment.push({ x: idx, y: level })

                            if (segment[0].y === null) {
                                segment.forEach((item) => {
                                    item.y = segEndLevel
                                })
                            } else if (segment[segment.length - 1].y === null) {
                                segment.forEach((item) => {
                                    item.y = segStartLevel
                                })
                            } else {
                                const step = (segEndLevel - segStartLevel) / (segEndIdx - segStartIdx)
                                let currentLevel = segStartLevel

                                segment.forEach((item, idx) => {
                                    if (idx !== 0 && idx !== segment.length - 1) {
                                        item.y = +currentLevel.toFixed(2)
                                    }

                                    currentLevel += step
                                })
                            }
                            // 重复取点时去掉一个
                            if (interpolatedValues.length > 0 && interpolatedValues[interpolatedValues.length - 1].x === segment[0].x) {
                                interpolatedValues.pop();
                            }
                            interpolatedValues = interpolatedValues.concat(segment)
                            segStartIdx = -1
                        }
                    }
                })
                const dashIndices = interpolatedValues.map(item => item.x)

                dataArray.forEach((level, idx) => {
                    if (!dashIndices.includes(idx)) {
                        interpolatedValues.splice(idx, 0, { x: idx, y: null })
                    }

                    if (level !== null) {
                        interpolatedValues.forEach((item) => {
                            if (item.x === idx) {
                                item.c_hidden = true
                            }
                        })
                    }
                })

                interpolatedValues.forEach((value) => {
                    if (value.y >= warningLevel) {
                        value.marker = {
                            lineColor: '#f00'
                        }
                    }
                })
            } else {
                interpolatedValues = []
            }

            return interpolatedValues
        }
    },
    mounted() {
        lmap.map.on('singleclick', this.click);
        this.initConstData();
        this.render();
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.layer);
        this.close();
    }
}
</script>
