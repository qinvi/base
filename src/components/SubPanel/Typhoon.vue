<template>
    <div class="typhoon" v-show="panelStatus">
        <div class="list">
            <div v-show="loading" class="loading loading-default is-active"></div>
            <a class="close" @click="close()"></a>
            <table>
                <thead>
                    <tr>
                        <td>台风</td>
                        <td>编号</td>
                        <td>中文名</td>
                        <td>英文名</td>
                        <td>
                            定位
                            <span :class="[moreOrless['typhoonList'] ? 'more moreOrless' : 'less moreOrless']" @click="toggle('typhoonList')"></span>
                        </td>
                    </tr>
                </thead>
            </table>
            <div id="typhoon-list" class="tbody">
                <table>
                    <tbody>
                        <tr v-for="(item, index) of typhoon.data" :key="index" v-show="showTimeList(item, index)" @click.stop="select(item, index), triggerType = 'manMade'">
                            <td>
                                <input type="checkbox" class="checkbox" name="tsId" :id="item.tsid" :value="item.tsid" v-model="typhoon.select"/>
                                <label :for="item.tsid" @click.stop></label>
                            </td>
                            <td>{{ item.inilid }}</td>
                            <td>{{ item.tscname }}</td>
                            <td>{{ item.tsename }}</td>
                            <td @click.stop="location(item)">定位</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="point-info">
            <div class="s-title">
                <span>路径信息</span>
                <span>({{ roadInfo.points[roadInfo.cur].inilid }}{{ roadInfo.points[roadInfo.cur].tscname }})</span>
                <span>*红色表示预报路径*</span>
                <div :class="[moreOrless['roadList'] ? 'more moreOrless' : 'less moreOrless']" @click="toggle('roadList')"></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <td>时间</td>
                        <td>气压(hpa)</td>
                        <td>风速(m/s)</td>
                    </tr>
                </thead>
            </table>
            <div id="typhoon-roads" class="tbody">
                <table>
                    <tbody>
                        <tr v-for="(item, index) of roadInfo.points[roadInfo.cur].points" :key="index" v-show="moreOrless['roadList'] || (index < 3)" :class="[item.type === 'fst' ? 'tyFst' : '', index === roadInfo.listIndex ? 'roadHighlight' : '']" @click="goToList(item, index)">
                            <td>{{ item.bjdatetime }}</td>
                            <td>{{ item.pressure }}</td>
                            <td>{{ item.windspeed }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="analysis-range">
            <div class="s-title">
                <span>影响范围</span>
                <div :class="[moreOrless['influence'] ? 'more moreOrless' : 'less moreOrless']" @click="toggle('influence')"></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <td>序号</td>
                        <td>影响范围</td>
                        <td>归属区域</td>
                        <td class="circleHover">
                            {{ ringName }}
                            <div>
                                <ul>
                                    <li v-for="(item, index) in tyCircleList" :key="index" @click="influenceRange(item.type)">{{item.name}}</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </thead>
            </table>
            <div id="typhoon-influence" class="tbody">
                <table>
                    <tbody>
                        <tr v-for="(item, index) in influence.city" :key="index" v-show="moreOrless['influence'] || (index < 3)">
                            <td>{{ index + 1}}</td>
                            <td>{{ item.areaName }}</td>
                            <td>{{ item.parentAreaName }}</td>
                            <td>{{ conputeCircle(item.rr) }}</td>
                        </tr>
                        <div class="noData" v-show="!influence.city.length">暂无影响区域</div>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="city-ranging">
            <div class="s-title">
                <span>城市测距(km)</span>
                <div :class="[moreOrless['distance'] ? 'more moreOrless' : 'less moreOrless']" @click="toggle('distance')"></div>
            </div>
            <table>
                <thead>
                    <tr><td>城市名称</td><td>测距(千米)</td></tr>
                </thead>
            </table>
            <div id="typhoon-distance" class="tbody">
                <table>
                    <tbody>
                        <tr v-for="(item, index) in distance.data" :key="index" v-show="moreOrless['distance'] || (index < 3)">
                            <td>{{item.areaName}}</td>
                            <td>{{item.distance}}</td>
                        </tr>
                        <div class="noData" v-show="!distance.data.length">暂无测距信息</div>
                    </tbody>
                </table>
            </div>
        </div>
        <v-layer></v-layer>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              Typhoon list
 * ----------------------------------------------------------------------------
 * close                    - 关闭
 * initConstData            - 初始化默认参数
 * list                     - 台风列表生成
 * obs                      - 获取实况数据
 * popUpInilid              - 返回台风的inilid
 * influenceRange           - 影响范围
 * packRoad                 - 路径信息组装
 * changeData               - 数据组装、后续可cut掉
 * select                   - 勾选、取消勾选
 * location                 - 定位
 * toggle                   - 台风列表的moreorless
 * newPsScroller            - 初始化scroller
 * cityDistance             - 获取城市测距
 * pathOutofTime            - 清除所勾选的不在时间轴内的台风
 * showTimeList             - 根据时间筛选台风列表
 * changePointOfRoad        - 时间轴变化，动态改变相应路径信息
 * carryDataAndStatus       - 台风路径点点击
 * conputeCircle            - 返回风圈中文名
 * goToList                 - 跳到相应list:（路径信息）
 */
import { mapActions, mapState } from 'vuex';
import Layer from '../GisLayer/Typhoon.js';
import IScroll from 'iscroll';
// import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

// import tempTSD from '../../../static/typhoon/tsData.js'

export default {
    name: 'Typhoon-Panel',
    components: { 'v-layer': Layer },
    data() {
        return {
            panelStatus: true,
            loading: false,
            typhoon: {
                data: [],
                select: [],
                paths: new Map(),
                initSelect: 0 // 初始化的默认勾选
            },
            roadInfo: { // 路径信息
                cur: '****',
                points: {
                    '****': { inilid: '****', tscname: '' }
                },
                listIndex: -1,
                validTyName: [] // 有路径的台风tsid

            },
            moreOrless: { // 展开/收缩
                typhoonList: false, // true:展开列表
                roadList: false, // 路径展开
                influence: false, // 影响范围
                distance: false // 测距
            },
            influence: { // 风圈影响范围
                id: '',
                tyObject: '',
                tsid: '',
                city: [],
                county: [],
                town: []
            },
            distance: { // 测距信息
                tsid: '',
                data: []
            },
            selectEdTyphoon: {},
            ringName: '风圈选择'
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex, // 获取click事件处理下标
            listToPoint: state => state.typhoon.listToPoint,
            timePlay: state => state.time.play,
            clearLayer: state => state.typhoon.clear,
            bigScreen: state => state.toolsBar.bigScreen
        }),
        typhoonTips() {
            const roadInfo = this.roadInfo;
            let point = null;
            let param = null;
            if (roadInfo.cur === '****') {
                param = { status: false };
                // this.updateParam(['tip', {typhoon: {status: false}}]);
            } else {
                roadInfo.points[roadInfo.cur].points.every((ele) => {
                    point = ele;
                    return (ele.type === 'fst');
                });
                const name = this.tyLevel[point.trank] ? this.tyLevel[point.trank] : '超强台风';
                param = {
                    status: true,
                    name: name + '：' + point.tscname + '(' + point.tsename + ')',
                    time: point.bjdatetime,
                    center: (+point.lon).toFixed(2) + '°E，' + (+point.lat).toFixed(2) + '°N',
                    wind: point.windspeed + '米/秒 ' + point.pressure + '百帕',
                    radius: ''
                };
            }
            return param;
        }
    },
    watch: {
        timePlay(val) {
            // 上一步动，现在停
            if (this.lastTimePlay && !val) this.clear()
            this.lastTimePlay = val
        },
        typhoonTips() {
            if (this.typhoonTips) this.updateParam([ 'tip', { typhoon: this.typhoonTips } ]);
        },
        sysTime(val, prevVal) {
            try {
                const dateParts = [val.getFullYear(), val.getMonth(), val.getDate(), val.getHours()]
                const prevDateParts = [prevVal.getFullYear(), prevVal.getMonth(), prevVal.getDate(), prevVal.getHours()]
                const timeChanged = dateParts.some((part, index) => {
                    return part !== prevDateParts[index]
                })
                if (timeChanged) {
                    this.triggerType = 'time'
                    this.list();
                }
            } catch (e) {
                this.list();
            }
        },
        'typhoon.paths'(data) {
            this.updateParam([ 'typhoon', { paths: data, triggerType: this.triggerType } ]);
        },
        bigScreen() {
            this.setScroll();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 关闭
         */
        close() {
            this.panelStatus = false;
        },

        /**
         * 清除所有定时器
         */
        clear() {
            utils.clearTimer(this.timer.delayTimer)
            utils.clearTimer(this.timer.updateTimer)
        },

        /**
         * 根据时间筛选台风列表
         * @param {object} item 台风列表项
         * @param {number} index 台风下标
         */
        showTimeList(item, index) {
            // console.info(index, this.typhoon.initSelect)
            let t = (TU(item.crtime).format('YYYYMMDDHHmmss') <= TU(this.sysTime).format('YYYYMMDDHHmmss')) && (this.moreOrless['typhoonList'] || (index === this.typhoon.initSelect));
            return t;
        },

        /**
         * 控制面板打开
         */
        showPanel() {
            this.panelStatus = true;
        },

        /**
         * 返回风圈中文名
         * @param {string} type 风圈类型
         */
        conputeCircle(type) {
            let name;
            this.tyCircleList.every(ele => {
                if (ele.type === type) name = ele.name;
                return (ele.type !== type);
            });
            return name;
        },

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.updateParam(['clickCallback', { TyphoonCallback: this.carryDataAndStatus }]);
            this.updateParam([ 'typhoon', { influenceCallback: this.influenceRange } ]);
            this.updateParam([ 'typhoon', { inilidCallback: this.popUpInilid } ]);
            this.updateParam([ 'typhoon', { panelCallback: this.showPanel } ]);
            this.lastTimePlay = this.timePlay
            this.tyCircleList = [
                { name: '6级风圈', type: '06' },
                { name: '7级风圈', type: '07' },
                { name: '8级风圈', type: '08' },
                { name: '10级风圈', type: '10' },
                { name: '12级风圈', type: '12' },
                { name: '全部风圈', type: '' }
            ];
            this.tyLevel = { 'TD': '热带低压(TD)', 'TS': '热带风暴(TS)', 'STS': '强热带风暴(STS)', 'TY': '台风(TY)', 'STY': '强台风(STY)' };
            this.scrollers = [];
            this.urls = {
                list: sysconfig.TESTPATH + '/realTimeMonitor/listTyphoonInfo', // sysconfig.ONLINEPATH
                obs: sysconfig.TESTPATH + '/realTimeMonitor/getTyphoonObsInfo',
                city: sysconfig.TESTPATH + '/realTimeMonitor/getTyphoonCity',
                distance: sysconfig.TESTPATH + '/realTimeMonitor/listTyphoonCityDistance' // id=a46ec918-cd5e-4124-aaa8-9380658f5b65
            };
            this.triggerType = 'time'
            this.timer = { delayTimer: null, updateTimer: null, typhoonTimer: null };
        },

        /**
         * 台风列表生成
         */
        list() {
            this.typhoon.initSelect = 0;
            this.loading = true;
            // const queryTime = this.sysTime.getTime();
            const queryTime = TU(new Date(this.sysTime.getTime())).format('YYYYMMDDHH');
            const param = { code: this.code, limit: 300, dateTime: TU().format('YYYY-MM-DD HH:mm:ss') };
            this.changePointOfRoad();
            utils.GET(this.urls.list, param).then((json) => {
                json = json.data.typhoonList;
                json.map(function(data) {
                    data.status = false;
                    return data;
                });
                this.typhoon.data = json;

                let hasActiveTyphoon = false
                let selectIndex = true
                json.forEach((typhoon, i) => {
                    if (!typhoon.bjtime) {
                        return
                    }
                    if (selectIndex) this.typhoon.initSelect = i
                    selectIndex = false
                    const startTime = TU(typhoon.crtime).format('YYYYMMDDHH')
                    // 在判断活跃状态时将台风最新时间后移N小时
                    const latestTime = TU(typhoon.bjtime).hour(3).format('YYYYMMDDHH')

                    if (startTime <= queryTime && latestTime >= queryTime) {
                        hasActiveTyphoon = true
                        this.moreOrless['typhoonList'] = false;
                        this.typhoon.initSelect = i; // 初始化的勾选
                        // 切换时间的自动勾选实质是先删除，再重新勾选
                        // 现在改为不用先删除，直接再勾选
                        if (this.typhoon.select.includes(typhoon.tsid)) {
                            // this.select(json[i], i);
                        }
                        // 勾选新的台风，更新已有台风
                        this.select(json[i], i, true); // 切换时间自动勾选
                    }
                })

                if (!hasActiveTyphoon) {
                    this.updateParam(['sysTip', { status: true, text: '当前时间无活跃台风', type: 'info' }])
                }
                this.pathOutofTime(queryTime); // 切换时间cut掉不在时间内的已勾选的台风
                this.loading = false;
                // this.select(this.typhoon.data[0]);
            });
        },

        /**
         * 获取实况数据
         *
         * @param {object} item 相应台风的数据
         * @param {string} upDate 是否自动更新台风路径
         * @param {number} updatTyIndex
         */
        obs(item, upDate = '', updatTyIndex) {
            return new Promise((resolve, reject) => {
                // utils.clearTimer(this.timer.delayTimer);
                this.timer.delayTimer = window.setTimeout(() => {
                    // this.loading = true;
                    const [ width, height ] = lmap.map.getSize();
                    // dateTime = upDate ? TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') : '2040-12-31 23:00:00';
                    const param = { code: this.code, zoom: lmap.util.getZoom(lmap.view), BBOX: lmap.util.getExtent(lmap.map, true).join(','), tsId: item.tsid, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'), is_distance: 0, width, height, CRS: sysconfig.SYSTEM_PROJECTION };
                    utils.GET(this.urls.obs, param).then((json) => {
                        // json = tempTSD[item.tsid];
                        json = json.data;
                        json.inilid = item.inilid;
                        json.index = item.index;
                        let tsData;
                        if (!utils.isEmptyArray(json.obs)) {
                            tsData = this.changeData(json, item.tscname || '未命名', item.tsename, item.tsid);
                            if (!upDate) this.packRoad(tsData);
                        } else {
                            tsData = this.changeData(json, item.tscname || '未命名', item.tsename, item.tsid, false);
                            this.roadInfo.cur = '****';
                            this.roadInfo.points['****'].inilid = '****';
                        }
                        if (upDate) {
                            this.typhoon.paths[updatTyIndex] = tsData;
                            this.typhoon.paths = Object.assign([], this.typhoon.paths, []);
                            this.packRoad(tsData, tsData.tsid);
                        } else {
                            // this.typhoon.paths.push(tsData);
                            // this.typhoon.paths[tsData.tsid] = tsData;
                            this.typhoon.paths.set(tsData.tsid, tsData)
                        }
                        // this.loading = false;
                        this.roadInfo = Object.assign({}, this.roadInfo, {});
                        this.typhoon.paths = Object.assign(new Map(this.typhoon.paths), this.typhoon.paths)
                    });
                }, 80);
                if (!!resolve) resolve(); // 去执行返回promise对象
            });
        },

        /**
         * 返回台风的inilid
         *
         * @param {string} tsid 台风的tsid
         */
        popUpInilid(tsid) {
            return this.roadInfo.points[tsid].inilid;
        },

        /**
         * 影响范围
         *
         * @param {string} rr 风圈类型
         * @param {string} tyObject point类型
         * @param {string} id 相应point点的id
         * @param {string} tsid 台风tsid
         * @param {number} pointIndex 台风point点的下标
         */
        influenceRange(rr, tyObject, id, tsid, pointIndex) {
            let i = 0;
            this.tyCircleList.every((ele, index) => {
                i = index;
                return (ele.type !== rr);
            });
            this.ringName = this.tyCircleList[i].name;
            // document.getElementById('typhoon-influence').classList = ['ps'];
            // document.getElementById('typhoon-roads').classList = ['ps']; // 初始化滚轴
            if (!id) {
                id = this.influence.id;
                tyObject = this.influence.tyObject;
                tsid = this.influence.tsid;
            }
            if (id) {
                this.roadInfo.cur = tsid;
                this.goToList('', pointIndex);
                utils.GET(this.urls.city, {rr, id, tyObject, code: this.code, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss')}).then((json) => {
                    json.data.id = id;
                    json.data.tyObject = tyObject;
                    json.data.tsid = tsid;
                    this.clickPlugin('TyphoonCallback', json.data, this.getClickIndex()); // 触发poi点击插件
                });
                this.roadInfo = Object.assign({}, this.roadInfo, {});
            }
        },

        /**
         * 台风路径点点击
         * @param {object} json 影响路径数据
         */
        carryDataAndStatus(json) {
            this.clearTimer();
            this.influence = json;
            this.cityDistance(json.id, json.tyObject, json.tsid);
        },

        /**
         * 获取城市测距
         * @param {string} id 台风point的id
         * @param {string} type 台风point类型
         * @param {string} tsid 台风tsid
         */
        cityDistance(id, tyObject, tsid) {
            const code = this.code;
            const dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
            utils.GET(this.urls.distance, {id, tyObject, code, dateTime}).then((json) => {
                const data = json.data.cityDistance;
                this.distance = {tsid, data};
            });
        },

        /**
         * 时间轴变化，动态改变相应路径信息
         */
        changePointOfRoad() {
            this.influence = { city: [], county: [], town: [] }; // 清除影响范围数据
            this.distance = { data: [] };
        },

        /**
         * 路径信息组装
         *
         * @param {object} item 当前台风
         */
        packRoad(item, tsid = -1) {
            const fst = JSON.parse(JSON.stringify(item.fst.data)).reverse();
            const obs = JSON.parse(JSON.stringify(item.obs.data)).reverse();
            fst.push(...obs);
            if (obs.length) { // 只保存有路径的台风
                let zero = obs[0];
                const [points, inilid, tscname, tsename] = [fst, item.inilid, item.tscname, item.tsename];
                this.roadInfo.points[zero.tsid] = {points, inilid, tscname, tsename};
                if (tsid === -1) {
                    if (!this.roadInfo.validTyName.includes(zero.tsid)) this.roadInfo.validTyName.push(zero.tsid);
                    this.roadInfo.cur = zero.tsid;
                }
            }
            this.roadInfo = Object.assign({}, this.roadInfo, {});
            this.changePointOfRoad();
        },

        /**
         * 跳到相应list:（路径信息）
         * @param {object} item 相应列项数据
         * @param {number} index 相应下标
         */
        goToList(item, index) {
            if (typeof index === 'undefined') return;
            if (index > 2) { // > 2就展开列表
                this.toggle('roadList', true);
            }
            this.$nextTick(() => {
                this.roadInfo.listIndex = index;
                this.roadInfo = Object.assign({}, this.roadInfo, {});
                if (item) this.listToPoint(item); // 这里模拟风圈移动、点击事件是最便捷方法
                // else this.scrollers[1].scrollTo(0, -24.5 * index)
                else document.querySelector('#typhoon-roads').scrollTop = this.bigScreen ? 33 * index : 27 * index;
            });
        },

        /**
         * 数据组装、后续可cut掉
         *
         * @param {object} json 台风json数据
         * @param {string} tscname 台风中文名
         * @param {string} tscname 台风中文名
         * @param {string} tsid 台风标识
         * @param {boolean} bool 是否有数据
         */
        changeData(json, tscname, tsename, tsid, bool = true) {
            let pointIndex = 0;
            const tsData = { tscname, tsename, tsid, obs: { data: [], time: [] }, fst: { data: [], time: [] } };
            if (!bool) {
                tsData.inilid = json.inilid;
                tsData.index = json.index;
                return tsData;
            }
            const sort = { obs: { data: [], time: [] }, fst: { data: [], time: [] } };
            const obs = json.obs.reverse();
            const fst = json.fst.reverse();
            const pointCounts = obs.length + fst.length;
            for (const p of fst) {
                p.type = 'fst';
                p.pointIndex = pointIndex++;
                p.tscname = tscname;
                p.tsename = tsename;
                tsData.fst.data.push(p);
                tsData.fst.time.push(TU(p.bjdatetime).format('YYYYMMDDHHmmss'));
            }
            pointIndex = 0;
            for (const p of obs) {
                p.tscname = tscname;
                p.tsename = tsename;
                tsData.obs.data.push(p);
                tsData.obs.time.push(TU(p.bjdatetime).format('YYYYMMDDHHmmss'));
                p.type = 'obs'; // 后续去掉
                p.pointIndex = pointCounts - 1 - pointIndex++;
            }

            sort.obs.time = [...tsData.obs.time].sort(sortfunc);
            for (const time of sort.obs.time) {
                const index = tsData.obs.time.indexOf(time);
                sort.obs.data.push(tsData.obs.data[index]);
            }
            tsData.obs.data = sort.obs.data;

            sort.fst.time = [...tsData.fst.time].sort(sortfunc);
            for (const time of sort.fst.time) {
                const index = tsData.fst.time.indexOf(time);
                sort.fst.data.push(tsData.fst.data[index]);
            }
            tsData.fst.data = sort.fst.data;

            function sortfunc(a, b) {
                return Number(a) - Number(b);
            };
            tsData.inilid = json.inilid;
            tsData.index = json.index;
            tsData.fstDateTime = json.fstDateTime;
            return tsData;
        },

        async updateTyphoonRoads() {
            this.roadInfo.listIndex = -1;
            this.roadInfo = Object.assign({}, this.roadInfo, {});
            const t = Object.keys(this.selectEdTyphoon);
            const select = this.typhoon.select;
            const len = select.length - 1;
            let index;
            // let b = (len > (Object.keys(this.typhoon.paths).length - 1)); // paths没有更新，select已更新的情况
            let b = (len > (this.typhoon.paths.size - 1)); // paths没有更新，select已更新的情况
            t.forEach(async (ele) => { // 遍历当前所勾选的台风
                index = select.indexOf(ele);
                if (!b || (index !== len)) {
                    await this.obs(this.selectEdTyphoon[ele], 'updateTime', index);
                }
            });
        },

        /**
         * 勾选、取消勾选
         *
         * @param {object} item 相应列表项
         * @param {number} index 列表项相应下标
         * @param {number} force 默认-1，false||true，强制勾选或删除
         */
        select(item, index, force) {
            let indexEd;
            this.roadInfo.listIndex = -1;
            if (force !== -1 && force) {
                indexEd = this.typhoon.select.indexOf(item.tsid);
                if (indexEd !== -1) this.typhoon.select.splice(indexEd, 1);
            }
            const status = !this.typhoon.select.includes(item.tsid);
            // document.getElementById('typhoon-roads').classList = ['ps']; // 初始化滚轴
            if (status) {
                this.selectEdTyphoon[item.tsid] = item;
                item.index = index;
                this.typhoon.select.push(item.tsid);
                this.obs(item);
                this.influence = { city: [], county: [], town: [] }; // 清除影响范围数据
                this.distance = { data: [] };
            } else {
                // this.updateParam(['typhoon', { deleteTsid: item.tsid }]);
                delete this.selectEdTyphoon[item.tsid];
                this.loading = false;
                indexEd = this.typhoon.select.indexOf(item.tsid);
                if (indexEd !== -1) {
                    // this.typhoon.paths.splice(indexEd, 1);
                    // delete this.typhoon.paths[item.tsid];
                    this.typhoon.paths.delete(item.tsid)
                    this.typhoon.select.splice(indexEd, 1);
                }
                this.typhoon = Object.assign({}, this.typhoon, {});
                if (!this.typhoon.select.length) {
                    this.roadInfo.points['****'].inilid = '****';
                }
                if (item.tsid === this.influence.tsid) this.influence = { city: [], county: [], town: [] }; // 清除影响范围数据
                if (item.tsid === this.distance.tsid) this.distance = { data: [] }; // 清除影响范围数据
                // points = JSON.parse(JSON.stringify(this.roadInfo.points));
                if (!!this.roadInfo.points[item.tsid]) { // 有路径、cut掉路径
                    const i = this.roadInfo.validTyName.findIndex((val) => {
                        return (val === item.tsid);
                    });
                    this.roadInfo.validTyName.splice(i, 1);
                    // delete points[item.tsid];
                    delete this.roadInfo.points[item.tsid];
                }
                this.roadInfo.cur = this.roadInfo.validTyName.length ? this.roadInfo.validTyName[this.roadInfo.validTyName.length - 1] : '****';
                this.typhoon.paths = Object.assign(new Map(this.typhoon.paths), this.typhoon.paths)
            }
            // this.roadInfo = Object.assign({}, this.roadInfo, points);
            this.roadInfo = Object.assign({}, this.roadInfo);
        },

        /**
         * 定位
         *
         * @param {object} item 相应台风列表项
         */
        location(item) {
            let t = this.roadInfo.points[item.tsid];
            if (t && t.points.length) {
                lmap.ctrl.panTo(lmap.map, [t.points[0].lon, t.points[0].lat], 5);
            }
        },

        /**
         * 台风列表的moreorless
         *
         * @param {string} val 属性值
         * @param {boolean} open 是否打开
         */
        toggle(val, open) {
            if (!open) this.moreOrless[val] = !this.moreOrless[val];
            else this.moreOrless[val] = open;
            // if (val === 'typhoonList') document.getElementById('typhoon-list').classList = ['ps']; // 初始化滚轴
            // else if (val === 'roadList') document.getElementById('typhoon-roads').classList = ['ps'];
            // else if (val === 'influence') document.getElementById('typhoon-influence').classList = ['ps'];
            // else document.getElementById('typhoon-distance').classList = ['ps'];
            // this.newPsScroller();
            this.setScroll();
        },

        /**
         * 清除所勾选的不在时间轴内的台风
         *
         * @param {string} queryTime 查询时间
         */
        pathOutofTime(queryTime) {
            let tyFirstTime, tyEndTime, t;
            // let paths = Object.keys(this.typhoon.paths);
            let paths = [...this.typhoon.paths.keys()]

            queryTime = new Date(.../(\d{4})(\d{2})(\d{2})(\d{2})/.exec(queryTime).slice(1).map((item, idx) => idx === 1 ? item - 1 : item)).getTime()
            paths.forEach((ele, i) => {
                // ele = this.typhoon.paths[ele]
                ele = this.typhoon.paths.get(ele)
                t = ele.obs.time;
                if (t[0]) {
                    tyFirstTime = new Date(.../(\d{4})(\d{2})(\d{2})(\d{2})/.exec(t[0]).slice(1).map((item, idx) => idx === 1 ? item - 1 : item)).getTime()

                    if (ele.fst && ele.fst.time[0]) tyEndTime = new Date(.../(\d{4})(\d{2})(\d{2})(\d{2})/.exec(ele.fst.time[0]).slice(1).map((item, idx) => idx === 1 ? item - 1 : item)).getTime()
                    else tyEndTime = new Date(.../(\d{4})(\d{2})(\d{2})(\d{2})/.exec(t[t.length - 1]).slice(1).map((item, idx) => idx === 1 ? item - 1 : item)).getTime()

                    if ((queryTime > tyEndTime) || queryTime < tyFirstTime) {
                        setTimeout(() => {
                            this.select(this.typhoon.data[ele.index], ele.index);
                        })
                    }
                }
            });
        },

        /**
         * 初始化scroller
         */
        newPsScroller() {
            // 清除PsScroller，减少垃圾
            this.scrollers.forEach((ele) => {
                ele.destroy();
                ele = null;
            });
            this.$nextTick(() => {
                /* eslint-disable */
                const t1 = new PS('#typhoon-list', {
                    minScrollbarLength: 20
                });
                const t2 = new PS('#typhoon-roads', {
                    minScrollbarLength: 20
                });
                const t3 = new PS('#typhoon-influence', {
                    minScrollbarLength: 20
                });
                const t4 = new PS('#typhoon-distance', {
                    minScrollbarLength: 20
                });
                this.scrollers = [t1, t2, t3, t4];
            });
        },

        setScroll() {
            if (true) return // 使用原生滚动条，不执行下列语句

            this.$nextTick(() => {
                /* eslint-disable */
                if (this.scrollers.length) {
                    this.scrollers.forEach((ele) => {
                        ele.refresh();
                    });
                } else {
                    /* eslint-disable */
                    const t1 = new IScroll('#typhoon-list', {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                    const t2 = new IScroll('#typhoon-roads', {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                    const t3 = new IScroll('#typhoon-influence', {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                    const t4 = new IScroll('#typhoon-distance', {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                    this.scrollers = [t1, t2, t3, t4];
                }
            })
        }
    },
    created() {
        this.initConstData();
    },
    mounted() {
        this.list();
    },
    updated: function () {
        this.scrollers.forEach((scroller) => {
            scroller.refresh()
        })
    },
    destroyed() {
        this.updateParam([ 'typhoon', { paths: null } ]);
        this.updateParam([ 'typhoon', { panelCallback: null } ]);
        this.updateParam(['tip', {typhoon: {status: false}}]);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.typhoon {
    position: absolute;
    z-index: @panel-index;
    top: 0;
    right: 0;
    background: #fff;
    box-shadow: @shadow;
    .width();
    tbody {
        overflow-y: initial;
    }
    .s-title {
        position: relative;
        padding: 0 5px;

        span {
            display: inline-block;
            .height();
        }

        span:nth-child(1) {
            color: #000;
            font-weight: bold;
        }
    }
    .noData {
        height: 50px;
        line-height: 50px;
    }
    .moreOrless {
        &:before {
            content: "\BB";
            display: inline-block;
            font-size: @font-big;
            color: @select-font-color;
            letter-spacing: 2px;
            position: absolute;
            text-align: center;
            cursor: pointer;
        }
        &.more:before {
            top: 1px;
            right: 19px;
            transform: rotate(-90deg);
        }
        &.less:before {
            top: 2px;
            right: 17px;
            transform: rotate(90deg);
        }
    }
    thead tr, tbody tr{
        display: -webkit-flex;
        display: flex;
        td {
            border-left: 1px solid #e0eaf5;
        }
        // td:nth-child(1) {
        //     border: none;
        // }
    }
    .list {
        border-bottom: 1px solid #e0eaf5;
        .loading.loading-default {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
        .close {
            width: 13px;
            height: 16px;
            right: 3px;
            text-align: center;
        }
        .close:after {
            height: 16px;
            font-size: 16px;
            right: -10px;
            top: 5px;
        }
        table {
            tr td {
                font-style: normal;

                vertical-align: middle;
                text-align: center;
                // border-bottom: 1px solid #e0eaf5;
                word-break: break-all;
                font-weight: 400;
                &:nth-child(1) {
                    width: 67px;
                    label {
                        margin-right: 0px;
                    }
                }
                &:nth-child(2) {
                    width: 67px;
                }
                &:nth-child(3) {
                    width: 100px;
                }
                &:nth-child(4) {
                    width: 100px;
                }
                &:nth-child(5) {
                    color: #1E7AC9;
                    text-align: left;
                    padding-left: 6px;
                }
            }
            thead tr:first-child td {
                &:nth-child(5) {
                    color: #414e61;
                }
            }
            tbody {
                // max-height: 102px;
            }
        }
    }
    .point-info {
        padding-top: 10px;
        border-bottom: 1px solid #e0eaf5;
        table {
            tr.tyFst {
                background-color: #F5E7E6;
            }
            tr.roadHighlight {
                background-color: #6cafe9;
            }
            tbody {
                // max-height: 150px;
            }
            td:nth-child(1) {
                width: 180px;
            }
            td:nth-child(2) {
                width: 110px;
            }
            td:nth-child(3) {
                width: 110px;
            }
        }
        .s-title {
            span:nth-child(2) {
                color: @select-font-color;
            }
            span:nth-child(3) {
                color: #F6B4B2;
            }
            .more:before {
                top: -2px;
            }
            .less:before {
                top: -1px;
            }
        }
    }
    .tbody {
        max-height: 150px;
        position: relative;
        overflow-y: scroll;
    }
    #typhoon-list {
        max-height: 102px;
    }
    #typhoon-distance {
        max-height: 102px;
    }
    .analysis-range {
        padding-top: 10px;
        thead {
            .circleHover:after {
                content: "";
                display: inline-block;
                width: 0px;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid #aaa;
                transform: rotate(-45deg);
            }
            .circleHover { cursor: pointer; }
            .circleHover div {
                position: absolute;
                z-index: 1;
                top: @height-normal;
                display: none;
                width: 100%;
                border-bottom: 2px solid #e0eaf5;
                li {
                    .height();
                    border-bottom: 1px solid #e0eaf5;
                }
            }
            ul {
                background: @title-color;
            }
            .circleHover:hover div { display: block; }
        }
        tbody {
            // max-height: 130px;
        }
        td {
            &:nth-child(1) {
                width: 40px;
            }

            &:nth-child(2), &:nth-child(3), &:nth-child(4) {
                position: relative;
                width: 119px;
            }
        }
    }
    .city-ranging {
        .noData {
            text-align: center;
        }
        tbody {
            // max-height: 102px;
        }
        td:nth-child(1), td:nth-child(2) {
            width: 202px;
        }
    }
}

.big {
    .typhoon {
        .width(@pop-width-big);

        .list {
            table {
                tr td {
                    &:nth-child(1) {
                        width: 90px;
                    }
                    &:nth-child(2) {
                        width: 90px;
                    }
                    &:nth-child(3) {
                        width: 145px;
                    }
                    &:nth-child(4) {
                        width: 145px;
                    }
                    &:nth-child(5) {
                        width: 90px;
                    }
                }
            }
        }

        .s-title {
            // .height(@height-big);

            span {
                .height(@height-big);
            }
            .less {
                &::before {
                    top: 4px;
                }
            }
        }
        .point-info {
            table {
                tr {
                    td:nth-child(1) {
                        width: 310px;
                    }
                    td:nth-child(2) {
                        width: 130px;
                    }
                    td:nth-child(3) {
                        width: 130px;
                    }
                }
            }
        }

        .analysis-range {
            .circleHover {
                div {
                    top: @height-big;
                }
                li {
                    .height(@height-big);
                }
            }

            td {
                &:nth-child(1) {
                    width: 60px;
                }

                &:nth-child(2), &:nth-child(3), &:nth-child(4) {
                    position: relative;
                    width: 170px;
                }
            }
        }

        .city-ranging {
            td:nth-child(1), td:nth-child(2) {
                width: 290px;
            }
        }
    }
}
</style>
