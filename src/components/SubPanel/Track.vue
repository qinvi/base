<template>
    <div class="track" ref="track-panel">
        <div class="title" ref="track-title">
            <span>发布信息追踪</span>
            <a class="close" @click="close"></a>
        </div>
        <div class="track-box">
            <div class="timeSelect">
                <label for="time">发布时间</label>
                <div :class="{ 'timestart': this.timeStartEnd === 'start', 'timeend': this.timeStartEnd === 'end' }">
                    <input type="text" readonly="readonly" v-model="rangeTime.start" id="time-start" @click="initTimepicker('start')">
                    <span>至</span>
                    <input type="text" readonly="readonly" v-model="rangeTime.end" id="time-end" @click="initTimepicker('end')">
                    <v-timepicker v-if="tps" :option="timeOption" @cbtime="selectTime" @destroy="destroyTime"></v-timepicker>
                </div>
            </div>
            <div class="track-chose">
                <label>发布类型</label>
                <v-dropdown :list="ways.data" :tip="ways.tip" class="dropdown-track" @select="selectWays"></v-dropdown>
                <v-dropdown :list="types.data" :tip="types.tip" class="dropdown-track" @select="selectTypes"></v-dropdown>
                <v-dropdown :list="warnTypes.data" :tip="warnTypes.tip" class="dropdown-track" @select="selectWarnType"></v-dropdown>
                <span class="btn" @click="queryTarget">查询</span>
            </div>
            <div class="line">
                <div class="line-top">
                    <span>应急指挥决策辅助系统</span><span class="status" :title="msgs.text">突发事件预警发布平台（{{ msgs.text }}）</span>
                </div>
                <ul class="clearfix">
                    <li v-for="(item, key) in msgs.data" :key="key" :class="{ 'line-start': item.status }">
                        <em :class="{ 'fail': item.fail }"></em>
                        <a>{{ item.text }}</a>
                    </li>
                </ul>
            </div>
            <div class="track-content">
                <ul class="clearfix">
                    <li class="track-select" v-for="(item, index) in list" :key="index" @click="selectTrack(item)">
                        <em :class="{ 'icon-chose': item.chose }"></em>
                        <div class="little">
                            <ul class="clearfix">
                                <li>类型：<label :title="item.way">{{ item.way }}</label></li>
                                <li>灾害：<label :title="item.type">{{ item.type }}</label></li>
                                <li>渠道：<label :title="item.channel">{{ item.channel }}</label></li>
                                <li>范围：<label :title="item.count">{{ item.count }}</label></li>
                                <li>责任人：<label :title="item.responsible">{{ item.responsible }}</label></li>
                                <li>正文：<label :title="item.content">{{ item.content }}</label></li>
                                <li>发布者：<label :title="item.publisher">{{ item.publisher }}</label></li>
                                <li>日期：<label :title="item.date">{{ item.date }}</label></li>
                                <li>状态：<label class="focus" :title="item.msg">{{ item.msg }}</label></li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="control">
                <label>第{{ page.curr + 1 }}页/共{{ page.sum }}页 {{ page.count }}条记录</label>
                <font style="float: right">
                    <div class="btn" @click="changePage( page.curr - 1 )">上一页</div>
                    <div class="btn" @click="changePage( page.curr + 1 )">下一页</div>
                </font>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Dropdown from '../Plugins/Dropdown';
import Timepicker from '../Plugins/Timepicker';

