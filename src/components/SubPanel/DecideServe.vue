<template>
    <div class="decide-serve">
        <div class="tools clearfix">
            <div class="select">
                <v-dropdown :list="elements" :tip="elements[0].text" class="dropdown-decide"></v-dropdown>
                <!-- <v-select :tip="elements[0].text" :list="elements"></v-select> -->
            </div>
            <ul class="clearfix">
                <li v-for="(name, key) in tools" @click="select(key)" :key="key" :class="[ 'icon-econtrol-' + key, { selected: key === last } ]" :title="name"></li>
                <li @click="undo()" class="icon-econtrol-undo" title="撤销"></li>
                <li @click="clear()" class="icon-econtrol-delete" title="删除"></li>
                <li @click.stop="(status.save = !status.save)" class="icon-econtrol-save" title="保存"></li> <!-- -->
                <li @click="(status.plan = !status.plan)" class="icon-econtrol-plans" title="历史"></li>
                <li @click="closed()" class="icon-econtrol-close" title="关闭"></li>
                <li @click="(status.fold = !status.fold, status.save = false)" :class="[status.fold ? 'icon-econtrol-fold' : 'icon-econtrol-unfold']" title="显示/隐藏"></li>
            </ul>
            <!-- <a :class="{ 'icon-econtrol-unfold': status.fold, 'icon-econtrol-fold': !status.fold }" @click=""></a> -->

            <!-- <div class="save-plan" v-show="status.save && !status.alreadyExit"> -->
            <div class="save-plan" v-show="status.save">
                <input type="text" :placeholder="saveTips" v-model="planName"/>
                <a class="btn" @click="savePlan()" v-show="!saveTips.includes('空')">保存</a>
                <a class="btn" @click="cancelPlan()" v-show="saveTips.includes('空')">返回</a>
            </div>
        </div>
        <div class="table plans" v-show="status.plan && status.fold">
            <table cellpadding="0" cellspacing="0">
                <thead><tr><td>序号</td><td>方案名</td></tr></thead>
                <tbody id="decide-serve-plan-table">
                    <tr v-for="(item, index) of plans" :key="index" @click="getPlan(item)">
                        <td>{{ index + 1 }}</td>
                        <td>{{ item.name }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-show="!status.plan && status.fold">
            <div class="list">
                <div class="levels">
                    <span>等级：</span>
                    <span v-for="(item, index) in levels.data" :key="index">
                        <input :id="item.id" :value="item.level" v-model="levels.select" class="checkbox" type="checkbox"/>
                        <label :for="item.id">{{ item.text }}</label>
                    </span>
                </div>
                <div class="times">
                    <span>时间：</span>
                    <input type="text" id="decide-serve-start-time" :value="time.start" @click="initTimePicker('start')" readonly="readonly" /> -
                    <input type="text" id="decide-serve-end-time"  :value="time.end" @click="initTimePicker('end')" readonly="readonly" />
                    <a class="btn hover" @click="getData()">分析数据</a>
                    <v-timepicker v-if="status.tps" :option="option" @cbtime="selectTime" @destroy="(status.tps = false)"></v-timepicker>
                </div>
                <div class="table" v-show="!!stations[0]">
                    <table cellpadding="0" cellspacing="0">
                        <thead>
                            <tr>
                                <td><input type="checkbox" class="checkbox" v-model="status.site"/><label @click="status.site = !status.site"></label></td>
                                <td v-for="(value, key) in title" :key="key">{{ value }}</td>
                            </tr>
                        </thead>
                        <tbody id="decide-serve-table">
                            <tr v-for="(item, index) in stations" :key="index" @click.stop="selectOne(item)">
                                <td><input type="checkbox" class="checkbox" :id="item.siteId" :value="item.siteId" v-model="ids"/><label @click.stop="selectOne(item)"></label></td>
                                <td v-for="(value, key) in title" :key="key">{{ item[key] }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-show="stations.length==0">暂无数据</p>
                <div v-show="false" class="loadStatus">loadStatus</div>
                <!-- <div v-show="dataStatus" class="dataStatus">暂无数据</div> -->
            </div>
            <div class="decide-serve-color clearfix">
                <v-font-panel></v-font-panel>
                <v-marker-panel></v-marker-panel>
            </div>
        </div>
    </div>
</template>

<script>
/**
 * ----------------------------------------------------------------------------
 *                              DecideServe list
 * ----------------------------------------------------------------------------
 * initConstData            - 初始化默认参数
 * initTimePicker           - 初始化时间插件
 * selectTime               - 选择时间
 * selectOne                - 选择单行监测站
 * select                   - 选择工具
 * undo                     - 撤销
 * end                      - 画笔结束回调事件
 * getParam                 - 请求参数获取
 * getData                  - 获取数据
 * render                   - 渲染图层
 * clickEvt                 - 绑定点击事件
 * initPopup                - 弹窗输入文字
 * removePopup              - 移除弹窗
 * getSaveParam             - 获取预案图层矢量数据
 * savePlan                 - 保存预案
 * getPlans                 - 查询保存预案列表
 * getPlan                  - 根据ID查询预案
 * restore                  - 还原预案
 * clear                    - 清除操作
 * closed                   - 关闭决策服务
 */
import { mapActions, mapState } from 'vuex';

import FontPanel from '../Plugins/FontPanel';
import MarkerPanel from '../Plugins/MarkerPanel';
import Timepicker from '../Plugins/Timepicker';
import Dropdown from '../Plugins/Dropdown';

import _ from 'lodash';

import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default {
    name: 'DecideServe',
    components: {
        'v-font-panel': FontPanel,
        'v-marker-panel': MarkerPanel,
        'v-timepicker': Timepicker,
        'v-dropdown': Dropdown
    },

    data() {
        return {
            status: {
                // 是否折叠
                fold: true,

                // 保存界面是否打开
                save: false,

                // 加载中
                load: false,

                // 是否展示数据
                data: false,

                // 是否展示数据
                site: false,

                // 时间控件初始化
                tps: false,

                // 方案是否已存在
                alreadyExit: false,

                // 是否展示历史保存
                plan: false
            },

            tools: {
                circle: '画圆',
                box: '画矩形',
                polygon: '画任意面',
                arrow: '箭头'
            },

            elements: [ { text: '极大风风速', value: '' } ],

            levels: {
                data: [
                    { level: 8, text: '8级', id: 'ba' },
                    { level: 9, text: '9级', id: 'jiu' },
                    { level: 10, text: '10级', id: 'shi' },
                    { level: 11, text: '11级', id: 'sy' },
                    { level: 12, text: '12级', id: 'se' },
                    { level: 13, text: '12级以上', id: 'ses' }
                ],
                select: []
            },

            title: { name: '站点名', siteId: '站点号', maxWind: '风速', time: '时间' },
            planName: '',
            last: null,
            stations: [],
            option: {},
            ids: [],
            time: {},
            wkts: '', // 圈选范围
            saveTips: '请输入预案名',
            plans: [],
            // 站点数据队列，仅用于追踪队列长度
            loadingQueue: [],
            // 站点数据队列长度
            loadingItems: 0
        };
    },

    computed: {
        ...mapState({
            siteNameStatus: state => state.decideServe.siteNameStatus,
            sysTime: state => state.time.sysTime,
            marker: state => state.decideServe.marker,
            font: state => state.decideServe.font,
            code: state => state.sys.code,
            mapType: state => state.mapType,
            navItemsCallback: state => state.toolsBar.navItemsCallback,
            liPendingPool: state => state.loadingIndicator.pendingPool
        })
    },

    watch: {
        wkts() {
            if (!this.wkts) this.restorePlan = { restoreId: -1, restorePlanName: '' };
        },
        'status.site'(status) {
            if (status) {
                this.selectMarked = 'all';
                this.ids = [...this.tempIds.all];
                this.tempIds.req = [];
            } else {
                if (this.tempIds.all.length === this.ids.length) {
                    this.selectMarked = 'none';
                    this.ids = [];
                }
            }
            this.render();
        },
        'time.start'() {
            this.getData();
            // this.render();
        },
        'time.end'() {
            this.getData();
            // this.render();
        },
        'font.color'() {
            this.render();
        },
        'font.style'() {
            this.render();
        },
        'font.size'() {
            this.render();
        },
        'marker.pointSize'() {
            this.render();
        },
        'marker.pointColor'() {
            this.render();
        },
        'siteNameStatus'() {
            this.render();
        },
        'levels.select'() {
            this.getData();
            // this.render();
        },
        'status.plan'() {
            this.status.save = false;
            if (this.status.plan) this.getPlans();
        },
        loadingQueue: function (val) {
            if (val.length > 0) {
                if (this.loadingItems === 0) {
                    this.liPendingPool.push({ id: 'decideServe' })
                }
            } else {
                this.updateParam(['loadingIndicator', { sigCancel: 'decideServe' }])
            }

            this.loadingItems = val.length
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        /**
         * 初始化默认参数
         */
        initConstData() {
            const drawParam = lmap.layer.initDrawParam(lmap.map, 'draw');
            this.drawParam = drawParam;
            this.layer = drawParam.layer;
            // this.modify = lmap.draw.initModify(drawParam);
            const start = TU().hour(-3).format('YYYY-MM-DD HH:mm');
            const end = TU().format('YYYY-MM-DD HH:mm');
            this.time = { start, end };
            this.timer = { renderTimer: null, delayTimer: null };
            this.showSiteType = 'showSite';
            this.restorePlan = {
                restoreId: -1,
                restorePlanName: ''
            };
            this.style = {
                isIcon: true,
                icon: {
                    src: 'http://10.148.16.53/topic/little/decideserve/P' + this.marker.pointColor + '.png',
                    anchor: [0.5, 1],
                    size: [20, 30],
                    scale: 1,
                    rotation: 0,
                    opacity: 1
                },
                text: {
                    text: '事故发生地点',
                    size: '12px',
                    offsetY: 10,
                    offsetX: 0,
                    fill: {
                        color: '#f00',
                        width: 1
                    },
                    stroke: {
                        color: '#fff',
                        width: 3
                    }
                }
            };

            // 文本弹出窗口
            this.popup = null;

            // 请求链接
            this.urls = {
                data: sysconfig.TESTPATH + '/decision/listSiteData',
                plans: sysconfig.TESTPATH + '/decision/listDecision',
                plan: sysconfig.TESTPATH + '/decision/getDecisionInfo',
                layer: sysconfig.TESTPATH + '/decision/getDesicionImage',
                save: sysconfig.TESTPATH + '/decision/saveDecision'
            };

            // 存放全部监测站ID
            this.tempIds = { all: [], req: [] };

            // 选择标示
            this.selectMarked = 'all';

            // 查询参数
            this.req = { key: '', layer: 'assistTools' };

            this.timestamps = {
                listData: null
            }
        },

        /**
         * 初始化时间插件
         * @param {string} type 时间标示
         */
        initTimePicker(type) {
            const option = {
                id: 'decide-serve-' + type + '-time',
                type: type,
                top: 0,
                template: 'YYYY-MM-DD HH:mm',
                date: this.time[type],
                lock: { min: false, sec: true }
            }
            this.status.tps = true;
            this.option = option;
        },

        /**
         * 选择时间
         * @param {object} param 返回时间参数
         */
        selectTime(param) {
            this.time[param.type] = param.date;
            this.status.tps = false;
        },

        /**
         * 选择单行监测站
         */
        selectOne(item) {
            const status = !this.ids.includes(item.siteId);

            if (status) {
                this.ids.push(item.siteId);
            } else {
                const index = this.ids.indexOf(item.siteId);
                this.ids.splice(index, 1);
            }
            const unselect = _.difference(this.tempIds.all, this.ids);
            const select = _.intersection(this.tempIds.all, this.ids);

            let ids = [];
            let site = false;
            this.selectMarked = 'all';
            if (unselect.length === 0) {
                this.showSiteType = 'showSite';
                site = true;
            } else if (select.length === 0) {
                this.showSiteType = 'hideSite';
            } else if (unselect.length > select.length) {
                this.selectMarked = select.join(',');
                this.showSiteType = 'showSite';
                ids = select;
            } else if (unselect.length <= select.length) {
                this.selectMarked = unselect.join(',');
                this.showSiteType = 'hideSite';
                ids = unselect;
            }
            this.tempIds.req = ids;
            this.status.site = site;
            this.render();
            // console.info(ids, this.selectMarked);
        },

        /**
         * 选择工具
         * @param {string} type 工具类型
         */
        select(type) {
            this.status.save = false;
            this.removePopup();
            if (!!this.handle) {
                lmap.draw.cancel(lmap.map, this.handle);
                this.handle = null;
            }
            if (this.last === null || type !== this.last) {
                const event = {
                    // start: () => console.info(type + ' start...'),
                    end: (e) => this.end(e.feature, type)
                }
                const eventParam = { map: lmap.map };
                this.handle = lmap.draw.initHandle(this.drawParam, type, event, eventParam, {});
                this.last = type;
            } else {
                this.last = null;
            }
        },

        /**
         * 撤销
         */
        undo() {
            this.status.save = false;
            lmap.draw.undo(this.layer);
            const features = lmap.draw.getFeatures(this.layer);
            if (!this.wkts) return;
            let wkts = this.wkts.split('#');
            if (wkts[wkts.length - 1] === '') {
                wkts = wkts.splice(0, wkts.length - 1);
            }
            if (features[features.length - 1].get('type') === 'scene') lmap.draw.undo(this.layer);
            this.wkts = wkts.splice(0, wkts.length - 1).join('#');
            if (!this.wkts) this.clear();
            this.stations = [];
            this.getData();
            // this.render();
        },

        /**
         * 画笔结束回调事件
         * @param {object} feature 返回的矢量对象
         */
        end(feature) {
            this.status.plan = false;
            const type = feature.get('type');
            let tempLonLat = null;

            if (type !== 'circle') {
                /* eslint-disable new-cap */
                tempLonLat = new ol.extent.getCenter(feature.getGeometry().getExtent());
            } else {
                tempLonLat = feature.getGeometry().getCenter();
            }

            const lonlat = lmap.util.transform(tempLonLat, true);
            const [ lon, lat ] = lonlat;
            const wkt = lmap.polygon.getWKT(feature, type);
            this.wkts += `POINT(${lon} ${lat})_${wkt}#`;

            const style = this.style;
            style.icon.src = 'http://10.148.16.53/topic/little/decideserve/P' + this.marker.pointColor + '.png';
            const iconFeature = lmap.icon.add(this.layer, style, lonlat);
            iconFeature.set('style', style);
            iconFeature.set('type', 'scene');
            iconFeature.set('text', '事故发生地点');
            this.getData();
            // this.render();
        },

        /**
         * 请求参数获取
         */
        getParam() {
            const level = (this.levels.select.length === 0) ? 'all' : this.levels.select.join(',');
            return {
                font: this.font.style,
                showSiteType: this.showSiteType,
                IDS: this.tempIds.req.join(','),
                level: level,
                startTime: TU(this.time.start).format('YYYY-MM-DD HH:mm:ss'),
                endTime: TU(this.time.end).format('YYYY-MM-DD HH:mm:ss'),
                fontSize: this.font.size,
                pointSize: this.marker.pointSize,
                pointColor: this.marker.pointColor,
                fontColor: this.font.color,
                mark: this.req.key,
                wkt: this.wkts,
                // BBOX: lmap.util.getExtent(lmap.map, true).join(','),
                LAYERS: this.req.layer,
                code: this.code,
                areacode: this.code,
                dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                showSiteName: this.siteNameStatus
            };
        },

        /**
         * 获取数据
         */
        getData(params = this.getParam()) {
            if (!params.wkt) return
            this.req.key = (Math.random() + '').replace('0.', '');
            this.req.layer = 'assistToolsData';
            const mark = this.req.key;
            const { code, dateTime, startTime, endTime, wkt, level } = params;
            const param = { code, dateTime, startTime, endTime, wkt, level, mark };
            const timestamp = Date.now()

            this.timestamps.listData = timestamp
            this.loadingQueue.push(timestamp)
            utils.POST(this.urls.data, param).then((json) => {
                if (timestamp !== this.timestamps.listData) {
                    this.loadingQueue.pop()
                    return
                }

                if (!json.data) return;
                const data = json.data.resp;
                const siteIds = [];
                for (const site of data) {
                    siteIds.push(site.siteId);
                }
                this.status.site = true;
                this.tempIds.all = [...siteIds];
                this.ids = [...siteIds];
                this.stations = data;
                /* eslint-disable no-new */
                if (!!this.ps) {
                    this.ps.update();
                    utils.selectElem('#decide-serve-table').scrollTop = 0;
                } else {
                    this.ps = new PS('#decide-serve-table', {
                        minScrollbarLength: 20
                    });
                }
                this.render();
                this.loadingQueue.pop()
            }).catch((ex) => {
                this.loadingQueue.pop()
            })
        },

        /**
         * 渲染图层
         */
        render() {
            utils.clearTimer(this.timer.renderTimer);
            this.time.renderTimer = window.setTimeout(() => {
                const params = this.getParam();
                const { code, dateTime, mark, areacode, font, fontColor, fontSize, pointSize, pointColor, showSiteName, showSiteType } = params;
                const imageParam = { code, dateTime, mark, areacode, font, fontColor, fontSize, pointSize, pointColor, showSiteType, [showSiteType]: this.selectMarked, showSiteName };
                const param = { url: this.urls.layer, params: imageParam };
                if (!!this.imageLayer) {
                    lmap.image.updateWMS(this.imageLayer, param, 'poi');
                } else {
                    this.imageLayer = lmap.image.WMS(lmap.map, param, 'poi', 'param');
                }
            }, 80);
        },

        /**
         * 绑定点击事件
         *
         * @param {object} e 事件返回
         */
        clickEvt(e) {
            const feature = lmap.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
                return feature;
            });
            if (feature && feature.get('type') === 'scene' && !this.popup) {
                this.popup = this.initPopup(feature);
            }
        },

        /**
         * 弹窗输入文字
         */
        initPopup(feature) {
            const $measure = document.createElement('div');
            $measure.style = 'padding: 3px; background-color: #fff; box-shadow: 0 2px 4px 0 rgba(0, 0, 0,.3); border-radius: 4px';

            const $input = document.createElement('input');
            $input.setAttribute('placeholder', '请输入文字');
            $input.style = 'margin-right: 4px;';

            const $btn = document.createElement('a');
            $btn.className = 'btn';
            $btn.innerHTML = '完成';

            $measure.appendChild($input);
            $measure.appendChild($btn);

            const popup = lmap.draw.getOverlay({
                element: $measure,
                offset: [10, 30],
                positioning: 'bottom-center'
            });

            const coord = feature.getGeometry().getCoordinates();
            popup.setPosition(coord);

            lmap.map.addOverlay(popup);

            $btn.onclick = () => {
                setTextStyle();
            };

            $input.onkeydown = () => {
                const event = window.event; // 消除浏览器差异
                if (event.keyCode === 13) setTextStyle();
            };

            // 输入框提交事件
            const that = this;
            function setTextStyle() {
                const text = $input.value;
                const style = _.cloneDeep(that.style);
                style.text.text = text;
                feature.set('text', text);
                feature.setStyle(lmap.style.getStyle(style));
                that.removePopup();
            }

            return popup;
        },

        /**
         * 移除弹窗
         */
        removePopup() {
            if (!!this.popup) {
                lmap.map.removeOverlay(this.popup);
                this.popup = null;
            }
        },

        /**
         * 获取预案图层矢量数据
         */
        getSaveParam() {
            const features = this.layer.getSource().getFeatures();
            const objArr = [];
            for (const feature of features) {
                const wkt = lmap.draw.getWKT(feature);
                const obj = { type: feature.get('type'), style: feature.get('style'), wkt };
                objArr.push(obj);
            }
            const mapObj = { type: 'map', zoom: lmap.util.getZoom(lmap.view), center: lmap.util.getCenter(lmap.view), mapType: this.mapType };
            objArr.push(mapObj);
            return JSON.stringify(objArr);
        },

        cancelPlan() {
            this.status.alreadyExit = false;
            this.saveTips = '请输入预案名';
        },

        /**
         * 保存预案
         */
        savePlan() {
            if (!this.planName) {
                this.saveTips = '方案名不能为空';
                return;
            }
            let status = false;
            if (this.restorePlan.restoreId === -1) {
                this.plans.every((ele) => {
                    status = (ele.name === this.planName);
                    return (ele.name !== this.planName);
                });
            } else {
                status = (this.restorePlan.restorePlanName !== this.planName);
                if (status) { // 修改历史预案，新的预案名与原来的预案名不一致
                    this.plans.every((ele) => {
                        status = (ele.name === this.planName);
                        return (ele.name !== this.planName);
                    });
                }
            }
            this.status.alreadyExit = status;
            if (!status) { // 预案名不重复
                let reqData = this.getParam();
                const {code, dateTime} = this.getParam();
                const param = { code: code, dateTime: dateTime, layerEle: this.getSaveParam(), name: this.planName, id: this.restorePlan.restoreId, param: JSON.stringify(reqData) };
                utils.POST(this.urls.save, param).then((json) => {
                    this.planName = '';
                    this.saveTips = '保存成功！';
                    utils.clearTimer(this.timer.delayTimer);
                    this.timer.delayTimer = window.setTimeout(() => {
                        this.status.save = false;
                        this.saveTips = '请输入预案名';
                    }, 1000);
                });
            } else {
                this.planName = '该预案名已存在';
                utils.clearTimer(this.timer.delayTimer);
                this.timer.delayTimer = window.setTimeout(() => {
                    this.planName = '';
                }, 1000);
            }
        },

        /**
         * 查询保存预案
         */
        getPlans() {
            const { code, dateTime } = this.getParam();
            utils.GET(this.urls.plans, {code, dateTime}).then((json) => {
                const data = json.data.resp;
                data.map(function(obj) {
                    obj.status = false;
                    return obj;
                });
                this.plans = data;
                if (!!this.planps) {
                    this.planps.update();
                    utils.selectElem('#decide-serve-plan-table').scrollTop = 0;
                } else {
                    this.planps = new PS('#decide-serve-plan-table', {
                        minScrollbarLength: 15
                    });
                }
            });
        },

        /**
         * 根据ID查询预案
         * @param {string} item 单个预案
         */
        getPlan(item) {
            // if (!!this.last) {
            //     this.last.status = false;
            // }
            item.status = true;
            this.restorePlan.restorePlanName = item.name;
            utils.GET(this.urls.plan, { id: item.id }).then((json) => {
                this.clear();
                this.restore(json.data);
                // this.getData();
            });
            // this.last = item;
        },

        /**
         * 还原预案
         */
        restore(json) {
            const data = JSON.parse(json.layerEle);
            this.restorePlan.restoreId = json.id;
            let features = [];
            data.forEach(function(ele) {
                if (ele.type !== 'map') {
                    const feature = lmap.polygon.addWKT(ele.wkt)[0];
                    const styles = [ lmap.style.getStyle(ele.style, true) ];
                    feature.setStyle(styles);
                    feature.set('type', ele.type);
                    feature.set('style', ele.style);
                    features.push(feature);
                } else {
                    lmap.map.getView().setCenter(ele.center);
                    lmap.map.getView().setZoom(ele.zoom);
                    this.updateParam([ { mapType: 'dt' } ]);
                }
            }, this);
            lmap.draw.clear(this.layer);
            const params = JSON.parse(json.param);
            this.wkts = params.wkt; // 还原wkts
            this.layer.getSource().addFeatures(features); // 还原所画的图形
            this.status.plan = false;
            this.getData(params); // 还原列表数据、黑色图层
        },

        /**
         * 清除操作
         */
        clear() {
            this.removePopup();
            lmap.draw.clear(this.layer);
            this.imageLayer = lmap.layer.remove(lmap.map, this.imageLayer);
            this.wkts = '';
            this.stations = [];
            this.status.save = false;
        },

        /**
         * 关闭决策服务
         */
        closed() {
            this.navItemsCallback('decisionServe');
        }
    },

    mounted() {
        this.initConstData();
        this.getPlans();
        lmap.map.on('singleclick', this.clickEvt);
    },

    destroyed: function() {
        this.removePopup();
        lmap.draw.cancel(lmap.map, this.handle);
        lmap.map.removeLayer(this.imageLayer);
        lmap.map.removeLayer(this.layer);
        lmap.map.un('singleclick', this.clickEvt);
    }
};
</script>
<style lang='less' scoped>
@import '../../assets/css/common.less';
@images: '../../assets/img';

.decide-serve {
    position: absolute;
    top: @top-normal;
    right: 0px;
    width: 424px;
    height: auto;
    background-color: #fff;
    z-index: @panel-index;
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}

.tools {
    ul {
        float: left;

        li {
            float: left;
            .height(26px);
            margin: 2px 1px;
            background: linear-gradient(#fff, #eee);
            &::before {
                font-size: 26px;
                border: 1px solid rgb(199, 199, 199);
            }
        }
    }

    .select {
        position: relative;
        top: 1px;
        margin-left: 1px;
    }

    .selected::before {
        color: @select-font-color;
        border-color: @select-font-color;
    }

    .save-plan {
        position: absolute;
        z-index: 1;
        padding: 3px;
        background-color: #fff;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0,.3);
        right: 0;
        top: 30px;
    }

}

.unfold, .fold {
    float: left;
    margin: 2px 1px;
    width: 26px;
    height: 26px;
    // border: 1px solid #d6d6d6;
    position: relative;
    cursor: pointer;
    // background-color: -webkit-linear-gradient(#fefefe, #eeeeee);
    // background-color: -o-linear-gradient(#fefefe, #eeeeee);
    // background-color: -moz-linear-gradient(#fefefe, #eeeeee);
    // background-color: linear-gradient(#fefefe, #eeeeee);
}

.unfold {
    background: url('@{images}/econtrol/up.png') no-repeat center center/cover;
}

.fold {
    background: url('@{images}/econtrol/down.png') no-repeat center center/cover;
}

.levels {
    height: auto;
    overflow: hidden;
    padding: 4px;
    margin-left: 4px;
    text-align: left;

    a {
        input {
            width: 16px;
            height: 16px;
            vertical-align: middle;
            margin-top: -1px;
        }
    }

    span {
        margin-right: 8px;
        .height();
        float: left;
    }
}

.times {
    height: auto;
    line-height: 22px;
    overflow: hidden;
    padding: 4px;
    margin-left: 4px;
    text-align: left;
    input {
        cursor: pointer;
        border: 1px solid #ccc;
        .height();
        padding-left: 2px;
        width: 138px;
        box-sizing: border-box;
    }
    span {
        display: inline-block;
    }
    a {
        display: inline-block;
        height: 22px;
        line-height: 22px;
        padding: 0px 3px;
        cursor: pointer;
        border: 1px solid #ccc;
        color: #000;
    }
    // a:hover {
    //     background: @title-color;
    // }
    /* 调整时间选择器样式 */
    .timepicker-dropdown {
        position: fixed;
    }
    #timepicker {
        // top: 119px !important;
    }
}

.table {
    width: 100%;
    height: auto;
    overflow: hidden;
    margin-top: 5px;
    margin-bottom: -1px;

    table {
        table-layout: fixed;
        width: 100%;
        background: #fff;

        thead {
            display: block;
        }
        tbody {
            overflow-y: scroll;
            overflow-x: hidden;
            display: block;
            height: 134px;
            width: 100%;
            border-bottom: 1px solid #e5e8ec;

            tr:hover {
                cursor: pointer;
            }
        }
        td {
            border: 0;
            height: 22px;
            line-height: 22px;
            text-align: center;
            width: 60px;
            vertical-align: middle;
            border-bottom: 1px solid #e5e8ec;
            border-right: 1px solid #e5e8ec;

            input {
                width: 16px;
                height: 16px;
            }
        }
        td:hover {
            background: #ECF2FC;
        }
        td:first-child {
            width: 30px;
        }
        td:nth-child(2) {
            width: 182px;
        }
        td:nth-child(5) {
            width: 80px;
        }
    }

    &.plans {
        td:nth-child(2) {
            width: 400px;
        }
    }
}

.decide-serve-color {
    border-top: 1px solid #e5e8ec;
    width: 100%;
    padding: 8px 2px;
    text-align: left;
    box-sizing: border-box;
}

.big {
    .tools {
        ul {
            li {
                margin: 2px 2px;
                width: 36px;
                .height-big();

                &::before {
                    font-size: 36px;
                    width: 100%;
                    height: 100%;
                    position: relative;
                    top: -1px;
                }
            }
        }
        .select {
            margin: 2px 2px;
        }
    }
    .decide-serve {
        top: @top-big;
        width: 600px;

        .font-panel {
            .div-select {
                width: 66px;
            }
        }
    }
    .levels {
        span {
            margin: 0 4px;
            .height-big();

            &:nth-child(1),
            &:nth-child(2) {
                margin: 0;
            }
        }
    }
    .times {
        .height-big();
        padding-bottom: 8px;

        span {
            .height-big();
        }
        input {
            width: 190px;
            font-size: 18px;
            .height-big();
        }
    }
    .btn {
        .height-big();
        box-sizing: border-box;
    }

    .unfold,
    .fold {
        width: 36px;
        .height-big();
    }
    .table {

        table {
            thead {
                display: block;
            }
            tbody {
                overflow-y: scroll;
                overflow-x: hidden;
                display: block;
                height: 134px;
                width: 100%;
                border-bottom: 1px solid #e5e8ec;
                tr:hover {
                    cursor: pointer;
                }
            }
            td {
                border: 0;
                .height(36px);
                text-align: center;
                width: 60px;
                vertical-align: middle;
                border-bottom: 1px solid #e5e8ec;
                border-right: 1px solid #e5e8ec;

                input {
                    width: 16px;
                    height: 16px;
                }
            }
            td:first-child {
                width: 50px;
            }
            td:nth-child(2) {
                width: 224px;
            }
            td:nth-child(5) {
                width: 200px;
            }
        }

        &.plans {
            td:nth-child(2) {
                width: 600px;
            }
        }
    }
}
</style>
