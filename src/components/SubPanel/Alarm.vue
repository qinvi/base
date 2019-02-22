<template>
    <div class="alarmAll">
        <div class="alarm" id="alarm" ref="alarm-box" v-show="showAlarm && !showAlarmTarget">
            <header ref="alarm-title">任意点风险预警</header>
            <span class="backTo" @click="showAlarmFunc()">×</span>
            <div class="alarmOperate">
                <div>
                    <a class="btn hover" @click="marked(1, true)">标记已处理</a>
                    <a class="btn hover" @click="marked(0, true)">取消标记</a>
                    <a class="btn hover" @click="toExcel()">导出</a>
                    <a class="btn hover" @click="targetWarn()">靶向预警</a>
                    <div class="deTime">
                        <span>监测时间：{{deTime}}</span>
                    </div>
                </div>
                <p v-show="alarmList.length">
                    <span v-show="!allStatus && curPageNum[curPage]">已勾选本页{{curPageNum[curPage]}}个POI点</span>
                    <span v-show="allStatus">已勾选全部{{totalNum}}个POI点</span>
                    <span class="alarmAll" @click="batch('all')" v-show="headSelect[curPage] && !allStatus">，&nbsp;&nbsp;勾选全部{{totalNum}}个POI点</span>
                    <span class="alarmAll" @click="batch('curPageOnly')" v-show="headSelect[curPage] && allStatus">，&nbsp;&nbsp;只勾选本页</span>
                </p>
            </div>
            <div class="alarmContent">
                <div v-show="loading" class="loading loading-default is-active"></div>
                <ul v-show="historyStatus === 1">
                    <li :class="{'disabled': headMark[curPage]}">
                        <input type="checkbox" class="checkbox" v-model="headSelect[curPage]"/><label @click.stop="selectHead(curPage, !headSelect[curPage])"></label>
                        <span :title="headField.city">{{headField.city}}</span>
                        <span :title="headField.county">{{headField.county}}</span>
                        <span :title="headField.town">{{headField.town}}</span>
                        <span :class="[showPoi? 'upSelect':'downSelect']" :title="headField.poiTypeCN" @click="showPoi = !showPoi">
                            {{headField.poiTypeCN}}
                            <ul id="poiTypes" v-show="showPoi">
                                <li v-for="(item, index) in poiTypes" :key="index" :title="item.name" @click="TypeFunc('poiTypes', item)">{{ item.name }}</li>
                            </ul>
                        </span>
                        <span :title="headField.poiName">{{headField.poiName}}</span>
                        <span :class="[showWarn? 'upSelect':'downSelect']" :title="headField.name" @click="showWarn = !showWarn">
                            {{headField.name}}
                            <ul id="warnTypes" v-show="showWarn">
                                <li v-for="(item, index) in warnTypes" :key="index" :title="item.name" @click="TypeFunc('warningTypes', item)">{{ item.name }}</li>
                            </ul>
                        </span>
                        <span :title="headField.reason">{{headField.reason}}</span>
                    </li>
                    <li v-for="(item, index) in alarmList" :key="index" @click="fetchToGis($event, item)" :class="{'disabled': itemMark.includes(item.identity + '')}">
                        <input type="checkbox" class="checkbox" :id="item.identity" :value="item.identity + '&' + item.poiId + '&' + item.poiType" v-model="identity"/><label :for="item.identity" @click.stop="tabSelect(item)"></label>
                        <span class="fetchToLonLat" :title="item.city">{{item.city || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.county">{{item.county || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.town">{{item.town || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.poiTypeCN">{{item.poiTypeCN || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.poiName">{{item.poiName || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.name">{{item.warnTypeCN || '--'}}</span>
                        <span class="fetchToLonLat" :title="item.reason">{{item.reason || '--'}}</span>
                    </li>
                </ul>
                <div class="historyStatus" v-show="historyStatus === 2">
                    结果正在计算中，大概1分钟，请稍等......
                </div>
            </div>
            <div class="alarmFooter" v-show="historyStatus === 1">
                <span>{{curPage + 1}}页/共{{countPage + 1}}页</span>&nbsp;&nbsp;&nbsp;
                <span>共{{totalNum}}条数据</span>
                <div>
                    <a class="btn hover" @click="toPage(-1)">上页</a>
                    <a class="btn hover" @click="toPage(1)">下页</a>
                </div>
            </div>
            <form :action="urls.toExcel" method="get" id="alarm-forms" target="alarm-forms" v-show="false">
                <input type="hidden" :name="key" :value="item" v-for="(item, key, i) of inputForm" :key="i">
            </form>
            <iframe name='alarm-forms' v-show="false"></iframe>
        </div>
        <v-alarmTarget v-if="showAlarmTarget" @destroy="cancelTarget()" :source="sourceList" :identity="identity"></v-alarmTarget>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import WinDrag from '../../utils/tools/WinDrag.js';
import PS from 'perfect-scrollbar';
import AlarmTarget from './AlarmTarget';

export default {
    components: { 'v-alarmTarget': AlarmTarget },
    data() {
        return {
            alarmList: [], // 当前页码的列表
            sourceList: [], // 总列表
            curPage: 0, // 当前页
            allStatus: false, // 是否显示勾选全部
            headMark: [false],
            itemMark: [],
            deTime: '', // 监测时间
            totalNum: 0, // 预警点总数目
            countPage: 0, // 总页数
            showPoi: false, // poi类型下拉
            showWarn: false, // 告警类型下拉
            mark: '',
            markValue: '',
            identity: [], // 已勾选的poiId
            headSelect: [false],
            showAlarm: false, // 面板状态
            loading: false, // 加载
            excelUrl: '',
            formShow: false,
            showAlarmTarget: false,
            inputForm: {},
            historyStatus: 2
        }
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            sysMinTime: state => state.time.sysMinTime,
            code: state => state.sys.code,
            navItemsCallback: state => state.toolsBar.navItemsCallback,
            normalPoiDetail: state => state.normalPoiDetail.data,
            belongTo: state => state.normalPoiDetail.belongTo,
            pointsVisible: state => state.alarm.pointsVisible,
            userId: state => state.userSetting.userId,
            initLamp: state => state.alarm.initLamp, // 走马灯初始化
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            wmsImage: state => state.alarm.wmsImage // 走马灯初始化
        })
    },
    watch: {
        code() {
            if ((this.code.length === 2) && !this.lastType.includes('全部')) this.allStatus = false;
            this.lastType = (this.code.length === 2) ? '全部' : '子类型';
            this.getTypes();
        },
        alarmList() { // 不同类型切换的时候
            if (this.alarmList.length) {
                let count = 0;
                let count1 = 0;
                this.alarmList.forEach((ele) => {
                    if (this.identity.includes(ele.identity + '&' + ele.poiId + '&' + ele.poiType)) count++;
                    if (this.itemMark.includes(ele.identity + '')) count1++;
                });
                this.$set(this.curPageNum, this.curPage, count);
                this.$set(this.headSelect, this.curPage, (count === this.alarmList.length));
                this.$set(this.headMark, this.curPage, (count1 === this.alarmList.length));
            }
        },
        identity() {
            if (!!this.identityWatcher.tabSelectItem) this.tabSelect(this.identityWatcher.tabSelectItem, true);
        },
        sysMinTime() {
            this.mark = TU(this.sysMinTime).format('YYYYMMDDHH');
        },
        mark() { // 以小时为单位
            this.lastType = '';
            this.markValue = new Date().getTime();
            this.markChange = true;
            this.getTypes();
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化不需要setter的变量
         */
        initConstData() {
            this.firstTime = 0;
            this.showLonLat = false;
            this.updateParam(['alarm', { showAlarmFunc: this.showAlarmFunc }]);
            this.updateParam(['alarm', { alarmListClick: () => {
                this.showLonLat = false;
            }}]);
            this.headField = { city: '所属市', county: '所属县', town: '所属镇街', poiTypeCN: 'POI点类型', poiName: 'POI点名称', name: '告警类型', reason: '告警原因' };
            this.warnTypes = [
                {name: '全部告警类型', code: 'all'}
            ];
            this.poiTypes = [
                {name: '全部POI类型', code: 'all'}
            ];
            this.params = { // 传给走马灯的参数
                poiTypes: 'all',
                warningTypes: 'all',
                selectPoi: [],
                excludePoi: [], // 隐藏poi、仅当allStatus为true且标记已处理的情况才有效
                mark: this.markValue
            };
            this.markChange = false;
            this.curPageNum = [0]; // 当前页码已勾选的列表项个数
            this.selectPoi = 0;
            this.showPoi = 0;
            this.curPageOnly = -1;
            this.identityWatcher = { tabSelectItem: null, markIdentityType: -1 };
            this.space = 10;
            this.timer = { typeTimer: null, allTimer: null, cancelMarkTimer: null, listTimer: null };
            this.parentTypes = null;
            this.scrollers = [];
            this.lastType = '';
            this.urls = {
                getList: sysconfig.TESTPATH + '/warnPoi/getWarnPoiList',
                getTypes: sysconfig.TESTPATH + '/warnPoi/getWarnPoiType',
                toExcel: sysconfig.TESTPATH + '/warnPoi/exportWarnpPoi'
            };
            this.newPsScroller();
        },

        showAlarmFunc() {
            this.cancelTarget()
            this.showAlarm = !this.showAlarm;
            if (this.showAlarm && this.markChange) {
                this.getList();
                this.markChange = false;
            }
            if (!this.showAlarm) {
                this.showAlarmTarget = false;
                this.navItemsCallback('warn');
            }

            if (!this.showAlarm && this.showLonLat) {
                this.removeSelectPoint('monitor', 'alarm');
                this.showLonLat = false;
            }
        },

        /**
         * poi类型选择
         * @param {string} type 类型
         * @param {object} item 列表项
         */
        TypeFunc(type, item) {
            if (type === 'poiTypes') this.showPoi = false;
            if (type === 'warningTypes') this.showWarn = false;
            if (item.name.includes('全部') && !this.lastType.includes('全部')) this.allStatus = false;
            this.params[type] = item.code;
            this.moduleCallback();
            this.lastType = item.name;
        },

        /**
         * 调用走马灯模块
         */
        moduleCallback(listStatus = true) {
            this.initLamp(this.getModuleParams());
            if (listStatus) this.getList();
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
                const t1 = new PS('#poiTypes', {
                    minScrollbarLength: 20
                });
                const t2 = new PS('#warnTypes', {
                    minScrollbarLength: 20
                });
                this.scrollers = [t1, t2];
            });
        },

        /**
         * 当前页面批处理
         * @param {string} type part | all | curPageOnly
         */
        selectHead(curPage, status, type = 'part') {
            return new Promise((resolve, reject) => {
                this.allStatus = (type === 'all');
                utils.clearTimer(this.timer.allTimer);
                this.timer.allTimer = window.setTimeout(() => {
                    // 更新当前页数据
                    const start = curPage * this.space;
                    let end = (curPage === this.countPage) ? this.totalNum : (start + this.space);
                    let sourceList = this.sourceList;
                    let s = (this.identity.length) ? (',' + this.identity.join(',') + ',') : ',';
                    if (!this.alarmList.length) {
                        this.$set(this.headSelect, curPage, status);
                    } else {
                        if (type === 'all' || type === 'part') {
                            this.$set(this.headSelect, curPage, status);
                            if (status) {
                                this.$set(this.curPageNum, curPage, this.alarmList.length);
                                for (let i = start; i < end; i++) {
                                    if (!s.includes(',' + sourceList[i].identity + '&' + sourceList[i].poiId + '&' + sourceList[i].poiType + ',')) s += sourceList[i].identity + '&' + sourceList[i].poiId + '&' + sourceList[i].poiType + ',';
                                }
                            } else {
                                this.$set(this.curPageNum, curPage, 0);
                                for (let i = start; i < end; i++) {
                                    s = s.replace(',' + sourceList[i].identity + '&' + sourceList[i].poiId + '&' + sourceList[i].poiType, '');
                                }
                            }
                        } else {
                            if (curPage !== this.curPageOnly) { // 只勾选当前页
                                this.$set(this.headSelect, curPage, false);
                                for (let i = start; i < end; i++) {
                                    s = s.replace(',' + sourceList[i].identity + '&' + sourceList[i].poiId + '&' + sourceList[i].poiType, '');
                                }
                            }
                        }
                        this.identity = (s === ',') ? [] : s.substring(1, s.length - 1).split(',');
                        if (type === 'part') this.allStatus = (this.identity.length === this.totalNum);
                    }
                    if (!!resolve) resolve(); // 去执行返回promise对象
                }, 0);
            });
        },

        /**
         * 勾选全部
         */
        async batch(type) {
            this.loading = true;
            if (type === 'all') {
                for (let i = 0; i <= this.countPage; i++) {
                    await this.selectHead(i, true, type);
                }
            } else {
                this.curPageOnly = this.curPage;
                this.curPageNum[this.curPage] = this.alarmList.length;
                for (let i = 0; i <= this.countPage; i++) {
                    await this.selectHead(i, true, type);
                }
            }
            this.loading = false;
        },

        /**
         * 标记已处理、对勾选状态的列表项进行处理
         * @param {number} type 1:添加标记，0:取消标记
         */
        async marked(type, resolve) {
            if (!this.firstTime) return;
            this.removeSelectPoint('monitor', 'alarm');
            this.updateParam(['normalPoiDetail', {type: ''}]);
            this.loading = true;
            this.identityWatcher.markIdentityType = type;
            if (resolve) {
                if (type) { // 添加标记
                    await this.addMarked();
                    // this.itemMark = JSON.parse(JSON.stringify(this.identity));
                    // this.headMark = JSON.parse(JSON.stringify(this.headSelect));
                }
                else { // 取消标记
                    if (this.itemMark.length) {
                        await this.cancelMarked();
                    }
                }
                this.identityWatcher.markIdentityType = -1;
                this.moduleCallback(false);
            }
            this.loading = false;
        },

        /**
         * 添加标记
         */
        addMarked() {
            this.identity.forEach((ele) => {
                ele = ele.split('&')[0]
                if (!this.itemMark.includes(ele)) this.itemMark.push(ele);
            });
            let count = 0;
            this.alarmList.forEach((ele) => {
                if (this.itemMark.includes(ele.identity + '')) count++;
            });
            this.$set(this.headMark, this.curPage, (count === this.alarmList.length));
            this.itemMark = Object.assign([], this.itemMark, []);
        },

        /**
         * 取消标记
         */
        cancelMarked() {
            return new Promise((resolve, reject) => {
                utils.clearTimer(this.timer.cancelMarkTimer);
                this.timer.cancelMarkTimer = window.setTimeout(() => {
                    let s = ',' + this.itemMark.join(',') + ',';
                    this.identity.forEach((ele) => {
                        ele = ele.split('&')[0];
                        if (this.itemMark.includes(ele)) s = s.replace(',' + ele + ',', ',');
                    });
                    this.itemMark = s.substring(1, s.length - 1).split(',');
                    this.headSelect.forEach((ele, i) => {
                        if (!ele && this.headMark[i]) this.$set(this.headMark, i, false);
                        if (ele) this.$set(this.headMark, i, false);
                    });
                    if (!!resolve) resolve(); // 去执行返回promise对象
                }, 0);
            });
        },

        /**
         * 勾选列表
         * @param {object} item 列表项
         * */
        tabSelect(item, resolve = false) {
            this.identityWatcher.tabSelectItem = item;
            if (resolve) {
                const curPage = this.curPage;
                if (this.identity.includes(item.identity + '&' + item.poiId + '&' + item.poiType)) this.$set(this.curPageNum, curPage, this.curPageNum[curPage] + 1);
                else this.$set(this.curPageNum, curPage, this.curPageNum[curPage] - 1);
                this.$set(this.headSelect, curPage, (this.curPageNum[curPage] === this.alarmList.length));
                this.allStatus = (this.identity.length === this.totalNum);
                this.identityWatcher.tabSelectItem = null;
            }
        },

        /**
         * 上页、下页
         *
         * @param {number} b -1/1 上页/下页
         */
        toPage(b) {
            const curPage = this.curPage + b;
            if (curPage < 0 || curPage > this.countPage) return;
            else this.curPage = curPage;
            // 更新当前页数据
            const start = curPage * this.space;
            let end = (curPage === this.countPage) ? this.totalNum : (start + this.space);
            // 全选、只勾选当前页面都需要批量操作
            const alarmList = this.sourceList.filter((ele, index) => {
                if (start <= index && index < end) return ele;
            });
            if (!this.curPageNum[curPage]) this.curPageNum[curPage] = 0;
            this.alarmList = alarmList;
        },

        /**
         * 关闭告警列表
         */
        backTo() {
            // 触发工具栏关闭
        },

        /**
         * 导出
         */
        toExcel() {
            const { poiTypes, warningTypes, selectPoi, mark } = this.getModuleParams();
            if (!selectPoi) {
                alert('请勾选数据');
                return;
            }
            const { signTime, sign } = utils.generateAuthInfo();
            let dateTime = TU(this.sysMinTime).format('YYYY-MM-DD+HH:mm:ss');
            const url = 'code=' + this.code + '&signTime=' + signTime + '&sign=' + sign + '&poiTypes=' + poiTypes + '&warningTypes=' + warningTypes + '&selectPoi=' + selectPoi + '&mark=' + mark + '&dateTime=' + dateTime;
            let s;
            url.split('&').forEach((ele) => {
                s = ele.split('=');
                this.inputForm[s[0]] = s[1];
            });
            this.inputForm = Object.assign({}, this.inputForm, {});
            this.$nextTick(() => {
                document.getElementById('alarm-forms').submit();
            });
        },

        /**
         * 取消靶向预警
         */
        cancelTarget() {
            this.showAlarmTarget = false;
            let params = this.getModuleParams();
            params.selectPoi = '';
            this.wmsImage(params);
        },

        /**
         * 靶向预警
         */
        targetWarn() {
            this.showAlarmTarget = true;
            this.wmsImage(this.getModuleParams());
        },

        /**
         * 点击列表项与地图进行联动
         *
         * @param {object} e 事件对象
         * @param {object} item 下标对象
         */
        fetchToGis(e, item) {
            if (e.target.classList.value.includes('fetchToLonLat')) {
                let url = sysconfig.TESTPATH + '/warnPoi/getPoiDetail';
                const {poiTypes, warningTypes} = this.getParams();
                let params = {
                    mark: '',
                    lon: item.lon,
                    lat: item.lat,
                    poiTypes: poiTypes,
                    dateTime: TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss'),
                    zoom: lmap.util.getZoom(lmap.view),
                    warningTypes: warningTypes,
                };

                if (!this.pointsVisible) {
                    this.updateParam(['alarm', { pointsVisible: Date.now() }])
                }

                utils.GET(url, params).then((json) => {
                    if (json.status === 0) {
                        const lonLat = [Number(item.lon), Number(item.lat)];
                        if (!isNaN(lonLat[0]) && lonLat[0]) {
                            this.showLonLat = true;
                            const activeType = this.callbackActiveType();
                            this.updateParam(['selectPoint', { lonlat: lonLat, type: 'monitor&alarm' }]);
                            if (activeType.normal === 'alarm') {
                                this.updateParam(['normalPoiDetail', {type: ''}]);
                                this.removeSelectPoint('normal', 'alarm');
                            }
                        }
                    }
                }).catch((ex) => {
                })
                lmap.ctrl.panTo(lmap.map, [item.lon, item.lat], 13);
            }
        },

        getModuleParams() {
            let t = [];
            this.identity.forEach((ele) => {
                t.push(ele.split('&')[0]);
            });
            this.params.selectPoi = t; // this.identity;
            this.params.excludePoi = this.itemMark;
            this.params.mark = this.markValue;
            let selectPoi = this.params.selectPoi.join(',');
            let excludePoi = this.params.excludePoi.join(',');
            if (selectPoi === ',') selectPoi = '';
            if (excludePoi === ',') excludePoi = '';
            const params = {
                poiTypes: this.params.poiTypes,
                warningTypes: this.params.warningTypes,
                selectPoi: selectPoi,
                excludePoi: excludePoi,
                mark: this.params.mark
            }
            return params;
        },

        /**
         * 获取请求参数
         */
        getParams() {
            let {poiTypes, warningTypes} = this.params;
            let time;
            time = this.firstTime ? this.sysMinTime : new Date();
            this.firstTime = 1;
            return {
                poiTypes,
                warningTypes,
                code: this.code,
                mark: this.markValue, // this.mark,
                selectPoi: '',
                showPoi: '',
                dateTime: TU(time).format('YYYY-MM-DD HH:mm:ss'),
                userId: this.userId
            };
        },

        /**
         * 请求列表
         */
        getTypes() {
            utils.clearTimer(this.timer.typeTimer);
            this.timer.typeTimer = window.setTimeout(() => {
                const { code, dateTime, userId } = this.getParams();
                const params = { code, dateTime, userId };
                utils.GET(this.urls.getTypes, params).then((json) => {
                    this.packTypesData(json.data);
                });
            }, 80);
        },

        /**
         * 清除所有數據狀態
         */
        clearAllStatus() {
            this.headMark = [false]
            this.itemMark = []
            this.mark = ''
            this.identity = []
            this.headSelect = [false]
            this.allStatus = false
        },

        /**
         * 组装类型数据
         * @param {object} data 类型数据
         */
        packTypesData(data) {
            this.parentTypes = data;
            let s = '';
            let t = this.poiTypes;
            let t1 = this.warnTypes;
            data.poiTypes.forEach((ele, i) => {
                s += ',' + ele.code;
                t[i + 1] = ele;
            });
            s = s.substr(1);
            t[0].code = s;
            this.params.poiTypes = s;
            s = '';
            data.warnTypes.forEach((ele, i) => {
                s += ',' + ele.code;
                t1[i + 1] = ele;
            });
            s = s.substr(1);
            t1[0].code = s;
            this.params.warningTypes = s;
            this.params = Object.assign({}, this.params, {});
            this.clearAllStatus()
            this.moduleCallback();
        },

        /**
         * 请求数据
         */
        getList() {
            if (!this.showAlarm) return;
            const { code, dateTime, poiTypes, warningTypes, mark, selectPoi, showPoi } = this.getParams();
            const params = { code, dateTime, poiTypes, warningTypes, mark, selectPoi, showPoi };
            this.historyStatus = 2;
            utils.GET(this.urls.getList, params).then((json) => {
                this.historyStatus = json.data.status;
                if (json.data.status === 1) {
                    this.deTime = json.data.detectTime;
                    this.sourceList = json.data.poiData;
                    this.curPage = this.sourceList.length ? -1 : 0;
                    this.totalNum = this.sourceList.length;
                    this.countPage = Math.ceil(this.totalNum / 10) - 1;
                    this.headMark = new Array(this.countPage + 1);
                    if (!this.sourceList.length) this.alarmList = [];
                    else this.toPage(1);
                } else {
                    utils.clearTimer(this.timer.listTimer);
                    this.timer.listTimer = window.setTimeout(() => {
                        return this.getList()
                    }, 3000);
                }
            });
        }
    },
    created() {
        this.initConstData();
    },
    mounted() {
        WinDrag.init(this.$refs['alarm-title'], this.$refs['alarm-box'], lmap.map);
        this.getTypes();
    },
    destroyed() {
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.alarmAll { position: relative; }
.alarm {
    position: fixed;
    z-index: 3;
    top: 31px;
    right: 0px;
    min-width: 640px;
    max-width: 640px;
    max-height: 100%;
    background: #fff;
    box-shadow: @shadow;
    .backTo {
        position: absolute;
        cursor: pointer;
        width: 25px;
        height: 24px;
        top: -5px;
        right: 0px;
        font-size: 17px;
        text-align: center;
        color: red;
    }
    .poiType, .warnType {
        font-size: 10px;
        position: absolute;
        z-index: 4;
        min-height: 20px;
        max-height: 80px;
        width: 84px;
        top: 111px;
        left: 236px;
        overflow-y: auto;
        text-align: center;
        background: #fff;
        border-left: 1px solid #ccc;
        border-right: 1px solid #ccc;
        border-bottom: 1px solid #ccc;
        li {
            line-height: 20px;
            overflow: hidden;
            text-overflow:ellipsis;
            white-space: nowrap;
            font-size: 12px;
        }
        li:hover {
            background: #ccc;
        }
    }
    .warnType {
        width: 99px;
        left: 410px;
    }
    header {
        background: rgb(236, 242, 252);
        height: 24px;
        line-height: 24px;
        padding-left: 5px;
        text-align: left;
    }
    .alarmOperate {
        margin-top: 11px;
        height: 43px;
        text-align: left;
        div {
            display: inline-block;
            margin-bottom: 4px;
            a {
                margin: 0 5px 0 5px;
            }
        }
        .deTime {
            position: relative;
            font-size: 13px;
            left: 115px;
        }
        p {
            text-align: center;
            margin: -10px;
            .alarmAll{
                cursor: pointer;
                color: rgb(48, 134, 210)
            }
        }
    }
    .alarmContent {
        .historyStatus {
            margin-bottom: 17px;
        }
        ul {
            li {
                .checkbox {
                    & + label {
                        margin-right: 0px;
                        height: 16px;
                        left: 3px;
                        &::before {
                            margin-top: -15px !important;
                        }
                    }
                    &:checked + label {
                        &::before {
                        }
                        &::after {
                            top: 0px;
                        }
                    }
                }
            }
        }
        #poiTypes {
            width: 16%;
        }
        #warnTypes {
            width: 15%;
        }
        #poiTypes, #warnTypes {
            position: absolute;
            z-index: 1;
            top: 24px;
            box-shadow: @shadow;
            // top: 110px;
            background: #fff;
            max-height: 93px;
            // padding-right: 6px;
            li {
                width: 97%;
                margin: 0px;
                border: none;
                text-align: center;
                overflow: hidden;
                text-overflow:ellipsis;
                white-space: nowrap;
                &:hover {
                    background: #666;
                    color: #FFF;
                }
            }
        }
        .downSelect:after {
            content: '';
            display: inline-block;
            margin-left: 10px;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #ccc;
        }
        .upSelect:after {
            content: '';
            display: inline-block;
            margin-left: 10px;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 5px solid #ccc;
        }
        .cbox {
            position: relative;
            display: inline-block;
            cursor: pointer;
            top: -4px;
            left: 2px;
            width: 12px;
            height: 12px;
            border: 1px solid #ccc;
            margin: 0 6px 0 5px;
        }

        li:nth-child(1) {
            font-weight: bold;
        }

        li {
            position: relative;
            height: 23px;
            line-height: 23px;
            border-bottom: 1px solid #ccc;
            &.disabled {
                color: #c0c0c0;
                // .checkbox {
                //     &:checked + label {
                //         &::before {
                //             background: url('../../assets/css/checkbox-marked.svg');
                //             background-size: 16px 16px;
                //         }
                //     }
                // }
            }
            // padding-left: 5px;
            span {
                display: inline-block;
                box-sizing: border-box;
                max-height: 23px;
            }
            span:not(:first-child) {
                border-left: 1px solid #ccc;
                text-align: center;
                overflow: hidden;
                text-overflow:ellipsis;
                white-space: nowrap;
                padding: 0 2px 0 2px;
            }
            span:nth-child(3),span:nth-child(4) {
                min-width: 9%;
                max-width: 9%;
            }
            span:nth-child(5) {
                min-width: 11%;
                max-width: 11%;
            }
            span:nth-child(6) {
                min-width: 16%;
                max-width: 16%;
            }
            span:nth-child(7) {
                min-width: 17%;
                max-width: 17%;
            }
            span:nth-child(8) {
                min-width: 15%;
                max-width: 15%;
            }
            span:nth-child(9) {
                min-width: 16%;
                max-width: 16%;
            }
        }
        li:nth-child(1) {
            margin-top: 8px;
            border-top: 1px solid #ccc;
        }
    }
    .alarmFooter {
        margin: 7px 0;
        /*overflow: auto;*/
        height: 27px;
        line-height: 24px;
        padding-left: 9px;
        text-align: left;
        div {
            float: right;
            a {
                margin-right: 15px;
            }
        }
    }
}
.big .alarm {
    min-width: 860px;
    a {
        font-size: inherit;
    }
    .backTo {
        top: -10px;
    }
    header {
        height: 28px;
        line-height: 28px;
    }
    .alarmOperate {
        height: 60px;
        .deTime {
            font-size: inherit;
        }

        p {
            margin-top: -20px;
        }
    }
    .alarmContent {
        li {
            height: 30px;
            span {
                padding: 3px 2px;
                max-height: 30px;
                margin-right: -3px;
            }
            .checkbox {
                & + label {
                    left: 0px;
                }
            }
        }
        #poiTypes, #warnTypes {
            top: 31px;
        }
    }
    .alarmFooter {
        height: 30px;

        div {
            a {
                height: 32px;
                line-height: 28px;
                text-align: center;
            }
        }
    }
}
</style>
