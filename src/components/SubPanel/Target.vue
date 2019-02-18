<template>
    <div class="target">
        <div class="mask" v-show="fullScreen"></div>
        <div class="targetWraper" :style="computeStyle">
            <div class="tab-ul">
                <ul>
                    <li v-for="(item, key) in publist" :key="key">
                        <span :class="{ 'selected': curPub === item.id }" @click="selectPubType(item.id)">{{ item.name }}</span>
                    </li>
                </ul>
                <a class="close" v-if="fullScreen" @click="fullScreen=!fullScreen"></a>
            </div>
            <div :class="[ 'target-panel', { 'fullScreen': fullScreen } ]">
                <div class="panel-left" style="float:left">
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
                                <input type="radio" :value="item.value" v-model="curLevel" :id="'t'+item.value"/>
                                <label :for="'t'+item.value" style="vertical-align: middle;">{{ item.name }}</label>
                            </div>
                            <span class="label-tip" v-if="curPub === 2 && curWarnType.code === ''">选择“预警类别”后会显示对应的级别选项</span>
                        </div>
                    </div>
                    <div class="target-div">
                        <label class="label-name"><span class="require">*</span><span class="name">信息类型</span><span class="colon">：</span></label>
                        <div class="target-box">
                            <div v-for="(item, key) in msgType" :key="key">
                                <input type="radio" :value="item.value" v-model="curMsgType" :id="'t'+item.value"/>
                                <label :for="'t'+item.value" style="vertical-align: middle;">{{ item.name }}</label>
                            </div>
                        </div>
                    </div>
                    <div class="target-div" style="align-items: flex-start;">
                        <label class="label-name specialName"><span class="require">*</span><span class="name">发布范围</span><span class="colon">：</span></label>
                        <div class="target-box target-box-effect">
                            <ul>
                                <li v-for="(town, index) in curtowns" :key="index">
                                    <p :title="town">{{ town }}</p>
                                    <span @click="deleTown(index)">x</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="target-div" style="align-items: flex-start;">
                        <label class="label-name specialName"><span class="require">*</span><span class="name">正文</span><span class="colon">：</span></label>
                        <div class="target-box target-box-msg">
                            <textarea v-model="curMsg" placeholder="请输入正文"></textarea>
                        </div>
                    </div>
                </div>
                <div class="panel-right" style="float:left">
                    <div class="target-div" style="align-items: flex-start;">
                        <label class="label-name specialName" ><span class="require">*</span><span class="name">POI责任人类型</span><span class="colon">：</span></label>
                        <div class="target-box target-box-duty">
                            <textarea v-model="curDuty" @click="showBaseinfo()" readonly placeholder="请点击选择POI责任人"></textarea>
                            <span class="btn btn-duty" @click="showDutyTable()">责任人列表</span>
                            <div :class="['baseInfoWrap', {'fullScreen': fullScreen}]" v-if="dutyStatus.baseInfo">
                                <v-min-base-info :cacheId="cacheId" :type="'target'" :destory="true" :ideaOnly="true" :forCheck="tableData.typeSet" @selectPoi="selectPoi"></v-min-base-info>
                            </div>
                        </div>
                    </div>
                    <div class="target-div clearfix">
                        <label class="label-name"><span class="name">临时号码</span><span class="colon">：</span></label>
                        <div class="target-box target-box-mobile">
                            <input v-model="curMobile" placeholder="请输入手机号码，多个以英文“,”分隔开" style="margin:0"/>
                        </div>
                    </div>
                    <div class="target-div clearfix">
                        <label class="label-name"><span class="require">*</span><span class="name">统计分析</span><span class="colon">：</span></label>
                        <div class="target-box target-box-count">
                            <ul>
                                <li v-for="(item, key) in count" :key="key">{{ item.text }}-<label class="focus">{{ item.val }}{{ item.unit }}</label></li>
                            </ul>
                        </div>
                    </div>
                    <div class="target-div" style="align-items: flex-start;">
                        <label class="label-name" style="line-height:23px"><span class="require">*</span><span class="name">发布渠道</span><span class="colon">：</span></label>
                        <div class="target-box target-box-channel">
                            <ul v-if="curTemplate.planId">
                                <li v-for="(item, key) in channels" :key="key">
                                    <input class="checkbox" type="checkbox" :id="item.value" :value="item.value" v-model="curChannels" />
                                    <label :for="item.value">{{ item.name }}</label>
                                </li>
                            </ul>
                            <label class="label-tip" v-else>选择“发布模板”后会显示对应的渠道选项</label>
                        </div>
                    </div>
                </div>
                <div class="target-div target-btn">
                    <div class="target-box target-box-foot">
                        <div class="features">
                            <label class="btn" @click="fullScreen = !fullScreen">{{ fullScreen ? '退出全屏' : '全屏编辑' }}</label>
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
        <v-target-table v-if="dutyStatus.dutyTable" :data="tableData" @close="dutyStatus.dutyTable = false"></v-target-table>
    </div> 
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Dropdown from '../Plugins/Dropdown';
import MinBaseInfo from './TargetMinBaseInfo'; // TargetMinBaseInfo MinBaseInfo
import TargetTable from '../PopupBox/TargetTable';
import IScroll from 'iscroll';

