<template>
    <div>
        <div :class="[ 'target-panel', { 'bigScreen': bigScreen } ]" ref="alarm-target-panel">
            <div class="target-div title" ref="alarm-target-title">
                <span>任意点风险预警-靶向预警</span>
                <a class="close" @click="close"></a>
            </div>
            <ul class="target-div tab-ul">
                <li v-for="(item, key) in publist" :key="key">
                    <span :class="{ 'selected': curPub === item.id }" @click="selectPubType(item.id)">{{ item.name }}</span>
                </li>
            </ul>
            <div class="target-div">
                <label class="label-name"><span class="name">发布对象</span><span class="colon">：</span></label>
                <div class="target-box target-box-count">
                    <ul>
                        <li v-for="(item, key) in curDuty" :key="key">{{ item.name }}-<label class="focus">{{ item.count }}个</label></li>
                    </ul>
                    <span class="btn btn-duty" @click="showDutyTable()">责任人列表</span>
                    <v-target-table v-if="dutyStatus" :data="tableData" @close="dutyStatus = false"></v-target-table>
                </div>
            </div>
            <div v-show="loading" class="loading loading-default is-active"></div>
            <div class="target-div">
                <label class="label-name"><span class="name">发布渠道</span><span class="colon">：</span></label>
                <div class="target-box">
                    <span>决策短信</span>
                </div>
            </div>
            <div class="target-div">
                <label class="label-name">
                    <span class="require">*</span><span class="name">发布模板</span><span class="colon">：</span>
                </label>
                <div class="target-box target-box-pub">
                    <div @click="selectShowRoot()"><span>{{ curTemplate.planName }}</span><span :class="[ 'sarrow', { 'sarrow-selected': templateStatus.root } ]"></span></div>
                    <ul class="pub-root" v-if="templateStatus.root">
                        <li v-for="(items, key) in curPlan" :key="key">
                            <label style="cursor:pointer" @click="selectShowLeaf(key)"><span>{{ key === templateStatus.leaf ? '-' : '+' }}</span>{{ key }}</label>
                            <ul class="pub-leaf" v-if="key === templateStatus.leaf">
                                <li v-for="(item, key) in items" :key="key" @click="selectPubTemplate(item)">{{ item.planName }}</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="target-div" v-if="curPub === 1">
                <label class="label-name"><font class="require">*</font><font class="name">事件类别</font><font class="colon">：</font></label>
                <div class="target-box target-box-event">
                    <v-dropdown :list="firstEventType.list" :tip="firstEventType.tip" @select="selectEventType"></v-dropdown>
                    <v-dropdown :list="secondEventType.list" :tip="secondEventType.tip" @select="selectEventType"></v-dropdown>
                    <v-dropdown :list="thirdEventType.list" :tip="thirdEventType.tip" @select="selectEventType"></v-dropdown>
                </div>
            </div>
            <div class="target-div" v-else-if="curPub === 2">
                <label class="label-name"><span class="require">*</span><span class="name">预警类别</span><span class="colon">：</span></label>
                <div class="target-box target-box-warn">
                    <v-dropdown :list="warnType.list" :tip="warnType.tip" @select="selectWarnType"></v-dropdown>
                </div>
            </div>
            <div class="target-div">
                <label class="label-name"><span class="require">*</span><span class="name">预警级别</span><span class="colon">：</span></label>
                <div class="target-box">
                    <div v-for="(item, key) in levels" :key="key">
                        <input type="radio" :value="item.value" v-model="curLevel" :id="'a'+ item.value"/>
                        <label :for="'a' + item.value">{{ item.name }}</label>
                    </div>
                    <span class="label-tip" v-if="curPub === 2 && curWarnType.code === ''">选择“预警类别”后会显示对应的级别选项</span>
                </div>
            </div>
            <div class="target-div">
                <label class="label-name"><span class="require">*</span><span class="name">信息类型</span><span class="colon">：</span></label>
                <div class="target-box">
                    <div v-for="(item, key) in msgType" :key="key">
                        <input type="radio" :value="item.value" v-model="curMsgType" :id="'a'+ item.value"/>
                        <label :for="'a'+ item.value">{{ item.name }}</label>
                    </div>
                </div>
            </div>
            <div class="target-div">
                <label class="label-name"><span class="require">*</span><span class="name">正文</span><span class="colon">：</span></label>
                <div class="target-box target-box-msg">
                    <textarea v-model="curMsg"></textarea>
                </div>
            </div>
            <div class="target-div clearfix">
                <label class="label-name"><span class="name">临时号码</span><span class="colon">：</span></label>
                <div class="target-box target-box-mobile">
                    <input v-model="curMobile" placeholder="请输入手机号码，多个以英文“,”分隔开"/>
                </div>
            </div>
            <div class="target-div">
                <div class="target-box target-box-foot">
                    <div class="features">
                        <label class="btn" @click="reset()">重置</label>
                        <label :class="[ 'btn', { 'btn-disabled': !btnStatus } ]" @click="sendTarget">发送</label>
                    </div>
                    <div class="tip" v-if="tip !== ''">
                        <div class="icon-analysis-baseData"></div>
                        <label>{{ tip }}</label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Dropdown from '../Plugins/Dropdown';
