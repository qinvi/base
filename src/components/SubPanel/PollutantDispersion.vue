<template>
    <div>
        <v-timepicker v-if="tps" :option="option" @cbtime="selectTime" @destroy="(tps = false)"></v-timepicker>
        <div class="pollutantDispersion">
            <ul class="nav">
                <li v-for="(item, index) of navs" :key="index" :class="['nav-item', { 'select': item.status }]" @click="select(item)">{{ item.text }}
                    <em :class="{ 'icon-chose': item.status }"></em>
                </li>
            </ul>
            <ul class="int" v-show="navs.int.status">
                <li class="int-item">
                    <label class="ind left">污染点：</label>
                    <div class="inline left point" @click="selectAddress">{{ int.address }}</div>
                    <div class="btn left" v-show="int.submit" @click="newInt">新建模拟</div>
                </li>
                <li class="int-item">
                    <label class="ind left chemical">污染源：</label>
                    <div class="factory">
                        <v-dropdown :list="factory.data" :tip="factory.tip" :auto-dismiss="true" class="dropdown-pd-factory" @select="selectFactory"></v-dropdown>
                    </div>
                    <div class="chemical">
                        <v-dropdown :list="chemical.data" :tip="chemical.tip" :auto-dismiss="true" class="dropdown-pd-chemical" @select="selectChemical"></v-dropdown>
                    </div>
                </li>
                <li class="side int-item">
                    <label>爆炸时间：</label>
                    <div class="inline"><input id="boom-time" class="boomtime" type="text" v-model="int.boomTime" readonly="true" @click="initTimepicker()" /></div>
                </li>
                <li class="side int-item">
                    <label>污染源高度：</label>
                    <div class="inline"><input type="number" v-model="int.height" min="1" max="30" /><span>m</span></div>
                </li>
                <li class="side int-item">
                    <label>泄漏时长：</label>
                    <div class="inline"><input type="number" v-model="int.sustainTime" min="1" max="48" /><span>h</span></div>
                </li>
                <li class="side int-item">
                    <label>泄 漏 速 率：</label>
                    <div class="inline"><input type="number" v-model="int.rate" min="1" max="48" /><span v-html="int.unit"></span></div>
                </li>
            </ul>
            <ul class="progress-bar" v-show="navs.int.status || navs.log.status">
                <li v-for="(item, index) of analysis" :key="index" :class="['progress-item', { on: item.status }]">
                    <em></em>
                    <a :class="[ ((index === 0) && navs.int.status && !int.submit) ? 'submit' : '' ]" @click="submit()">{{ item.text }}</a>
                </li>
            </ul>
            <div class="param" v-show="navs.sim.status || navs.log.status">
                <div class="select-input strength">
                    <span class="select-span">浓度：</span>
                    <v-dropdown :list="strength" :tip="strength[0].text" :auto-dismiss="true" class="dropdown-pd-strength" @select="setStrength"></v-dropdown>
                    <!-- <v-select :list="strength" :tip="strength[0].text" @select="setStrength"></v-select> -->
                </div>
                <div class="select-input mean">
                    <span class="select-span">浓度均值：</span>
                    <v-dropdown :list="mean" :tip="mean[0].text" :auto-dismiss="true" class="dropdown-pd-mean" @select="setMean"></v-dropdown>
                    <!-- <v-select :list="mean" :tip="mean[0].text" @select="setMean"></v-select> -->
                </div>
                <div class="btn back" @click="back" v-show="navs.sim.status">返回</div>
                <div class="btn" @click="getLog()" v-show="navs.log.status">全部记录</div>
                <div class="btn" @click="play">{{ plays.text }}</div>
            </div>
            <div class="sim" v-show="navs.sim.status">
                <table v-show="!!sim.data[0]">
                    <thead><tr><td>选择</td><td>污染源</td><td>预报时间</td></tr></thead>
                    <tbody id="sim-table">
                        <tr v-for="(item, key) in sim.data" :key="key" :class="{ select: item.status }" @click="selectSim(item)">
                            <td><input class="radio" type="radio" name="sim" v-model="sim.item.id" :value="item.id" :id="item.id"/><label :for="item.id" @click.stop></label></td>
                            <td>{{ item.pollname }}</td>
                            <td>{{ item.uptime }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="nodata" v-if=" isNoData && sim.data.length < 1">暂无数据</div>
            </div>
            <div class="log" v-show="navs.log.status">
                <table v-show="!!log.data[0]">
                    <thead><tr><td>选择</td><td>污染源</td><td>爆炸时间</td><td>高度</td><td>泄露<br>速率</td><td>泄露<br>时长</td></tr></thead> <!-- 泄漏<br> -->
                    <tbody id="log-table">
                        <tr v-for="(item, key) in log.data" :key="key" :class="{ select: item.status }" @click="selectLog(item)">
                            <td><input class="radio" type="radio" v-model="log.item.id" :value="item.id" :id="item.id"/><label :for="item.id" @click.stop></label></td>
                            <td>{{ item.pollname }}</td>
                            <td>{{ item.uptime }}</td>
                            <td>{{ item.high }}</td>
                            <td>{{ item.rate }}</td>
                            <td>{{ item.keeptime }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { PollutantDispersion as PD, Model as MD } from '../../utils/tools/Model.js';
// import Select from '../Plugins/Select';
import Dropdown from '../Plugins/Dropdown';

import Timepicker from '../Plugins/Timepicker'

import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default {
    name: 'PollutantDispersion',
    components: {
        'v-timepicker': Timepicker,
        'v-dropdown': Dropdown
        // 'v-select': Select
    },
    data() {
        return {
            navs: {
                sim: { text: '定时模拟', type: 'sim', status: false },
                int: { text: '交互模拟', type: 'int', status: false },
                log: { text: '交互记录', type: 'log', status: false }
            },
            strength: [
                { text: '扩散', value: 'ks' },
                { text: '沉降', value: 'cj' }
            ],
            mean: [
                { text: '24小时', value: 24 },
                { text: '3小时', value: 3 }
            ],
            analysis: [
                { text: '确认提交', status: false },
                { text: '提交成功', status: false },
                { text: '模型运算', status: false },
                { text: '结果反馈', status: false }
            ],
            factory: { data: [], tip: '选择工厂类型' },
            chemical: { data: [], tip: '选择污染物' },
            list: {
                strength: 'ks',
                mean: 24,
                lonlat: null,
                address: null
            },
            sim: { data: [], item: null },
            log: { data: [], item: null },
            int: {
                lon: null,
                lat: null,
                address: '添加污染源',
                code: null,
                rate: 2,
                height: 10,
                boomTime: null,
                sustainTime: 12,
                submit: false,
                unit: 'kg/h'
            },
            plays: { status: false, text: '播放', timer: [] },
            tps: false,
            option: {},
            isNoData: false
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            tipName: state => state.tip.model.name,
            bigScreen: state => state.toolsBar.bigScreen,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        'navs.int.status'(status) {
            this.newInt();
        },
        'navs.sim.status'(status) {
            if (status) {
                this.back();
                lmap.draw.cancel(lmap.map, this.handle);
            } else {
                if (!!this.point.layer) lmap.icon.clear(this.point.layer);
                this.clearParam();
            }
        },
        'navs.log.status'(status) {
            if (status) {
                this.log.data = [];
                this.log.item = null;
                lmap.draw.cancel(lmap.map, this.handle);
                this.getLog(TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'));
            } else {
                this.clearParam();
            }
        },
        'plays.timer'(arr) {
            if (utils.isEmptyArray(arr)) {
                this.plays.status = false;
                this.plays.text = '播放';
            }
        },
        sysTime() {
            if (this.navs.sim.status && !!this.sim.item) {
                this.getSim(false);
                // this.sim.item.uptime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
                // for (let i = 0; i < this.sim.data.length; i++) {
                //     if (new Date(this.sim.data[i].uptime).getTime() === this.sysTime.getTime() && this.sim.item.pollname === this.sim.data[i].pollname) {
                //         this.sim.item = this.sim.data[i];
                //     }
                // }
                // this.selectSim(this.sim.item);
            } else if (this.navs.log.status && !!this.log.item) {
                this.selectLog(this.log.item);
            }
        },
        code() {
            this.isNoData = false;
            this.sim.data = [];
            this.sim.item = null;
            if (!!this.point.layer) lmap.icon.clear(this.point.layer);
            this.clearParam();
            this.initConstData();
            this.initFactory();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化默认参数
         */
        initConstData() {
            this.updateParam(['clickCallback', { PollutantDispersionCallback: this.carryDataAndStatus }]);

            // 绘画要素
            this.drawParam = null;

            // 画笔对象
            this.handle = null;

            // 打点
            this.point = {};

            // 播放定时器
            this.timer = null;

            // 图层请求参数
            this.param = null;

            // 图标样式
            this.style = {

                sim: {
                    isIcon: true,
                    icon: {
                        src: sysconfig.TESTIP + '/topic/little/necImage/pollute.png',
                        anchor: [0.5, 0.5],
                        size: [35, 35],
                        scale: 1
                    },
                    text: {
                        text: '',
                        size: '12px',
                        offsetY: 24,
                        fill: { color: '#ED3F2B', width: 1 }
                    }
                },

                int: {
                    isIcon: true,
                    icon: {
                        src: `${sysconfig.TESTIP}/topic/little/pollutant/pollpoint.png`,
                        anchor: [0.5, 1],
                        size: [28, 40],
                        scale: 1
                    }
                }

            };

            this.urls = {
                factory: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelPoit',
                sim: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelInfoList',
                log: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelInteractionRecord',
                save: sysconfig.TESTPATH + '/pollutantdispersionmodel/savePollutantModelInteraction',
                state: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelInteractionState',
                feed: sysconfig.TESTPATH + '/pollutantdispersionmodel/getPollutantModelInteractionState'
            };

        },

        /**
         * 初始化时间选择插件
         */
        initTimepicker() {
            this.option = {
                id: 'boom-time',
                type: 'boomtime',
                top: 30,
                template: 'YYYY-MM-DD HH:mm:ss',
                date: TU().format('YYYY-MM-DD HH:mm'),
                lock: { min: false, sec: false },
                end: TU().sec(1).format('YYYY-MM-DD HH:mm'),
                autoDismiss: true
            };
            this.tps = true;
        },

        /**
         * 选择时间
         * @param {object} param 时间返回值
         */
        selectTime(param) {
            this.int.boomTime = TU(param.date).format('YYYY-MM-DD HH:mm');
            this.tps = false;
        },

        /**
         * 选择模式
         * @param {object} item 模式对象
         */
        select(item) {
            if (!!this.last && this.last.type !== item.type) {
                this.last.status = false
            }
            item.status = true;
            this.last = item;
        },

        /**
         * 设置浓度
         * @param {object} param 浓度
         */
        setStrength(param) {
            this.list.strength = param.value;
            if (this.navs.sim.status && !!this.sim.item) {
                this.selectSim(this.sim.item);
            } else if (this.navs.log.status && !!this.log.item) {
                this.selectLog(this.log.item);
            }
        },

        /**
         * 设置浓度均值
         * @param {object} param 浓度均值
         */
        setMean(param) {
            this.list.mean = param.value;
            if (this.navs.sim.status && !!this.sim.item) {
                this.selectSim(this.sim.item);
            } else if (this.navs.log.status && !!this.log.item) {
                this.selectLog(this.log.item);
            }
        },

        /**
         * 选择工厂类型
         * @param {object} param 选中工厂信息
         */
        selectFactory(param) {
            const codes = PD.mapping.factory[param.value];
            let data = [];
            for (let i = 0; i < codes.length; i++) {
                const chemical = PD.mapping.chemical[codes[i]];
                data.push({ value: codes[i], text: chemical });
            }
            this.chemical.data = data
            this.chemical.tip = '选择污染物'
        },

        /**
         * 选择污染物
         * @param {object} param 选中污染物信息
         */
        selectChemical(param) {
            this.int.code = param.value;
            this.int.unit = [ 'C137', 'I131' ].includes(param.value) ? '10<sup>14</sup>Bq/h' : 'kg/h';
        },

        /**
         * 选择地图打点
         */
        selectAddress() {
            this.cancelHandle();
            if (!this.drawParam) {
                this.initLayer();
            }
            if (!!this.drawParam.layer) lmap.icon.clear(this.drawParam.layer);
            const event = { end: (e) => this.getAddress(e.feature) };
            const eventParam = { map: lmap.map };
            this.handle = lmap.draw.initHandle(this.drawParam, 'point', event, eventParam, this.style.int);
        },

        /**
         * 地图选点回调事件
         * @param {object} feature 要素对象
         */
        getAddress(feature) {
            lmap.draw.cancel(lmap.map, this.handle);
            lmap.icon.clear(this.drawParam.layer);
            let point = lmap.polygon.getWKT(feature);
            const [ lon, lat ] = point.replace('POINT(', '').replace(')', '').split(' ');
            this.int.lon = lon;
            this.int.lat = lat;
            const url = `${sysconfig.TESTPATH}/atwill/getRoadName`;
            const param = { code: this.code, lonlat: `${lon} ${lat}` }
            feature.setStyle(lmap.style.getStyle(this.style.int));
            utils.GET(url, param).then((json) => {
                if (json.status === 0) {
                    this.int.address = json.data.fullAddress;
                } else {
                    this.int.address = '暂无匹配地点';
                }
            });
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
         * 初始化图层
         */
        initLayer() {
            let drawParam = lmap.layer.initDrawParam(lmap.map, 'poitop');
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
        },

        /**
         * 初始化工厂打点
         */
        initFactory() {
            const param = { code: this.code };
            utils.get(this.urls.factory, param).then((json) => {
                const factorys = json.data.pollutantPoitList;
                this.point.layer = lmap.layer.init(lmap.map, 'poitop');
                const style = Object.assign({}, this.style.sim);
                let features = [];
                for (let factory of factorys) {
                    features.push(lmap.icon.add(this.point.layer, style, [ factory.lon, factory.lat ], { name: 'factory', lon: factory.lon, lat: factory.lat, address: factory.name }));
                }
                this.point.features = features;
            });
        },

        /**
         * 选中工厂
         * @param {object} evt 事件类型
         */
        selectPoint(evt) {
            const clickIndex = this.getClickIndex();
            let feature = lmap.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                return feature;
            });
            if (!!feature && feature.get('name') === 'factory') {
                this.clickPlugin('PollutantDispersionCallback', feature, clickIndex); // 触发poi点击插件
            }
        },

        /**
         * 点击状态修改feature
         * @param {object} feature feature
         */
        carryDataAndStatus(feature) {
            this.clearTimer();
            lmap.icon.clear(this.point.layer);
            const lon = feature.get('lon');
            const lat = feature.get('lat');
            const address = feature.get('address');
            this.list.lonlat = `${lon},${lat}`;
            this.list.address = address;
            const style = Object.assign({}, this.style.sim);
            style.text.text = address;
            lmap.icon.add(this.point.layer, style, [ lon, lat ], { name: 'select-factory' });
            this.getSim();
        },

        /**
         * 返回
         */
        back(e) {
            this.isNoData = false;
            this.sim.data = [];
            this.sim.item = null;
            lmap.icon.clear(this.point.layer);
            lmap.icon.addFeatures(this.point.layer, this.point.features);
            // this.point.layer.getSource().addFeatures(this.point.features);
            this.clearParam();
            this.$emit('clear-filestr')

            if (e && e.type === 'click') {
                this.updateParam(['analysis', { sigCloseAnalysis: Date.now() }])
            }
        },

        /**
         * 查询定时模拟记录
         * @param {boolean} isFirst 初始化标记
         */
        getSim(isFirst = true) {
            const [ lon, lat ] = this.list.lonlat.trim().split(',');
            // const param = { pollType: 'ks', lon: '113.03', lat: '22.50', dateTime: '2018-03-02 20:00:00' };
            const param = { code: this.code, pollType: this.list.strength, lon, lat, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') };
            utils.GET(this.urls.sim, param).then((json) => {
                this.isNoData = true;
                if (Array.isArray(json.data.pollutantModelInfoList)) {
                    json.data.pollutantModelInfoList.reverse()
                }

                this.sim.data = json.data.pollutantModelInfoList;
                if (isFirst) {
                    this.selectSim(this.sim.data[0]);
                } else {
                    for (let i = 0; i < this.sim.data.length; i++) {
                        if (new Date(this.sim.data[i].uptime).getTime() === this.sysTime.getTime() && this.sim.item.pollname === this.sim.data[i].pollname) {
                            this.sim.item = this.sim.data[i];
                            const simtable = document.querySelector('#sim-table');
                            if (this.bigScreen) {
                                simtable.scrollTop = 45 * i;
                            } else {
                                simtable.scrollTop = 30 * i;
                            }
                        }
                    }
                    this.selectSim(this.sim.item);
                }
            });
        },

        /**
         * 选择单个定时模拟记录
         * @param {object} item 单条记录
         */
        selectSim(item) {
            // 无记录时返回
            if (!item) return;
            this.sim.item = item;
            const ddatetime = TU(item.uptime).format('YYYY-MM-DD HH:00:00');
            const dateTimeStr = TU(item.uptime).format('YYYY年MM月DD日HH时');
            const lonlat = this.list.lonlat.replace(',', '_').replace(/\./g, '');
            // const pfmtype = `pollutantDispersion${this.list.mean}_${lonlat}_${this.list.strength}_${item.pollcode}_${this.list.mean}`;
            const pfmtype = `pollutant_${item.factoryname}_${lonlat}_${item.pollcode}_${this.list.strength}_${this.list.mean}_${this.list.mean}`;
            const param = { pfmtype, ddatetime };
            let address = this.list.address;
            address = address.length > 13 ? address.substring(0, 13) + '...' : address;
            this.param = param;
            this.$emit('param', param);
            this.updateParam([ 'tip', { model: { status: true, name: '污染扩散', time: dateTimeStr, ename: `污染源：${address}&nbsp;&nbsp;&nbsp;污染物：${item.pollname}`, highlight: true } } ]);
        },

        /**
         * 查询交互模拟记录
         * @param {string} [dateTime=''] 时间参数
         */
        getLog(dateTime = '') {
            utils.GET(this.urls.log, { code: this.code, dateTime: dateTime, startRow: 1, rows: 100 }).then((json) => {
                this.log.data = json.data.interactionRecord;
                this.selectLog(this.log.data[0]);
            });
        },

        /**
         * 选择单个交互模拟记录
         * @param {object} item 单条记录
         */
        selectLog(item) {
            if (!item) return;
            for (let i = 3; i >= 0; i--) {
                this.analysis[i].status = true;
            }
            this.log.item = item;

            lmap.icon.clear(this.point.layer);

            const style = Object.assign({}, this.style.sim);
            style.text.text = item.name;

            lmap.icon.add(this.point.layer, style, [ item.lon, item.lat ], { name: 'select-factory' });

            const ddatetime = TU(item.uptime).format('YYYY-MM-DD HH:mm:ss');

            const time = TU(item.uptime).format('YYYY年MM月DD日HH时');
            const pfmtype = `pollutantJH_${item.lon}_${item.lat}_${item.pollcode}_${this.list.strength}_${this.list.mean}_${this.list.mean}`;
            const param = { pfmtype, ddatetime };
            let address = item.name;
            address = address.length > 13 ? address.substring(0, 13) + '...' : address;

            this.param = param;
            this.$emit('param', param);

            this.updateParam([ 'tip', { model: { status: true, name: '污染扩散', time, ename: `污染源：${address}&nbsp;&nbsp;&nbsp;污染物：${item.pollname}`, highlight: true } } ]);
        },

        /**
         * 清除提示和图层参数
         */
        clearParam() {
            this.param = null;
            const ename = MD.mapping['pollutantDispersion'].etext;
            this.$emit('param', { pfmtype: '', respTime: '', ddatetime: TU().format('YYYY-MM-DD HH:mm:ss') });
            this.updateParam([ 'tip', { model: { status: true, name: '污染扩散', time: TU().format('YYYY年MM月DD日HH时'), ename: ename } } ]);
        },

        /**
         * 污染扩散播放
         */
        play() {

            const status = this.plays.status = !this.plays.status;
            this.plays.text = status ? '暂停' : '播放';
            if (status && !!this.param) {
                const param = Object.assign({}, this.param);
                let factoryname, lon, lat, pollcode, strength, mean
                if (param.pfmtype.split('_').length < 8) {
                    [ lon, lat, pollcode, strength, mean ] = param.pfmtype.split('_').slice(1);
                } else {
                    [ factoryname, lon, lat, pollcode, strength, mean ] = param.pfmtype.split('_').slice(1);
                }
                const mapping = {
                    3: [ 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48 ],
                    24: [ 24, 48 ]
                }
                let timer = [];
                mapping[mean].forEach(function(element, index) {
                    timer.push(window.setTimeout(() => {
                        const model = (this.navs.log.status) ? 'pollutantJH' : 'pollutant';
                        if (factoryname) param.pfmtype = `${model}_${factoryname}_${lon}_${lat}_${pollcode}_${strength}_${mean}_${element}`;
                        else param.pfmtype = `${model}_${lon}_${lat}_${pollcode}_${strength}_${mean}_${element}`;
                        this.$emit('param', param);
                        this.plays.timer.splice(0, 1);
                    }, 350 * index));
                    this.plays.timer = timer;
                }, this);

            } else if (!status) {

                this.plays.timer.forEach(function(timer) {
                    window.clearTimeout(timer);
                });
                this.plays.timer = [];

            }
        },

        /**
         * 新建交互模拟
         */
        newInt() {
            this.int = { lon: null, lat: null, address: '添加污染源', code: null, rate: 2, height: 10, boomTime: TU().format('YYYY-MM-DD HH:mm'), sustainTime: 12, submit: false, unit: 'kg/h' }
            this.factory.data = Array.from(PD.factory)
            this.factory.tip = '选择工厂类型'
            this.chemical.data = []
            this.chemical.tip = '选择污染物'
            this.analysis.forEach((item) => {
                item.status = false
            })
            if (this.drawParam && this.drawParam.layer) lmap.icon.clear(this.drawParam.layer);
            window.clearTimeout(this.timer)
        },

        /**
         * 提交交互记录
         */
        submit() {
            const int = Object.assign({}, this.int);

            if (!int.lon) return;
            if (!int.lat) return;
            if (!int.code) return;
            if (!int.rate) return;
            if (!int.height) return;
            if (!int.boomTime) return;
            if (!int.sustainTime) return;

            this.int.submit = true;
            this.analysis[0].status = true;

            let rate = int.rate * ([ 'C137', 'I131' ].includes(int.code) ? Math.pow(10, 14) : Math.pow(10, 9));
            rate = (Number(rate).toExponential(1)).toUpperCase();
            let [ pre, suf ] = rate.split('+');
            suf = suf < 10 ? '0' + suf : suf;
            rate = `${pre}+${suf}`;

            const height = Number(int.height).toFixed(1);
            const time = TU(int.boomTime).format('YYYYMMDDHHmm').substring(2, 12);
            const lon = Number(int.lon).toFixed(2);
            const lat = Number(int.lat).toFixed(2);
            const info = `guangdong,${time},${lon},${lat},${height},${rate},${int.sustainTime},${int.code}`;

            utils.GET(this.urls.save, { interactiveMsg: info }).then((json) => {
                this.int.submit = true;
                if (json.data.saveMsg === '保存成功') this.analysis[1].status = true;
                this.timer = window.setTimeout(() => {
                    this.getAnalysisStatus(2, json.data.fileName, int);
                }, 10000);
            });
        },

        /**
         * 获取交互记录状态
         * @param {number} index 状态下标
         * @param {string} fileName 文件名字
         * @param {object} intInfo 结果反馈后所需的poi信息
         */
        getAnalysisStatus(index, fileName, intInfo) {
            if (!!this.timer) {
                window.clearTimeout(this.timer);
                this.timer = null;
            }
            const url = index === 2 ? this.urls.state : this.urls.feed;
            utils.GET(url, { fileName }).then((json) => {
                let state = index;
                if (json.data.state) {
                    for (let i = index; i >= 0; i--) {
                        this.analysis[i].status = true;
                    }
                    if (index !== 3) state = index + 1;
                    // if (index === 3) {
                    //     console.log('打点');
                    //     // 打点
                    //     lmap.icon.clear(this.point.layer);
                    //     const style = Object.assign({}, this.style.sim);
                    //     style.text.text = intInfo.address;
                    //     lmap.icon.add(this.point.layer, style, [ intInfo.lon, intInfo.lat ], { name: 'select-factory' });
                    //     return 0;
                    // }
                }
                this.timer = window.setTimeout(() => {
                    this.getAnalysisStatus(state, fileName, intInfo);
                }, 10000);
            });
        }
    },

    mounted() {
        /* eslint-disable */
        new PS('#log-table');
        new PS('#sim-table');
        this.initConstData();
        this.select(this.navs.sim);
        this.initFactory();
        lmap.map.on('singleclick', this.selectPoint);
    },

    destroyed() {
        if (!!this.point) lmap.layer.remove(lmap.map, this.point.layer);
        if (!!this.drawParam) lmap.layer.remove(lmap.map, this.drawParam.layer);
        lmap.draw.cancel(lmap.map, this.handle);
        lmap.map.un('singleclick', this.selectPoint);
        if (!!this.timer) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    }

}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.pollutantDispersion {
    position: absolute;
    top: 0;
    right: 0;
    background: #fff;
    box-shadow: @shadow;
    width: 382px;
    z-index: 1;
    .nav {
        display: flex;
        background: @bg;
        margin-bottom: 4px;
        .nav-item {
            flex: 1 0 0;
            padding: 6px 10px;
            position: relative;
            text-align: center;
            border-right: 1px solid #ccc;
            border-bottom: 1px solid #ccc;

            &:last-child {
                border-right: none;
            }
            // &.select em.icon-chose {
            //     display: inline-block;
            //     position: absolute;
            //     bottom: 10px;
            //     right: 20px;
            // }
            &.select {
                background: #fff;
                border-bottom: none;
                em.icon-chose {
                    display: none;
                }
            }
        }
    }
    .param {
        margin-left: 7px;
        margin-bottom: 4px;
        .select-input {
            float: left;
            position: relative;
            margin-right: 7px;
            .select-span {
                position: absolute;
                left: 6px;
                top: 50%;
                transform: translateY(-50%);
                .height();
            }
        }
    }
    .btn {
        position: relative;
        &.back {
            padding-left: 32px;
            background: url("../../assets/img/common/back.png") no-repeat 8px center;
        }
    }
    .sim, .log {
        table tr {
            height: 29px;
            line-height: 29px;
        }
        table tbody {
            height: 180px;
        }
    }
    .progress-bar {
        width: 80%;
        margin: 0 auto;
        height: 30px;
        padding: 15px 0 15px 8px;

        .progress-item {
            position: relative;
            float: left;
            width: 32%;
            height: 1px;
            background: #707070;

            em {
                display: inline-block;
                zoom: 1;
                position: absolute;
                width: 22px;
                height: 22px;
                right: -9px;
                top: -10px;
                background: url("../../assets/img/common/line0.png") no-repeat 5px 5px;
            }
            &:first-child {
                width: 5px;
                border: none;
            }
            &.on {
                background: #96cb00;
                em {
                    background: url("../../assets/img/common/line.png") no-repeat 1px 2px;
                }
            }
            a {
                position: absolute;
                right: -30px;
                top: 10px;
                display: inline-block;
                width: auto;
                white-space: nowrap;
                padding: 0 6px;
                .height();
                color: #707070;
                cursor: default;
                &.submit {
                    cursor: pointer;
                    border: 1px solid #ccc;
                }
                a:first-child {
                    left: -28px;
                }
            }
        }
    }
    .sim {
        .nodata {
            width: 100%;
            height: 50px;
            background: #fff;
            text-align: center;
            line-height: 50px;
        }
    }
    .sim, .log {
        td {
            font-style: normal;
            line-height: 12px;
            height: 22px;
            vertical-align: middle;
            text-align: center;
            border-left: 1px solid #e0eaf5;
            border-bottom: 1px solid #e0eaf5;
            padding: 2px;
            word-break: break-all;
            font-weight: 400;
        }
    }
    .sim table td{
        &:first-child {
            width: 32px;
        }
        &:nth-child(2) {
            width: 140px;
        }
        &:nth-child(3) {
            width: 196px;
        }
    }
    .int {
        margin-left: 6px;
        .int-item {
            display: block;
            padding: 4px;
            .height();
            .left {
                float: left;
            }
            .ind {
                .height();
                text-indent: 12px;
            }
            .inline {
                display: inline-block;
            }
            .point {
                background: url("../../assets/img/common/Polluteplace0.png") no-repeat 1px center;
                width: 220px;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                padding-left: 16px;
                .height();
            }
            &.side {
                display: inline-block;
            }

            &:nth-child(3), &:nth-child(4), &:nth-child(5), &:nth-child(6){
                div {
                    background: @title-color;
                    border: 2px solid @title-color;
                }
                input {
                    background: none;
                    border: none;
                }
            }

            &:nth-child(3) {
                input {
                    width: 120px;
                }
            }
            &:nth-child(5) {
                div {
                    width: 120px;
                    position: relative;
                }
                span {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                }
                input {
                    width: 100px;
                }
            }
            &:nth-child(4) {
                div {
                    width: 82px;
                    position: relative;
                }
                span {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                }
            }
            &:nth-child(6) {
                div {
                    width: 84px;
                    position: relative;
                }
                span {
                    position: absolute;
                    top: 0px;
                    right: 0px;
                }
                input {
                    width: 30px;
                }
            }
        }
    }
    .log {
        table {
            td:first-child {
                width: 32px;
            }
            td:nth-child(2) {
                width: 78px;
            }
            td:nth-child(3) {
                width: 126px;
            }
            td:nth-child(4) {
                width: 32px;
            }
            td:nth-child(5) {
                width: 45px;
            }
            td:nth-child(6) {
                width: 45px;
            }
        }
    }
}

.big {
    .pollutantDispersion {

        .sim, .log {
            table tr {
                height: 44px;
                
            }
            table tr td{
                // height: 28px;
                line-height: 20px;
            }
            table tbody {
                height: 180px;
            }
        }

        width: 600px;

        .btn {
            .height-big();
        }

        .progress-bar {
            height: 40px;
            a {
                right: -50px;
                .height-big();
                padding: 0 10px;
            }
        }

        .sim {
            .radio + label:after {
                top: 10px;
            }
            td:nth-child(1) {
                width: 54px;
            }
            td:nth-child(3) {
                width: 392px;
            }
        }

        .log {
            td:nth-child(1) {
                width: 54px;
            }
            td:nth-child(3) {
                width: 240px;
            }
            td:nth-child(4) {
                width: 50px;
            }
            td:nth-child(5) {
                width: 70px;
            }
            td:nth-child(6) {
                width: 70px;
            }
        }

        .int {
            .int-item {
                .height-big();

                label, div {
                    .height-big();
                    float: left;
                }

                label {
                    min-width: 100px;
                }

                &:nth-child(3) {
                    input {
                        width: 158px;
                        font-size: 18px;
                    }
                }

                &:nth-child(4), &:nth-child(5), &:nth-child(6) {
                    div {
                        width: 158px;
                        font-size: 18px;
                        .height-big();

                        input {
                            font-size: 18px;
                            width: 60px;
                            .height-big();
                            text-indent: 10px;
                        }

                        span {
                            top: 0;
                            right: 8px;
                            font-size: 18px;
                            .height-big();
                        }
                    }
                }
            }
        }
    }
}
</style>