export default {
    props: ['data', 'type', 'cacheId'],
    name: 'Target',
    components: {
        'v-dropdown': Dropdown,
        'v-min-base-info': MinBaseInfo,
        'v-target-table': TargetTable
    },
    data() {
        return {
            publist: [ { name: '气象预警', id: 2 }, { name: '突发事件', id: 1 } ],
            fullScreen: false,
            stUserCode: '',
            curPlan: {},
            templateStatus: {},
            curPub: 2,
            curTemplate: {},
            msgType: [],
            curMsgType: '',
            levels: [],
            curLevel: '',
            channels: [],
            curChannels: [],
            wkt: '',
            curtowns: {},
            count: {
                LCD_LED: { text: 'LED显示屏', val: 0, unit: '个' },
                // SMS_USER: { text: '责任人', val: 0, unit: '人' }
                TYFON: { text: '大喇叭', val: 0, unit: '个' }
            },
            curMobile: '',
            curMsg: '',
            curDuty: '',
            dutyStatus: {},
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
            analysisCode: state => state.level.analysisCode,
            holder: state => state.hideAll.holder,
            modelParam: state => state.model.param,
            sysTime: state => state.time.sysTime
        }),
        btnStatus() {
            return this.authStatus && !utils.isEmptyString(this.stUserCode);
        },

        computeStyle() {
            let t = '';
            if (this.fullScreen) {
                if (this.bigScreen) {
                    t = {
                        'position': 'fixed',
                        'top': 0,
                        'right': 0,
                        'bottom': 0,
                        'left': 0,
                        'margin': 'auto',
                        'width': '1180px',
                        'height': '640px',
                        'background': '#fff'
                    }
                } else {
                    t = {
                        'position': 'fixed',
                        'top': 0,
                        'right': 0,
                        'bottom': 0,
                        'left': 0,
                        'margin': 'auto',
                        'width': '880px',
                        'height': '500px',
                        'background': '#fff'
                    }
                }
            }
            return t;
        }
    },

    watch: {
        'data.list'(val) {
            this.curtowns = Object.assign({}, this.data.list);
        },
        fullScreen(val) {
            this.updateParam([ 'target', { fullScreen: val } ]);
        },
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
            this.planMap = { 1: {}, 2: {} };
            this.updateParam(['target', {belong: this.type}]);
            this.channelMap = { XXYPT: '信息员平台', SMS: '决策短信', ALERTSMS: '预警短信', LED: '电子显示屏', SPEAKER: '大喇叭', WEIBO: '微博', WEIXIN: '微信', FAX: '传真', TV: '应急气象频道', PHONE: '12121外呼', QXCLIENT: '广东应急气象客户端', EMAIL: '电子邮件', Mailbox: '12121信箱', WEB: '应急气象网', CHARGER: '责任人短信', DESKTOP: '桌面插件', BROADCAST: '茂名海洋电台' };
            this.msgTypeMap = [ // INFOMENBER
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
            this.defaultDutyStatus = { baseInfo: false, dutyTable: false };
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
            this.dutyStatus = Object.assign({}, this.defaultDutyStatus);
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
            this.scroll = null;
            // this.setScroll();
        },

        /**
         * 设置scroll
         */
        setScroll() {
            this.$nextTick(() => {
                if (this.scroll) {
                    this.scroll.refresh();
                } else {
                    /* eslint-disable */
                    this.scroll = new IScroll('#alarmTargetScroll', {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                }
            });
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
                        this.fullScreen = false;
                    }
                });
            }
        },

        /**
         * @description 获取发送参数
         */
        getParams() {
            let msgWay = this.curChannels.join(',');
            if (msgWay.includes(',XXYPT')) msgWay = msgWay.replace(',XXYPT', ',INFOMENBER');
            else if (msgWay.includes('XXYPT,')) msgWay = msgWay.replace('XXYPT,', 'INFOMENBER,');
            else msgWay = msgWay.replace('XXYPT', 'INFOMENBER');
            let param = {
                targetType: this.curPub,
                planID: this.curTemplate.planId,
                demageLevel: this.curLevel,
                msgStatus: this.curMsgType,
                effectArea: Object.keys(this.curtowns).join(','),
                msgContent: this.curMsg,
                temporaryNumber: this.curMobile,
                msgWay: msgWay,
                polygon: this.wkt,
                stUsername: this.stUserCode,
                username: this.userName,
                poiTypes: this.tableData.typeSet.join(','),
                countPerson: this.curDuty.replace(/、/g, ','),
                alarmType: '1'
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
            this.updateParam([ 'target', {otherStatus: null} ]);
        },

        /**
         *  @description 展示基础数据面板
         */
        showBaseinfo() {
            this.dutyStatus.baseInfo = !this.dutyStatus.baseInfo;
        },

        /**
         *  @description 展示责任人列表
         */
        showDutyTable() {
            this.dutyStatus.dutyTable = !this.dutyStatus.dutyTable;
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
                    // 发布渠道
                    let channels = this.getChannels(curTemplate.inUseChannel);
                    let curChannels = [];
                    channels.forEach(ele => {
                        curChannels.push(ele.value);
                    });
                    this.channels = channels;
                    this.curChannels = curChannels;
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
                // this.setScroll();
            });
        },

        /**
         *  @description 选定POI类型，请求返回责任人统计
         *  @param {array} Poi类型
         */
        selectPoi(poiTypes) {
            this.dutyStatus = Object.assign({}, this.defaultDutyStatus);
            // 注释的参数 polygon: this.wkt, effectArea: Object.keys(this.curtowns).join(',')
            let param = { poiTypes: poiTypes.join(','), code: this.code };
            if (this.type === 'model') {
                param.modelType = this.modelParam.modelType;
                param.levels = this.modelParam.levels;
                param.dateTime = TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss');
            } else if (this.type === 'atwill') {
                param.cacheId = this.cacheId;
            }
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
                    let head = '';
                    poiTypes.forEach(poiType => {
                        head = poiType.includes('EMERGENCY') ? '应急物资_' : poiType.includes('RESCUE') ? '救援力量_' : '';
                        let count = json.data.poiCount && json.data.poiCount[poiType] ? json.data.poiCount[poiType] : 0;
                        let name = this.poiEnameMapping[poiType] ? (head + this.poiEnameMapping[poiType].Name) : '--';
                        curDuty.push(name + '-' + count + '个');
                    });
                }
                this.curDuty = curDuty.join('、');
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
         * @description 1、请求获取省突账号；2、请求获取模板列表
         */
        async requestStUserCode() {
            const param = { userId: this.userId };
            const url = sysconfig.TESTPATH + '/login/getStUserCodeByDssUserId';
            await utils.get(url, param).then((json) => {
                if (json.data && !utils.isEmptyString(json.data.stUserCode)) {
                    this.stUserCode = json.data.stUserCode;
                }
            });
            this.tip = this.getTip();
            this.requestPublist();
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
         *  @description 组装发布范围数据
         *  @event wkt
         *  @event curtowns 发布范围
         *  @event count 统计分析
         */
        buildAtwill() {
            if (this.data) {
                if (this.data.wkt) {
                    this.wkt = this.data.wkt
                }
                if (this.data.list) {
                    this.curtowns = Object.assign({}, this.data.list);
                }
                if (this.data.count) {
                    let types = Object.keys(this.data.count);
                    types.forEach(function(t) {
                        if (!!this.count[t]) {
                            this.count[t].val = this.data.count[t] || 0;
                        }
                    }, this);
                }
            }
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
         *  @description 获取渠道数组
         *  @param {string} 渠道源数据 e.g: "DESKTOP,TV,SMS"
         *  @returns {arrays} 渠道对象数组 e.g: [ {name: '决策短信', value: 'SMS' } ]
         */
        getChannels(value) {
            let channels = [];
            value.split(',').forEach(ele => {
                if (this.channelMap[ele]) {
                    channels.push({ name: this.channelMap[ele], value: ele });
                }
            });
            return channels;
        },

        /**
         *  @description 校验参数、权限
         *  @param {boolean} 权限校验 or 参数校验
         */
        getTip(send = false) {
            if (!this.btnStatus) return '该账号无发送功能，需使用专属账号或后台绑定省突账号发送';
            if (!send) return '';
            let params = this.getParams();
            if (!params.planID) return '发布模板不能为空';
            if (this.curPub === '1' && utils.isEmptyString(params.firstDemageCode)) return '预警类别不能为空';
            if (this.curPub === '2' && utils.isEmptyString(params.warningCode)) return '预警类别不能为空';
            if (utils.isEmptyString(params.demageLevel)) return '预警级别不能为空';
            if (utils.isEmptyString(params.msgStatus)) return '信息类型不能为空';
            if (utils.isEmptyString(params.effectArea)) return '发布范围不能为空';
            if (utils.isEmptyString(params.msgContent)) return '正文不能为空';
            if (utils.isEmptyString(this.tableData.phoneNum)) return 'POI责任人不能为空';
            if (this.isNotPhoneNumber(params.temporaryNumber)) return '临时号码的格式不对';
            if (utils.isEmptyString(params.msgWay)) return '发布渠道不能为空';
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
            this.channels = [];
            this.curChannels = [];
            this.curMobile = '';
            this.curMsg = '';
            this.curDuty = '';
            this.dutyStatus = Object.assign({}, this.defaultDutyStatus);
            this.tableData = Object.assign({}, this.defaultTableData);
            this.tip = this.getTip();
            this.warnType = Object.assign({}, { tip: this.warning.tip, list: Object.values(this.warning.map) });
            this.curWarnType = this.curWarnType = Object.assign({}, this.defaultWarnType);
            this.firstEventType = Object.assign({}, this.eventFirst, { list: this.damageKind });
            this.thirdEventType = Object.assign({}, this.eventThird);
            this.secondEventType = Object.assign({}, this.eventSecond);
            this.curFirstEventType = Object.assign({}, this.defaultFirstEventType);
            this.curSecondEventType = Object.assign({}, this.defaultSecondEventType);
            this.curThirdEventType = Object.assign({}, this.defaultThirdEventType);
            this.updateParam([ 'target', {otherStatus: null} ]);
            this.curtowns = Object.assign({}, this.data.list);
        },
        /**
         * 删除发布城镇范围
         * @param key
         */
        deleTown(index) {
            this.$delete(this.curtowns, index);
        }

    },

    mounted() {
        this.initConstData();
        this.requestStUserCode();
        this.requestDamageKind();
        this.buildAtwill();
    },

    destroyed() {
        this.updateParam([ 'target', {otherStatus: null} ]);
    }
};
</script>