import TargetTable from '../PopupBox/TargetTable';

export default {
    props: [ 'source', 'identity' ],
    name: 'AlarmTarget',
    components: {
        'v-dropdown': Dropdown,
        'v-target-table': TargetTable
    },
    data() {
        return {
            loading: true,
            publist: [ { name: '突发事件', id: 1 }, { name: '气象预警', id: 2 } ],
            stUserCode: '',
            curPlan: {},
            templateStatus: {},
            curPub: 2,
            curTemplate: {},
            msgType: [],
            curMsgType: '',
            levels: [],
            curLevel: '',
            curMobile: '',
            curMsg: '',
            curDuty: [],
            dutyStatus: false,
            tableData: {},
            tip: '',

            // 预警发布
            warnType: {},
            curWarnType: {},

            // 事件发布
            firstEventType: {},
            secondEventType: {},
            thirdEventType: {},
            curFirstEventType: {},
            curSecondEventType: {},
            curThirdEventType: {}
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            userName: state => state.userSetting.userName,
            userId: state => state.userSetting.userId,
            authStatus: state => state.userSetting.targetPermission,
            bigScreen: state => state.toolsBar.bigScreen,
            poiEnameMapping: state => state.userSetting.poiEnameMapping,
            holder: state => state.hideAll.holder
        }),
        btnStatus() {
            return this.authStatus && !utils.isEmptyString(this.stUserCode);
        }
    },

    watch: {
        curPub() {  // 发布模型
            this.reset();
        },
        curPlan() { // 模板列表
            this.curTemplate = Object.assign({}, this.defaultTemplate);
        },
        curTemplate(template) {  // 模板详情
            this.templateStatus = Object.assign({}, this.defaultTemplateStatus);
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        initConstData() {
            this.timer = { load: null };
            this.planMap = { 1: {}, 2: {} };
            this.channelMap = { SMS: '决策短信' };
            this.msgTypeMap = [
                { name: '实际', value: 'Actual' },
                { name: '演练', value: 'Exercise' },
                { name: '测试', value: 'Test' },
                { name: '草稿', value: 'Draft' }
            ];
            this.eventLevelMap = [
                { value: '1', name: 'Ⅰ级' },
                { value: '2', name: 'Ⅱ级' },
                { value: '3', name: 'Ⅲ级' },
                { value: '4', name: 'Ⅳ级' },
                { value: '6', name: '解除' },
                { value: '9', name: '其他' }
            ];
            this.warnLevelMap = { '1': '红色', '2': '橙色', '3': '黄色', '4': '蓝色', '5': '白色', '6': '解除' };
            this.warning = {
                tip: '请选择预警类别',
                map: {
                    '11B01': { code: '11B01', text: '台风', levels: ['1', '2', '3', '4', '5', '6'] },
                    '11B03': { code: '11B03', text: '暴雨', levels: ['1', '2', '3', '6'] },
                    '11B06': { code: '11B06', text: '大风', levels: ['1', '2', '3', '4', '6'] },
                    '11B09': { code: '11B09', text: '高温', levels: ['1', '2', '3', '6'] },
                    '11B14': { code: '11B14', text: '雷电', levels: ['3', '6'] },
                    '11B15': { code: '11B15', text: '冰雹', levels: ['1', '2', '6'] },
                    '11B17': { code: '11B17', text: '大雾', levels: ['1', '2', '3', '6'] },
                    '11B19': { code: '11B19', text: '灰霾', levels: ['3', '6'] },
                    '11B20': { code: '11B20', text: '雷雨大风', levels: ['1', '2', '3', '4', '6'] },
                    '11B21': { code: '11B21', text: '道路结冰', levels: ['1', '2', '3', '6'] },
                    '11B25': { code: '11B25', text: '森林火险', levels: ['1', '2', '3', '6'] },
                    '11B34': { code: '11B34', text: '寒冷', levels: ['1', '2', '3', '6'] },
                    '11B43': { code: '11B43', text: '雷暴', levels: ['3', '6'] },
                    '11B44': { code: '11B44', text: '停课信号', levels: ['1', '6'] }
                }
            };
            this.defaultTableData = { listMark: '', mark: '', typeSet: [], totalNumMap: {}, phoneNum: '' };
            this.defaultTemplateStatus = { root: false, leaf: '' };
            this.defaultTemplate = { planName: '请选择发布模板' };
            this.defaultFirstEventType = { text: '', code: '', zoom: 1, child: [] };
            this.defaultSecondEventType = { text: '', code: '', zoom: 2, child: [] };
            this.defaultThirdEventType = { text: '', code: '', zoom: 3 };
            this.defaultWarnType = { code: '', text: '', levels: [] };
            this.defaultMsgType = 'Actual';
            this.eventThird = { tip: '请选择三级分类(非必选)', list: [] };
            this.eventSecond = { tip: '请选择二级分类(非必选)', list: [] };
            this.eventFirst = { tip: '请选择一级分类', list: [] };
            this.damageKind = null;

            this.tableData = Object.assign({}, this.defaultTableData);
            this.curMsgType = this.defaultMsgType;
            this.msgType = Object.assign([], this.msgTypeMap);
            this.warnType = Object.assign({}, { tip: this.warning.tip, list: Object.values(this.warning.map) });
            this.curWarnType = Object.assign({}, this.defaultWarnType);
            this.thirdEventType = Object.assign({}, this.eventThird);
            this.secondEventType = Object.assign({}, this.eventSecond);
            this.templateStatus = Object.assign({}, this.defaultTemplateStatus);
            this.curTemplate = Object.assign({}, this.defaultTemplate);
            this.curFirstEventType = Object.assign({}, this.defaultFirstEventType);
            this.curSecondEventType = Object.assign({}, this.defaultSecondEventType);
            this.curThirdEventType = Object.assign({}, this.defaultThirdEventType);
        },

        close() {
            this.$emit('destroy');
        },

        /**
         * @description 发送靶向预警
         */
        sendTarget() {
            this.tip = this.getTip(true);
            if (this.tip === '') {
                let url = sysconfig.TESTPATH + '/atwill/sendTargetMessage';
                utils.post(url, this.getParams()).then((json) => {
                    if (json.data && json.data.targetIds) {
                        this.updateParam([ 'trackMin', { status: true, id: json.data.targetIds[0] } ]);
                    }
                });
            }
        },

        /**
         * @description 获取发送参数
         */
        getParams() {
            let param = {
                targetType: this.curPub,
                planID: this.curTemplate.planId,
                demageLevel: this.curLevel,
                msgStatus: this.curMsgType,
                msgContent: this.curMsg,
                temporaryNumber: this.getMobile().join(','),
                msgWay: 'SMS',
                stUsername: this.stUserCode,
                username: this.userName,
                poiType: '',
                countPerson: this.getCountPerson(),
                alarmType: '2'
            };
            let child = {
                '2': {
                    warningCode: this.curWarnType.code,
                    warningName: this.curWarnType.text
                },
                '1': {
                    firstDemageName: this.curFirstEventType.text,
                    firstDemageCode: this.curFirstEventType.code,
                    secondDemageName: this.curSecondEventType.text,
                    secondDemageCode: this.curSecondEventType.code,
                    thirdDemageName: this.curThirdEventType.text,
                    thirdDemageCode: this.curThirdEventType.code
                }
            }
            return Object.assign({}, param, child[this.curPub]);
        },

        getMobile() {
            let curMobile = this.curMobile.replace(/\s+/g, '');
            let mobile = curMobile.split(',').filter(function(ele, index, array) {
                return ele.length > 0;
            });
            mobile = mobile.concat(this.tableData.phoneNum.split(','));
            return mobile;
        },

        getCountPerson() {
            let countPerson = [];
            this.curDuty.forEach(ele => {
                countPerson.push(ele.name + '-' + ele.count + '个');
            });
            return countPerson.join(',');
        },

        /**
         * @description 获取事件发布类型列表，并赋值一级类别
         * @event damageKind
         * @event firstEventType
         */
        requestDamageKind() {
            let url = sysconfig.TESTPATH + '/atwill/listDamageKind';
            utils.get(url).then((json) => {
                let listDamageKind = json.data.resp;
                let childFirst = [];
                listDamageKind.forEach(ele => {
                    let childSecond = [];
                    ele.childs.forEach(ele => {
                        let childThird = [];
                        ele.childs.forEach(ele => {
                            childThird.push({ code: ele.code, text: ele.name, zoom: 3 });
                        });
                        childSecond.push({ code: ele.code, text: ele.name, zoom: 2, child: childThird });
                    });
                    childFirst.push({ code: ele.code, text: ele.name, zoom: 1, child: childSecond });
                });
                this.damageKind = childFirst;
                this.firstEventType = Object.assign({}, this.eventFirst, { list: this.damageKind });
            });
        },

        /**
         *  @description 切换事件类别
         */
        selectEventType(param) {
            switch (param.zoom) {
                case 1:
                    /** 修改一级菜单 */
                    this.curFirstEventType = param;
                    this.firstEventType.tip = param.text;
                    /** 修改二级菜单 */
                    this.curSecondEventType = this.defaultSecondEventType;
                    this.secondEventType = Object.assign({}, this.eventSecond, { list: param.child });
                    /** 修改三级菜单 */
                    this.curThirdEventType = this.defaultThirdEventType;
                    this.thirdEventType = Object.assign({}, this.eventThird);
                    break;
                case 2:
                    /** 修改二级菜单 */
                    this.curSecondEventType = param;
                    this.secondEventType.tip = param.text;
                    /** 修改三级菜单 */
                    this.curThirdEventType = this.defaultThirdEventType;
                    this.thirdEventType = Object.assign({}, this.eventThird, { list: param.child });
                    break;
                case 3:
                    /** 修改三级菜单 */
                    this.thirdEventType.tip = param.text;
                    this.curThirdEventType = param;
                    break;
            }
        },

        /**
         *  @description 切换预警类别
         */
        selectWarnType(param) {
            this.warnType.tip = param.text;
            this.curWarnType = param;
            this.curLevel = '';
            this.levels = this.getLevels(param);
        },

        /**
         *  @description 模板菜单状态
         */
        selectShowRoot() {
            this.templateStatus.root = !this.templateStatus.root;
        },

        /**
         * @description 展示模板二级菜单
        */
        selectShowLeaf(leaf) {
            if (this.templateStatus.leaf === leaf) {
                this.templateStatus.leaf = '';
            } else {
                this.templateStatus.leaf = leaf;
            }
        },

        /**
         *  @description 切换发布类型
         */
        selectPubType(id) {
            this.curPub = id;
        },

        /**
         *  @description 展示责任人列表
         */
        showDutyTable() {
            this.dutyStatus = !this.dutyStatus;
        },

        /**
         *  @description 切换模板
         */
        selectPubTemplate(template) {
            // 请求获取模板详情
            let param = { planId: template.planId, unitId: template.unitId };
            let url = sysconfig.TESTPATH + '/atwill/targetPlanDetail';
            utils.get(url, param).then((json) => {
                let curTemplate = null;
                if (json.status === 0 && json.data.result) {
                    curTemplate = json.data.result;
                    // 预警类别、事件类别
                    switch (curTemplate.alertType) {
                        case '1':
                            // 一级菜单
                            let curFirstEventType = this.getObjByCode(this.firstEventType.list, curTemplate.firstLevel, this.defaultFirstEventType);
                            let firstEventTypeTip = this.getTypeTip(curFirstEventType, this.eventFirst.tip);
                            this.firstEventType.tip = firstEventTypeTip;
                            this.curFirstEventType = Object.assign({}, curFirstEventType);
                            // 二级菜单
                            let secondEventTypelist = Object.assign([], curFirstEventType.child);
                            let curSecondEventType = this.getObjByCode(curFirstEventType.child, curTemplate.secondLevel, this.defaultSecondEventType);
                            let secondEventTypeTip = this.getTypeTip(curSecondEventType, this.eventSecond.tip);
                            this.curSecondEventType = Object.assign({}, curSecondEventType);
                            this.secondEventType = Object.assign({}, { 'tip': secondEventTypeTip }, { 'list': secondEventTypelist });
                            // 三级菜单
                            let thirdEventTypelist = Object.assign([], curSecondEventType.child);
                            let curThirdEventType = this.getObjByCode(curSecondEventType.child, curTemplate.thirdLevel, this.defaultThirdEventType);
                            let thirdEventTypeTip = this.getTypeTip(curThirdEventType, this.eventThird.tip);
                            this.curThirdEventType = Object.assign({}, curThirdEventType);
                            this.thirdEventType = Object.assign({}, { 'tip': thirdEventTypeTip }, { 'list': thirdEventTypelist });
                            // 事件级别
                            let curLevel = '';
                            this.eventLevelMap.some(ele => {
                                if (ele.value === curTemplate.warningLevel) {
                                    curLevel = ele.value;
                                    return true;
                                }
                            });
                            this.curLevel = curLevel;
                            break;
                        case '2':
                            let curWarnType = this.warning.map[curTemplate.warningType] ? this.warning.map[curTemplate.warningType] : this.defaultWarnType;
                            this.curWarnType = curWarnType;
                            this.levels = this.getLevels(curWarnType);
                            this.curLevel = this.getCurLevel(curWarnType, curTemplate.warningLevel);
                            this.warnType.tip = utils.isEmptyString(curWarnType.text) ? this.warnType.tip : curWarnType.text;
                            break;
                    }
                }
                this.curTemplate = Object.assign({}, this.defaultTemplate, curTemplate);
            });
        },

        /**
         * 处理数据
         */
        dealData() {
            let poiIds = [];
            let poiTypes = new Set();
            return new Promise((resolve, reject) => {
                let t;
                this.timer.load = window.setTimeout(() => {
                    this.identity.forEach((ele) => {
                        t = ele.split('&');
                        poiIds.push(t[1]);
                        poiTypes.add(t[2]);
                    });
                    this.loading = false;
                    resolve({poiIds, poiTypes});
                }, 10);
            });
        },

        async getContactsCount() {
            let returnObj;
            await this.dealData().then(resolve => {
                returnObj = resolve;
            }, reject => {});
            let { poiIds, poiTypes } = returnObj;
            let param = { poiIds: poiIds.join(','), code: this.code };
            let url = sysconfig.TESTPATH + '/atwill/getContactsCount';
            utils.post(url, param).then((json) => {
                let tableData = Object.assign({}, this.defaultTableData);
                let curDuty = [];
                if (json.status === 0 && json.data) {
                    if (json.data.listMark) tableData.listMark = json.data.listMark;
                    if (json.data.mark) tableData.mark = json.data.mark;
                    tableData.typeSet = poiTypes;
                    if (json.data.phoneNum) tableData.phoneNum = json.data.phoneNum;
                    poiTypes.forEach(poiType => {
                        let count = json.data.totalNumMap && json.data.totalNumMap[poiType] ? json.data.totalNumMap[poiType] : 0;
                        tableData.totalNumMap[poiType] = count;
                    });
                    poiTypes.forEach(poiType => {
                        let count = json.data.poiCount && json.data.poiCount[poiType] ? json.data.poiCount[poiType] : 0;
                        let name = this.poiEnameMapping[poiType] ? this.poiEnameMapping[poiType].Name : '--';
                        curDuty.push({ name: name, count: count });
                    });
                }
                this.curDuty = curDuty;
                this.tableData = tableData;
            });
        },

        /**
         * @description 根据省突账号、发布类型获取模板列表
         */
        requestPublist() {
            if (utils.isEmptyObject(this.planMap[this.curPub])) {
                let param = { stUserCode: this.stUserCode, alterType: this.curPub };
                let url = sysconfig.TESTPATH + '/atwill/listTargetPlan';
                utils.get(url, param).then((json) => {
                    let plan = {};
                    if (!!json.data && !utils.isEmptyObject(json.data.planMap)) {
                        plan = json.data.planMap;
                    }
                    this.planMap[this.curPub] = plan;
                    this.curPlan = Object.assign({}, plan);
                });
            } else {
                this.curPlan = Object.assign({}, this.planMap[this.curPub]);
            }
        },

        /**
         * @description 请求获取省突账号
         */
        requestStUserCode() {
            let param = { userId: this.userId };
            let url = sysconfig.TESTPATH + '/login/getStUserCodeByDssUserId';
            utils.get(url, param).then((json) => {
                let stUserCode = '';
                if (!!json.data && !utils.isEmptyString(json.data.stUserCode)) {
                    stUserCode = json.data.stUserCode;
                }
                this.stUserCode = stUserCode;
                this.tip = this.getTip();
                this.requestPublist();
            });
        },

        /**
         *  @description 返回事件模板的类别
         *  @param {array} 类别列表
         *  @param {string} 类别code(源数据)
         *  @param {object} 默认类别对象
         *  @returns {object} 类别对象(合法的) e.g: { code: '11B00', text: '自然灾害', zoom: 1 }
         */
        getObjByCode(list, code, defaultObj) {
            let obj = {};
            if (list) {
                list.some(ele => {
                    if (ele.code === code) {
                        obj = ele;
                        return true;
                    }
                });
            }
            return Object.assign({}, defaultObj, obj);
        },

        /**
         *  @description 获取类别的tip
         *  @param {object} 类别对象
         *  @param {string} 默认tip
         */
        getTypeTip(obj, defaultTip) {
            let tip = defaultTip;
            if (!utils.isEmptyString(obj.text)) {
                tip = obj.text;
            }
            return tip;
        },

        /**
         *  @description 获取预警等级数组
         *  @param {object} 预警类型
         *  @returns {array} 等级数组 e.g: [ { name: '红色', value: '1' } ]
         */
        getLevels(obj) {
            let levels = []
            obj.levels.forEach(ele => {
                if (!!this.warnLevelMap[ele]) {
                    levels.push({ value: ele, name: this.warnLevelMap[ele] });
                }
            });
            return levels;
        },

        /**
         *  @description 获取级别(合法的)
         *  @param {object} 预警类别
         *  @param {string} 级别(源数据)
         *  @returns {string} 级别(合法的)
         */
        getCurLevel(warnType, level) {
            let curLevel = '';
            if (warnType.levels.includes(level)) {
                curLevel = level;
            }
            return curLevel;
        },

        /**
         *  @description 校验参数、权限
         *  @param {boolean} 权限校验 or 参数校验
         */
        getTip(send = false) {
            let params = this.getParams();
            const countPerson = params.countPerson;
            let noPerson = true;
            countPerson.split(',').every(ele => {
                if (!ele.includes('0')) noPerson = false
                return (ele.includes('0'));
            });
            // params.countPerson
            if (!this.btnStatus) return '该账号无发送功能，需使用专属账号或后台绑定省突账号发送';
            if (!send) return '';
            if (utils.isEmptyString(countPerson) || noPerson) return '发布对象不能为空';
            if (!params.planID) return '发布模板不能为空';
            if (this.curPub === '1' && utils.isEmptyString(params.firstDemageCode)) return '预警类别不能为空';
            if (this.curPub === '2' && utils.isEmptyString(params.warningCode)) return '预警类别不能为空';
            if (utils.isEmptyString(params.demageLevel)) return '预警级别不能为空';
            if (utils.isEmptyString(params.msgStatus)) return '信息类型不能为空';
            if (utils.isEmptyString(params.msgContent)) return '正文不能为空';
            if (this.getMobile().length > 300) return '一次发送的短信不能超过300条';
            if (this.isNotPhoneNumber(params.temporaryNumber)) return '临时号码的格式不对';
            return '';
        },

        isNotPhoneNumber(str) {
            if (str.length === 0) return false;
            const regexp = /^1[34578]\d{9}$/;
            let phoneArr = str.replace(/\s+/g, '').split(',');
            let notPhoneNumber = false;
            phoneArr.some(phone => {
                if (!regexp.test(phone)) {
                    notPhoneNumber = true;
                    return true;
                }
            });
            return notPhoneNumber;
        },

        /** @description 重置变量 */
        reset() {
            this.requestPublist();
            this.templateStatus = Object.assign({}, this.defaultTemplateStatus);
            this.curTemplate = Object.assign({}, this.defaultTemplate);
            this.curMsgType = this.defaultMsgType;
            if (this.curPub === 1) this.levels = Object.assign([], this.eventLevelMap);
            if (this.curPub === 2) this.levels = [];
            this.curLevel = '';
            this.curMobile = '';
            this.curMsg = '';
            this.dutyStatus = false;
            this.tip = this.getTip();
            this.warnType = Object.assign({}, { tip: this.warning.tip, list: Object.values(this.warning.map) });
            this.curWarnType = this.curWarnType = Object.assign({}, this.defaultWarnType);
            this.firstEventType = Object.assign({}, this.eventFirst, { list: this.damageKind });
            this.thirdEventType = Object.assign({}, this.eventThird);
            this.secondEventType = Object.assign({}, this.eventSecond);
            this.curFirstEventType = Object.assign({}, this.defaultFirstEventType);
            this.curSecondEventType = Object.assign({}, this.defaultSecondEventType);
            this.curThirdEventType = Object.assign({}, this.defaultThirdEventType);
        }

    },

    mounted() {
        this.$nextTick(() => {
            WD.init(this.$refs['alarm-target-title'], this.$refs['alarm-target-panel'], lmap.map);
        });
        this.initConstData();
        this.requestStUserCode();
        this.requestDamageKind();
        this.getContactsCount();
    },

    destroyed() {
    }
};
</script>