export default {
    name: 'Track',
    components: {
        'v-dropdown': Dropdown,
        'v-timepicker': Timepicker
    },
    data() {
        return {
            list: [],
            page: { num: 4, sum: 0, count: 0, curr: 0 },
            msgs: {
                data: [
                    { text: '推送', status: false, fail: false },
                    { text: '确认', status: false, fail: false },
                    { text: '审核', status: false, fail: false },
                    { text: '发布', status: false, fail: false },
                    { text: '发布完成', status: false, fail: false }
                ],
                text: '发布完成'
            },
            types: {
                data: [
                ],
                tip: '请选择类别'
            },
            warnTypes: {
                data: [
                ],
                tip: '请选择级别'
            },
            selectStatus: '', // 发布类型选择
            timeOption: null,
            rangeTime: {start: '', end: ''}, // 时间范围
            tps: false
        };
    },
    computed: {
        ...mapState({
            code: status => status.sys.code,
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    watch: {
        bigScreen(bool) {
            this.getTracks();
        },
        selectStatus(status) {
            this.types.tip = this.typesDetail[status].tip;
            this.types.data = this.typesDetail[status].list;
            this.warnTypes.tip = this.warnTypesDetail[status].tip;
            this.warnTypes.data = this.warnTypesDetail[status].list
            this.types = Object.assign({}, this.types, {});
            this.warnTypes = Object.assign({}, this.warnTypes, {});

            this.eventType = '';
            this.warnLevel = '';
            if (status === 'all') this.targetType = '';
            if (status === 'weather') this.targetType = '2';
            if (status === 'breakOut') this.targetType = '1';
        },
        'page.curr': {
            handler(val, oldVal) {
                this.getTracks();
            },
            deep: true
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.urls = {
                allTracks: sysconfig.TESTPATH + '/track/listMessageTrack'
            };
            this.timeStartEnd = '';
            this.sys = '';
            this.timer = { delayTimer: null };
            this.eventType = '';
            this.warnLevel = '';
            this.targetType = '';
            this.ways = {
                data: [
                    { text: '全部发布类型', value: 'all' },
                    { text: '气象预警', value: 'weather' },
                    { text: '突发事件', value: 'breakOut' }
                ],
                tip: '请选择发布类型'
            };
            this.typesDetail = {
                all: { tip: '全部', list: [] },
                weather: {
                    tip: '请选择类别',
                    list: [
                        { text: '全部', value: '' },
                        { text: '台风', value: '11B01' },
                        { text: '暴雨', value: '11B03' },
                        { text: '大风', value: '11B06' },
                        { text: '高温', value: '11B09' },
                        { text: '雷电', value: '11B14' },
                        { text: '冰雹', value: '11B15' },
                        { text: '大雾', value: '11B17' },
                        { text: '灰霾', value: '11B19' },
                        { text: '雷雨大风', value: '11B20' },
                        { text: '道路结冰', value: '11B21' },
                        { text: '森林火险', value: '11B25' },
                        { text: '寒冷', value: '11B34' },
                        { text: '雷暴', value: '11B43' },
                        { text: '停课信号', value: '11B44' }
                    ]
                },
                breakOut: {
                    tip: '请选择类别',
                    list: [
                        { text: '全部', value: '' },
                        { text: '自然灾害', value: '11000' },
                        { text: '事故灾难', value: '12000' },
                        { text: '公共卫生事件', value: '13000' },
                        { text: '社会安全事件', value: '14000' },
                        { text: '其它突发事件', value: '19000' }
                    ]
                }
            };
            this.warnTypesDetail = {
                all: { tip: '全部', list: [] },
                weather: {
                    tip: '请选择级别',
                    list: [
                        { text: '全部', value: '' },
                        { text: '红色', value: '1' },
                        { text: '橙色', value: '2' },
                        { text: '黄色', value: '3' },
                        { text: '蓝色', value: '4' },
                        { text: '白色', value: '5' },
                        { text: '解除', value: '6' }
                    ]
                },
                breakOut: {
                    tip: '请选择级别',
                    list: [
                        { text: '全部', value: '' },
                        { text: 'Ⅰ级', value: '1' },
                        { text: 'Ⅱ级', value: '2' },
                        { text: 'Ⅲ级', value: '3' },
                        { text: 'Ⅳ级', value: '4' },
                        { text: '解除', value: '6' },
                        { text: '其他', value: '9' }
                    ]
                }
            }
        },

        queryTarget() {
            this.changePage(0);
            this.getTracks();
        },

        /**
         * 选择时间
         * @param {object} param 时间参数
         */
        selectTime(param) {
            const date = TU().toDate(param.date);
            this.rangeTime = Object.assign({}, this.rangeTime, {[this.timeStartEnd]: TU(date).format('YYYY-MM-DD HH:mm')});
            this.checkTime(this.timeStartEnd);
            this.sys = date;
            this.tps = false;
        },

        /**
         * 销毁时间
         * @param {object} param 子组件传参
         */
        destroyTime(param) {
            if (param.id !== 'time-start' && param.id !== 'time-end') this.tps = false;
        },

        /**
         * 检查时间的合法性、结束时间不能先于开始时间
         * @param {string} type 开始 结束
         */
        checkTime(type) {
            let startTime = this.rangeTime['start'];
            let endTime = this.rangeTime['end'];
            const b = TU(endTime).getDate().getTime() - TU(startTime).getDate().getTime();
            if (type === 'start' && (b < 0)) {
                startTime = endTime;
                this.rangeTime['start'] = TU(endTime).format('YYYY-MM-DD HH:mm');
            } else if (type === 'end' && (b < 0)) {
                endTime = startTime;
                this.rangeTime['end'] = TU(startTime).format('YYYY-MM-DD HH:mm');
            }
        },

        /**
         * 初始化时间
         * @param {string} type 开始：start; 结束: end
         */
        initTimepicker(type = 'start') {
            this.tps = false;
            this.timeStartEnd = type;
            this.checkTime();
            this.timeOption = {
                id: 'time-' + type,
                type: type,
                top: 0,
                // left: (type === 'start') ? 0 : 150,
                template: 'YYYY-MM-DD HH:mm:ss',
                date: TU(this.rangeTime[type]).format('YYYY-MM-DD HH:mm:ss'),
                lock: { min: true, sec: true }
            };
            utils.clearTimer(this.timer.delayTimer);
            this.timer.delayTimer = window.setTimeout(() => {
                this.tps = true;
            }, 50);
        },

        /**
         * 请求列表数据
         */
        getTracks() {
            utils.get(this.urls.allTracks, this.getParams()).then((json) => {
                let data = json.data;
                let list = [];
                let first = true;
                Object.assign(this.page, {sum: data.pageNum, count: data.total});
                data.resp.forEach(target => {
                    let item = {};
                    item.msg = target.msg;
                    item.id = target.id;
                    item.status = target.status;
                    item.chose = false;
                    target.list.forEach(map => {
                        if (map.text === '灾害：') item.type = map.value;
                        if (map.text === '渠道：') item.channel = map.value;
                        if (map.text === '范围：') item.count = map.value;
                        if (map.text === '责任人：') item.responsible = map.value;
                        if (map.text === '正文：') item.content = map.value;
                        if (map.text === '发布者：') item.publisher = map.value;
                        if (map.text === '时间：') item.date = map.value;
                        if (map.text === '类型：') item.way = map.value;
                    });
                    list.push(item);

                    if (first) {
                        item.chose = true;
                        this.selectTrack(item);
                        first = !first;
                    }
                });
                this.list = list;
            });
        },

        /**
         * 发布类型选择
         * @param {object} param 组件传参
         */
        selectWays(param) {
            this.selectStatus = param.value;
        },

        /**
         * 预警级别选择
         * @param {object} param 对应this.warnTypes数据
         */
        selectWarnType(param) {
            this.warnLevel = param.value;
        },

        /**
         * 类别选择
         * @param {object} param 对应this.types数据
         */
        selectTypes(param) {
            this.eventType = param.value;
        },

        /**
         * 数据改装
         * @param {object} data 原始数据
         */
        changeData(data) {

        },

        /**
         * 查看某个详情状态
         * @param {object} item 列表项
         */
        selectTrack(item) {
            this.list.forEach(target => {
                target.chose = false;
            });
            if (!item.chose) {
                item.chose = true;
            }
            this.selectStatusBar(item);
        },

        /**
         * 获取请求参数
         */
        getParams() {
            return {
                targetType: this.targetType, // 发布类型
                warnLevel: this.warnLevel, // 预警级别
                eventType: this.eventType, // 灾害类型
                startTime: this.rangeTime.start ? (this.rangeTime.start + ':59') : this.rangeTime.start, // 开始时间
                endTime: this.rangeTime.end + ':59', // 结束时间
                page: this.page.curr + 1,
                onePageNum: this.page.num
            }
        },

        /**
         * 更新当前列表项状态栏
         * @param {object} item 当前列表项
         */
        selectStatusBar(item) {
            const msg = item.status;
            let statusCode = 0;
            let fail = false;
            if ([ 0, 5, 10 ].includes(msg)) {
                statusCode = 1;
            } else if ([ 15, 50, 62, 90 ].includes(msg)) {
                statusCode = 2;
            } else if ([ 20, 64 ].includes(msg)) {
                statusCode = 3;
            } else if ([ 30, 40, 66 ].includes(msg)) {
                statusCode = 4;
            } else if ([ 80, 110, 300 ].includes(msg)) {
                statusCode = 5;
            } else {
                statusCode = 0;
            }

            if ([ 40, 50, 62, 64, 66, 90, 110 ].includes(msg)) {
                fail = true;
            }

            this.msgs.data.forEach(step => {
                step.status = false;
                step.fail = false;
            });

            this.msgs.text = item.msg;
            for (let index = 0; index < statusCode; index++) {
                this.msgs.data[index].status = true;
                if (index + 1 === statusCode) {
                    this.msgs.data[index].fail = fail;
                }
            }
        },

        /**
         * 上页、下页
         * @param {number} num 页码
         */
        changePage(num) {
            if (num > -1 && num < this.page.sum) {
                this.page.curr = num;
            }
        },

        /**
         * 关闭
         */
        close() {
            this.updateParam([ 'toolsBar', { track: false } ]);
        }
    },
    beforeMount() {
        this.initConstData();
    },
    mounted() {
        this.getTracks();
        WD.init(this.$refs['track-title'], this.$refs['track-panel'], lmap.map);
    },
    destroyed() {}
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.track {
    position: fixed;
    top: calc(~'50% - 300px');
    left: calc(~'50% - 350px');
    width: 700px;
    height: auto;
    background-color: #fff;
    box-shadow: @shadow;
    z-index: @pop-index;

    .timestart #timepicker{
        top: 33px!important;
        left: 0px!important;
    }
    .timeend #timepicker{
        top: 33px!important;
        left: 185px!important;
    }

    .track-box {
        margin: 5px;
    }

    .track-chose, .timeSelect {
        padding: 5px 10px;
        height: 22px;
        line-height: 22px;
    }

    .dropdown-track {
        margin: 0 10px;
    }

    .timeSelect {
        position: relative;
        &>div {
            position: relative;
            float: left;
            margin-left: 10px;
            span {
                margin: 0 5px;
            }
            input {
                width: 156px;
                cursor: pointer;
                background: url("../../assets/img/common/date.png") no-repeat 135px 0px;
                text-indent: 10px;
            }
        }
    }
    .track-chose label, .timeSelect label {
        float: left;
    }

    .track-chose span {
        float: right;
    }

    .track-chose a {
        padding: 0px 8px;
        margin-left: 10px;
        float: left;
        background: none;
    }

    .track-content {
        width: auto;
        height: auto;
        overflow: hidden;
        clear: both;

        .icon-chose:before {
            position: relative;
            top: 0px;
            left: 1px;
        }

        ul {
            width: 100%;
            height: auto;
            overflow: hidden;
            li {
                float: left;
                width: 48%;
                margin: 5px 1%;
                position: relative;
                .little {
                    width: 100%;
                    // height: 112px;
                    border: 1px solid #ccc;
                    float: left;
                    ul li {
                        float: left;
                        width: 100%;
                        margin: 3px;
                        .height(18px);
                        text-align: left;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;

                    }
                }
            }
            li.track-select em.icon-chose {
                position: absolute;
                right: 2px;
                top: 3px;
            }
        }
    }

    .focus {
        color: red;
    }

    .control {
        margin: 0px 1%;
        line-height: 24px;
        text-align: left;
    }

    .line {
        width: 676px;
        margin: auto;
        height: 88px;
        border: 1px solid #ccc;
        clear: both;
        margin-left: 7px;
        margin-top: 8px;

        .line-top {
            text-align: left;
            width: 96%;
            margin: auto;
            margin-top: 3px;
            .status {
                float: right;
                max-width: 400px;
                overflow: hidden;
                white-space: nowrap;
            }
        }

        ul {
            width: 90%;
            margin: auto;
            li {
                float: left;
                height: 1px;
                background: #707070;
                position: relative;
                margin-top: 18px;
                width: 104px
            }
            li:first-child {
                width: 6px
            }
            li:nth-child(2) {
                width: 276px
            }
            li:first-child em {
                left: -9px
            }
            li:first-child a {
                left: -28px;
                cursor: pointer
            }
            li:first-child a:hover {
                color: @select-font-color
            }
            li em {
                display: inline-block;
                zoom: 1;
                position: absolute;
                width: 21px;
                height: 21px;
                right: -9px;
                top: -10px;
                background: url("../../assets/img/common/line0.png") no-repeat 5px 5px;
            }
            li a {
                display: inline-block;
                display: -moz-inline-stack;
                zoom: 1;
                *display: inline;
                position: absolute;
                width: 54px;
                text-align: center;
                height: 20px;
                line-height: 20px;
                right: -27px;
                top: 10px;
                color: #707070;
            }
            li.line-start {
                background: #96cb00;
            }
            li.line-start em {
                background: url("../../assets/img/common/line.png") no-repeat 1px 2px;
                &.fail {
                    background: url("../../assets/img/common/line-fail.png") no-repeat 1px 2px
                }
            }
        }
    }

}

.big .track {
    width: 800px;

    .track-chose {
        .height-big();
    }

    .line {
        width: 775px;
        height: 96px;
        ul li {
            margin-top: 8px;
            a {
                margin-top: 4px;
                width: 110px;
                right: -52px;
            }
            &:first-child a {
                left: -56px;
            }
            &:nth-child(2) {
                width: 360px;
            }
        }
    }

    .track-content {
        .track-select {
            ul li {
                margin: 4px 4px;
                .height(20px);
            }
        }
    }

    .icon-chose:before {
        position: relative;
        top: -1px;
        left: 1px;
    }

    .control {
        .height-big();
    }

    .btn {
        box-sizing: border-box;
        .height-big();
    }

}

</style>