<style scoped lang='less'>
@import "../../assets/css/common.less";
.mask {
    z-index: 0;
    opacity: 0.5;
}
.targetWraper {
    position: relative;
    height: 418px;
    padding-top: 30px;
    // overflow-y: auto;
    // overflow: hidden;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}
.target-panel {
    // padding: 0 10px;
    height: 100%;
    overflow-y: auto;
    .panel-left,.panel-right {
        box-sizing: border-box;
        padding: 0 10px;
        width: 100%;
    }
    &.fullScreen {
        .panel-left,.panel-right {
            box-sizing: border-box;
            width: 50%;
            padding: 0 10px;
        }
    }
    
}
.target-div {
    display:flex;
    display: -webkit-flex;
    margin: 10px 0;
    align-items: center;
    line-height: 100%;
    &:first-child {
        // margin: 10px 0 0 0;
    }
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
    line-height: 28px;
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
    &.specialName {
        line-height: 23px;
    }   
}

.target-box {
    flex: 1;
    display: flex;
    display: -webkit-flex;
    input {
        // display: inline-block;
        vertical-align: middle;
        margin-bottom: 2px;
    }
    label {
        cursor: pointer;
        margin: 0;
        // vertical-align: middle;
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

.target-box-channel {
    line-height: 23px;
    ul {
        flex: 1;
        display:flex;
        display: -webkit-flex;
        flex-flow: row wrap;
        li {
            display: inline-block;
            padding-right: 10px;
            padding-bottom: 8px;
            line-height: 23px;
        }
        .checkbox:checked + label::after{
            top: 5px;
        }
    }
}

.target-box-count {
    ul {
        flex: 1;
        text-align: left;
        li {
            display: inline-block;
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

.target-box-duty {
    position: relative;
    justify-content: space-between;
    textarea {
        width: 80%;
        // height: 100px;
        cursor: pointer;
    }
    .btn-duty {
        margin-left: 2%;
        height: 100%;
        width: 18%;
    }
    .baseInfoWrap {
        border: 1px solid #ccc;
        background: #fff;
        position: absolute;
        top: 50px;
        // right: 0px;
        z-index: @pop-index;
        box-shadow: @shadow;
        .min-base-info {
            width: 331px;
        }
        // &.fullScreen .min-base-info {
        //     width: 391px;
        // }
    }
}

.target-box-msg textarea{
    flex: 1;
    height: 80px;
}

.target-box-effect {
    ul {
        flex: 1;
        // display:flex;
        // display: -webkit-flex;
        // flex-flow: row wrap;
        border: 1px solid #c2c2c2;
        height: 48px;
        overflow-y: auto;
        text-align: left;
        // align-items: baseline;
        li {
            display: inline-block;
            background: #edf0f3;
            margin: 2px 2px;
            padding: 0 5px;
            width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            p {
                float: left;
                line-height: 20px;
                width: 85%;
                text-align: center;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap
            }
            span {
                float: right;
                font-weight: bold;
                line-height: 18px;
            }
        }
    }
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
    position: absolute;
    top: 0;
    left: 0;
    background: #fff;
    width: 100%;
    text-align: left;
    z-index: 2;
    border-bottom: 1px solid #c2c2c2;
    li {
        width: 65px;
        display: inline-block;
        text-align: center;
        line-height: 30px;
        span {
            display: inline-block;
            width: 100%;
            line-height: 24px;
            // padding: 0 5px;
            &.selected {
                color: @select-font-color;
            }
        }
        &:first-child {
            // order: 1;
            span{
                // text-align: right;
                border-right: 1px solid #c2c2c2;
            }
        }
        // &:nth-last-child(1) {
        //     order: 0;
        //     span {
        //         text-align: left;
        //         border-right: 1px solid #c2c2c2;
        //     }
        // }
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
        z-index: @pop-index;
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
.target-btn {
    padding: 0 10px;
}
.fullScreen {
    .target-box-effect ul {
        height: 150px;
    }
    .target-box-msg textarea {
        height: 150px;
    }
    .target-box-duty textarea {
        height: 100px;
    }
    .target-btn {
        position: absolute;
        right: 0px;
        bottom: 0px;
        padding: 0 10px;
        box-sizing: border-box;
        width: 50%;
    }
}

.big {
    textarea {
        font-size: 20px;
        // height: 230px;
    }
    .targetWraper {
        padding-top: 46px;
    }
    .tab-ul li {
        width: 100px;
        line-height: 45px;
        span {
            line-height: 35px;
        }
    }

    .label-name {
        width: 115px;
        &.specialName {
            padding-top: 4px;
        } 
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

    .target-box-msg textarea {
        height: 130px;
    }
    .target-box-duty {
        .baseInfoWrap {
            top: 66px;
        }
        .baseInfoWrap.fullScreen {
            // top: 99px;
        }
        textarea{
            // height: 155px;
        }
    }

    // &.fullScreen {
    //     top: 45px;
    //     left: calc(~'50% - 300px');
    //     width: 600px;
    // }
    .baseInfoWrap {
        .min-base-info {
            width: 446px;
        }
    }
    .target-box-effect {
        ul  {
            height: 60px;
            li {
                width: 128px;
                p {
                    line-height: 26px;
                    height: 26px;
                }
                span {
                    line-height: 22px;
                }
            }
        }
    }
    .fullScreen {
        .target-box-effect ul {
            height: 190px;
        }
        .target-box-msg textarea {
            height: 230px;
        }
        .target-box-duty textarea {
            height: 155px;
        }
    }
}
</style>