<style scoped lang='less'>
@import "../../assets/css/common.less";
.target-panel {
    position: fixed;
    top: 31px;
    right: 0;
    width: 440px;
    background-color: #fff;
    box-shadow: @shadow;
    z-index: @panel-index;
}
.target-div {
    display:flex;
    display: -webkit-flex;
    margin: 10px 10px;
    align-items: baseline;
    line-height: 100%;
}

.title {
    margin: 0;
    align-items: center;
}

.btn-disabled {
    background: #ddd;
    color: #888;
    &:hover {
        box-shadow: none;
        cursor: not-allowed;
    }
}
textarea {
    resize: none;
}
.label-name {
    display: flex;
    display: -webkit-flex;
    width: 70px;
    justify-content: space-between;
    .require {
        color: red;
        font-size: 120%;
    }
    .name {
        text-align: right;
        flex: 1;
    }
    .colon {
        align-self: auto;
    }
}

.target-box {
    flex: 1;
    display: flex;
    display: -webkit-flex;
    label {
        cursor: pointer;
    }
}

.target-box-foot {
    flex-flow: row-reverse nowrap;
    height: 45px;
    justify-content: space-between;
    .tip {
        flex: 6;
        display:flex;
        display: -webkit-flex;
        justify-content: flex-start;
        align-items: center;
        .icon-analysis-baseData {
            align-self: center;
            &:before {
                font-size: 15px;
                color: red;
                padding-right: 10px;
            }
        }
        label {
            color: red;
            text-align: left;
        }
    }
    .features {
        align-self: flex-end;
        right: 0px;
    }
}

.target-box-count {
    line-height: 24px;
    ul {
        flex: 1;
        text-align: left;
        li {
            display: inline-block;
            line-height: 24px;
            padding-right: 10px;
            .focus {
                color: red;
            }
        }
    }
}

.target-box-mobile input {
    flex: 1;
    text-indent: 0.7em;
    height: 22px;
}

.target-box-msg textarea{
    flex: 1;
    height: 80px;
}

.target-box-warn .dropdown {
    flex: 1;
}

.target-box-event {
    justify-content: space-between;
    .dropdown {
        width: 110px;
    }
}

.tab-ul {
    li {
        width: 65px;
        span {
            display: inline-block;
            width: 100%;
            &.selected {
                color: @select-font-color;
            }
        }
        &:first-child {
            order: 1;
            span{
                text-align: right;
            }
        }
        &:nth-last-child(1) {
            order: 0;
            span {
                text-align: left;
                border-right: 1px solid #c2c2c2;
            }
        }
    }
}

.target-box-pub {
    position: relative;
    >div {
        box-sizing: border-box;
        flex: 1;
        height: 28px;
        border: 1px solid #c2c2c2;
        cursor: pointer;
        line-height: 100%;
        text-align: left;
        text-indent: 0.7em;
        padding: 7px 0;
        .sarrow {
            position: relative;
            top: 6px;
            float: right;
            width: 20px;
            height: inherit;
            background: url(../../assets/img/common/sarrow.png) no-repeat right;
            transform: translateY(-50%) rotate(0deg);
            transition: transform 0.3s;
        }
        .sarrow-selected {
            transform: translateY(-50%) rotate(180deg);
        }
    }
    .pub-root {
        position: absolute;
        top: 100%;
        width: 100%;
        border: 1px solid #c2c2c2;
        border-top-width: 0;
        z-index: 999;
        background-color: white;
        text-align: left;
        box-sizing: border-box;
        li {
            box-sizing: border-box;
            width: 100%;
            padding: 3px 0;
            label {
                padding-left: 2%;
                span {
                    display: inline-block;
                    margin-right: 2%;
                    background-color: @select-font-color;
                    color: white;
                    text-align: center;
                    line-height: 100%;
                    width: 12px;
                }
            }
        }
    }
    .pub-leaf {
        li {
            text-align: left;
            padding-left: 8%;
            &:hover {
                background-color: #ecf2fc;
            }
        }
    }
}

.bigScreen {
    top: 45px;
    width: 600px;

    .tab-ul li {
        width: 100px;
    }

    .label-name {
        width: 115px;
    }

    .target-box-pub {
        >div {
            height: 38px;
            text-indent: 0.4em;
            .sarrow {
                top: 10px;
            }
        }
    }

    .target-box-event {
        .dropdown {
            width: 150px;
        }
    }

    .target-box-mobile input {
        height: 32px;
        font-size: 20px;
        text-indent: 0.4em;
    }

    .target-box-pub .pub-root li label span {
        width: 18px;
    }

    .target-box-count ul li {
        line-height: 32px;
    }
}

</style>
