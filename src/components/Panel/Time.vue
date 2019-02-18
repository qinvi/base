<template>
    <div>
        <v-timepicker v-if="tps" :option="option" @cbtime="selectTime" @destroy="(tps = false)"></v-timepicker>
        <div :class="[ 'time', 'hover', status.play ? 'play' : 'normal' ]" :style="position" ref="time-panel">

            <div :class="[ ship ? 'ten-min-box' : 'min-box' ]" v-if="status.min">
                <ul class="min">
                    <li v-for="(item, key) in mins" :key="key" :class="{ 'select-min': item.status }" @click="selectMin(item)">{{ item.text }}</li>
                    <li v-if="ship" class="min-ship" :class="{ 'select-min': shipItem.status }" @click="selectShipItem(shipItem)">{{ shipItem.text }}</li>
                </ul>
                <ul class="min-scale">
                    <li v-for="(item, key) in mins" :key="key"><em></em></li><li v-show="ship"><em></em></li>
                </ul>
            </div>

            <div class="timeline" :class="[ status.play ? 'play' : 'normal' ]" @mouseenter="drag()" @mouseleave="drag()">
                <div class="datepicker" id="timeline-sys-time" @click="initTimepicker('sys')">
                    <span>{{ sys.month }}-{{ sys.date }}</span>
                    <span>{{ sys.hour }}:{{ sys.min }}</span>
                </div>
                <div class="animate">
                    <div v-show="status.normal">
                        <ul class="scale">
                            <li @mousedown="fast('prev')" @mouseup="fast('stop')" @mouseout="fast('stop')">&lt;</li><li v-for="(item, key) in hours" :key="key" @click="selectHour(item)" :class="{ 'select-time': item.status, 'display': item.display, 'arrow': item.status && !!minOn }">{{ item.text }}<em :class="{ 'none': !item.status, 'block': item.status && status.min }"></em></li><li @mousedown="fast('next')" @mouseup="fast('stop')" @mouseout="fast('stop')">&gt;</li>
                        </ul>
                    </div>
                    <div class="star-end-time" v-show="!status.normal">
                        <div class="start-box">{{ special.start }}</div>
                        <div class="end-box">{{ special.end }}</div>
                    </div>
                    <div class="scale-line">
                        <ul>
                            <li><em class="disabled"></em> </li><li v-for="(item, key) in hours" :key="key"><em :class="{ 'disabled': item.display }"></em></li><li><em class="disabled"></em></li>
                        </ul>
                    </div>
                    <div id="timeline-start-time" class="start-time" @click="initTimepicker('start')"></div>
                    <div id="timeline-end-time" class="end-time" @click="initTimepicker('end')"></div>
                    <!-- <div id="normal-slider" class="slider" v-show="status.normal"></div> -->
                    <div class='container normal-slider' v-if="status.normal">
                        <vue-slider ref='normal-slider' v-model="sliderRangeValue" v-bind="sliderOptions"></vue-slider>
                    </div>
                    <div class='container special-slider' v-else>
                        <vue-slider ref='special-slider' v-model="moreThan12SliderRangeValue" v-bind="moreThan12SliderOptions"></vue-slider>
                    </div>
                    <!-- <div id="special-slider" class="slider" v-show="!status.normal"></div> -->
                    <!-- <div id="timeline-end-time" class="end-time" @click="initTimepicker('end')"></div> -->
                </div>
                <div class="operate">
                    <div @click="(status.dual = !status.dual)" :class="{ 'ospeed': status.dual, 'tspeed': !status.dual }" v-show="status.play"></div>
                    <div @click="play()" :class="{ 'playing': status.play, 'stop': !status.play }"></div>
                    <div @click="reset()" class="reset"></div>
                    <div @click="lock()" :class="{ 'lock': status.lock, 'unlock': !status.lock }"></div>
                </div>
                <div class="drag" v-show="status.drag" ref="time-title"  @mouseup="sliderrefresh()"></div>
            </div>
        </div>

    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import Timepicker from '../Plugins/Timepicker'
import vueSlider from 'vue-slider-component';

export default {
    name: 'Time',
    components: { 'v-timepicker': Timepicker, vueSlider },
    data() {
        return {
            tps: false,
            option: {},
            hours: [],
            mins: [],
            sys: { year: '2017', month: '06', date: '13', hour: '17', min: '05', sec: '00' },
            status: { play: false, lock: false, dual: false, normal: true, drag: false, min: false },
            range: [0, 11],
            rangeTime: { start: null, end: null },
            select: { hour: { data: null, index: 8 }, min: { data: null, index: 0 } },
            special: { left: 0, el: null, max: 0, index: 0, start: null, end: null },
            shipItem: { data: null, status: false, text: '1Hour', first: false },
            sliderRangeValue: [0, 11],
            sliderInit: false,
            moreThan12SliderRangeValue: 0,
            marqueeTime: true,
            sliderOptions: {
                'tooltip': false,
                'width': '100%',
                'height': 5,
                'data': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                'dot-size': 12,
                'speed': 0,
                'piecewiseStyle': {
                    'backgroundColor': '#ccc',
                    'visibility': 'visible',
                    'width': '6px',
                    'height': '6px'
                }
            },
            moreThan12SliderOptions: {
                'tooltip': false,
                'width': '100%',
                'height': 5,
                'data': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                'dot-size': 12,
                'speed': 0,
                'piecewiseStyle': {
                    'backgroundColor': '#6d82a1',
                    'visibility': 'visible',
                    'width': '6px',
                    'height': '6px'
                },
                'process-style': {
                    'backgroundColor': '#ccc'
                }
            }
        }
    },
    computed: {

        ...mapState({
            setTime: state => state.time.setTime,
            radar: state => state.radar.status,
            thunder: state => state.thunder.status,
            site: state => state.site.status,
            ship: state => state.ship.status,
            cloud: state => state.cloud.status,
            model: state => state.model.status,
            typhoon: state => state.typhoon.status,
            bigScreen: state => state.toolsBar.bigScreen,
            hcStatus: state => state.toolsBar.historyCase,
            hcHide: state => state.historyCase.hide,
            time: state => state.time,
            alerts: state => state.globalAlerts.alerts
        }),

        position() {
            return { bottom: this.marqueeTime ? '4px' : '36px', right: (this.hcStatus && !this.hcHide) ? '316px' : '8px' };
        },

        minOn() {
            const status = (this.ship || this.site || this.radar || this.thunder);
            if (status && !this.status.normal) this.selectTime({type: 'sys', date: TU(this.time.sysTime).format('YYYY-MM-DD HH:00:00')})
            const statusString = '' + this.ship + this.site + this.radar + this.thunder
            this.updateParam([ 'time', { minOn: status } ]);
            return status ? statusString : false
        },

        onNum() {
            let onNum = 0;
            if (this.radar) onNum += 1;
            if (this.thunder) onNum += 1;
            if (this.site) onNum += 1;
            if (this.ship) onNum += 1;
            if (this.cloud) onNum += 1;
            if (this.model) onNum += 1;
            if (this.typhoon) onNum += 1;
            return onNum;
        }

    },
    watch: {
        'status.play'() {
            // slider位置发生变化需冲洗初始化
            this.$nextTick(() => {
                if (this.status.normal) {
                    this.$refs['normal-slider'].refresh();
                } else {
                    this.$refs['special-slider'].refresh();
                }
            })
            this.updateParam(['time', {play: this.status.play}])
        },
        bigScreen() {
            if (this.bigScreen) {
                this.$refs['time-panel'].style.left = null;
                this.$refs['time-panel'].style.top = null;
            }
            if (this.status.normal) {
                this.$refs['normal-slider'].refresh();
            } else {
                this.$refs['special-slider'].refresh();
            }
        },

        sliderRangeValue() {
            if (this.sliderInit) {
                this.sliderInit = false; return;
            }
            this.$nextTick(() => {
                this.range = this.sliderRangeValue;
                this.renderShort(this.hours[8].data);
                this.selectHour(this.hours[this.sliderRangeValue[0]]);
            });
        },

        moreThan12SliderRangeValue() {
            this.$nextTick(() => {
                if (this.status.play) return;
                const index = this.$refs['special-slider'].getIndex();
                this.special.index = index;
                this.sys = TU().split(TU(this.rangeTime.start).hour(index)._date);
            });
        },

        minOn(status) {
            if (!!status) {
                this.status.min = true;
                this.initMin(this.sys, false);
            } else if (this.status.normal) {
                this.status.min = false;
            }
            this.updateSysTime();
        },

        ship(status) {
            this.shipItem.data = this.sys;
            this.config.min = status ? 10 : this.config.default;
            this.shipItem.first = status;
            const sysMinTime = TU().matchMin(this.time.sysMinTime, this.time.min, 10);
            this.sys.min = sysMinTime.getMinutes() === 0 ? '00' : sysMinTime.getMinutes();
            this.updateParam([ 'time', { min: this.config.min, sysMinTime } ]);
            this.updateSysTime();
        },

        setTime(time) {
            if (time !== null) {
                this.initShort(TU(time).clearMMSS());
                this.updateSysTime();
                this.updateParam([ 'time', { setTime: null } ]);
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        initConstData() {
            this.config = {
                default: 5,
                min: 5,
                mapping: {
                    5: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
                    6: ['00', '06', '12', '18', '24', '30', '36', '42', '48', '54'],
                    10: ['00', '10', '20', '30', '40', '50']
                }
            };
            this.indexMin = { others: 0, ship: 0 };
            this.lastMinType = '';
            this.load = { timer: null, queue: [] };
            this.updateParam([ 'time', { loadFunc: this.loadFunc } ]);
            this.updateParam(['alarm', { marquee_Time: this.marquee_Time }]);
        },

        /**
         * 设置走马灯与时间轴的联合样式
         */
        marquee_Time(b) {
            this.marqueeTime = !b;
        },
        loadFunc(type) {
            if (!this.load.queue.includes(type)) this.load.queue.push(type);
            this.load.timer = utils.clearTimer(this.load.timer);
            const onNum = this.onNum;
            const time = ((onNum === this.load.queue.length) || (Number(Math.ceil(onNum / 2) + 1) <= this.load.queue.length)) ? 180 : 320;
            if (this.status.play) {
                this.load.timer = window.setTimeout(() => {
                    if (this.minOn && this.status.normal) {
                        this.nextMin(this.select.min.index);
                    } else {
                        if (this.status.normal) {
                            this.nextShort(this.select.hour.index);
                        } else {
                            this.nextLong(this.special.index);
                        }
                    }
                    this.load.queue = [];
                }, time);
            }
        },

        initTimepicker(type) {
            let end = (type === 'sys') ? null : ((type === 'start') ? this.rangeTime.end : null);
            end = (!!end) ? TU(end).format('YYYY-MM-DD HH:mm:ss') : null;
            let option = {
                id: 'timeline-' + type + '-time',
                type: type,
                top: 30,
                template: 'YYYY-MM-DD HH:mm:ss',
                date: TU(this.sys).format('YYYY-MM-DD HH:mm:ss'),
                lock: { min: true, sec: true }
            };
            this.option = Object.assign({ end }, option);
            this.tps = true;
        },

        initShort(time) {
            let date = TU().split(time);
            this.sys = date;
            this.modelShort();
        },

        modelShort() {
            this.range = [0, 11];
            this.sliderInit = true;
            this.status.normal = true;
            this.renderShort(this.sys);
            this.selectHour(this.hours[8]);
        },

        renderShort(time) {
            let [ sIndex, eIndex ] = this.range;
            let hours = [];
            let data = TU().toDate(time);
            let start = TU(data).hour(-8).toDate();
            for (let s = 0; s < sIndex; s++) {
                let temp = createData(s, true);
                hours.push(temp.hour);
            }
            for (let m = sIndex; m <= eIndex; m++) {
                let temp = createData(m, false);
                hours.push(temp.hour);
            }
            for (let e = eIndex + 1; e < 12; e++) {
                let temp = createData(e, true);
                hours.push(temp.hour);
            }
            this.rangeTime = { start: hours[0].data, end: hours[11].data }
            function createData(index, display) {
                let date = TU(TU().clone(start)).hour(index).toDate();
                let data = TU().split(date);
                return { hour: { index: index, status: false, display: display, text: data.hour, data: data } };
            }
            this.hours = hours;
        },

        nextShort(index) {
            utils.clearTimer(this.playTimer);
            if (this.status.play) {
                index = index >= this.range[1] ? this.range[0] : index + 1;
                this.selectHour(this.hours[index]);
                let time = this.status.dual ? 750 : 1500;
                this.playTimer = window.setTimeout(() => {
                    if (this.status.min) {
                        return this.nextMin(0);
                    } else {
                        return this.nextShort(index);
                    }
                }, time);
            }
        },

        initMin(time, manSelect = true, isInit = true) {
            this.minInitTimer = utils.clearTimer(this.minInitTimer);
            this.minInitTimer = window.setTimeout(() => {
                let mins = [];
                let template = null;
                template = this.config.mapping[this.config.min];
                template.forEach(function(min, index) {
                    let data = Object.assign({}, time);
                    data.min = min;
                    mins.push({ index: index, status: false, data: data, text: `${data.hour}:${data.min}` });
                });
                this.mins = mins;
                if (isInit) {
                    const configMin = this.config.min;
                    let index = template.indexOf(TU().lastMin(function(status) {
                        return status ? 10 : configMin;
                    }(this.ship)));
                    index = (!!index || index < 0) ? index : 0;

                    // index = template.length - 1;
                    if (TU(this.sys).format('YYYYMMDDHH') < TU().format('YYYYMMDDHH') || this.status.play) {
                        index = 0;
                    }
                    const minType = this.ship ? 'ship' : 'others';
                    if (!manSelect && (minType === this.lastMinType)) index = this.indexMin[minType];
                    this.indexMin[minType] = index;
                    this.lastMinType = minType;
                    if (!this.shipItem.first) {
                        this.selectMin(this.mins[index]);
                    } else {
                        if (this.lastMinType === 'ship') {
                            this.selectShipItem(this.shipItem);
                        } else {
                            this.selectMin(this.mins[index]);
                        }
                    }
                }
            }, 80);
        },

        nextMin(index, first) {
            utils.clearTimer(this.playTimer);
            if (this.status.play) {
                index = (index >= this.mins.length - 1) ? 0 : index + 1;
                if (index === 0 && !first) {
                    let hourIndex = this.select.hour.index;
                    // hourIndex = hourIndex >= this.hours.length - 1 ? 0 : hourIndex + 1;
                    hourIndex = hourIndex >= this.range[1] ? this.range[0] : hourIndex + 1;
                    this.selectHour(this.hours[hourIndex]);
                } else {
                    this.selectMin(this.mins[index]);
                }
                let time = this.status.dual ? 750 : 1500;
                this.playTimer = window.setTimeout(() => {
                    if (!this.status.min) {
                        return this.nextShort(this.select.hour.index);
                    } else {
                        return this.nextMin(index);
                    }
                }, time);
            }
        },

        play(forceStatus = -1) {
            let status;
            if (forceStatus === -1) {
                this.status.play = !this.status.play
                status = this.status.play
            } else {
                status = forceStatus
                this.status.play = forceStatus
            }
            this.status.lock = true;
            if (this.ship) {
                this.shipItem.first = !status;
            }
            if (status) {
                if (this.status.normal) {
                    if (this.status.min) {
                        const index = this.ship && status ? this.mins.length : this.select.min.index;
                        this.nextMin(index, true);
                    } else {
                        this.nextShort(this.select.hour.index);
                    }
                } else {
                    this.nextLong(this.special.index);
                }
            } else {
                window.clearTimeout(this.playTimer);
            }
        },

        selectHour(item) {
            if (item.display) return;
            if (!!this.select.hour.data) this.select.hour.data.status = false;
            item.status = true;
            this.select.hour = { data: item, index: item.index };
            this.sys = Object.assign({}, item.data);
            if (this.status.min) {
                this.shipItem.data = item.data;
                this.initMin(this.sys);
            } else {
                this.updateTime();
            }
        },

        selectMin(item) {
            if (!!this.select.min.data) this.select.min.data.status = false;
            item.status = true;
            this.select.min = { data: item, index: item.index };
            this.indexMin[this.lastMinType] = item.index;
            this.sys = Object.assign({}, item.data);
            this.updateTime();
            if (this.ship) {
                this.shipItem.status = false;
            }
        },

        selectTime(param) {
            let date;
            if (param.type === 'sys') {
                date = TU().toDate(param.date);
                this.initShort(date);
            } else {
                if (param.type === 'end') {
                    date = TU().toDate(param.date);
                } else {
                    date = TU().toDate(param.date);
                }
                if (!this.status.min) { // 分钟关闭才执行的操作、分钟跟slider是互斥的
                    this.initLong(date, param.type);
                } else {
                    this.updateParam(['sysTip', { status: true, text: '分钟选择不支持此操作', type: 'info' }]);
                }
            }
            this.tps = false;
        },

        updateTime() {
            this.updateTimer = utils.clearTimer(this.updateTimer);
            this.updateTimer = window.setTimeout(() => {
                let sys = Object.assign({}, this.sys);
                let sysMinTime = TU().toDate(sys);
                sys.min = '00';
                let sysTime = TU().toDate(sys);
                this.updateParam(['time', { sysMinTime, sysTime }]);
            }, 80);
        },

        selectShipItem(item) {
            this.updateTime();
            this.updateShipTimer = utils.clearTimer(this.updateShipTimer);
            this.updateShipTimer = window.setTimeout(() => {
                this.updateParam([ 'ship', { dateTime: TU(this.shipItem.data).setMin(59).setSec(59).toDate() } ]);
            }, 100);
            item.status = true;
            this.shipItem.first = true;
            this.select.min.index = 0;
            if (this.select.min.data !== null) {
                this.select.min.data.status = false;
            }
        },

        initLong(time, type) {
            let start, end, between;
            if (type === 'start') {
                start = TU().toDate(time);
                end = TU().toDate(this.rangeTime.end);
                between = TU().subtract(start, end);
            } else {
                start = TU().toDate(this.rangeTime.start);
                end = TU().toDate(time);
                between = TU().subtract(start, end);
            }
            let max = between.hour + between.date * 24;
            if (max > 12) {
                this.sys = TU().split(start);
                this.rangeTime = { start: this.sys, end: TU().split(end) };
                this.special.start = TU(start).format('MM-DD HH:mm');
                this.special.end = TU(end).format('MM-DD HH:mm');
                this.status.normal = false;
                this.modelLong(max);
            } else {
                this.status.normal = true;
                this.initShort(TU().toDate(this.sys));
            }
        },

        modelLong(max) {
            let hours = [];
            let t = [];
            for (let i = 0; i < 12; i++) {
                hours.push({ display: false });
            }
            for (let i = 0; i <= max; i++) t[i] = i;
            this.moreThan12SliderOptions.data = t;
            this.hours = hours;
            this.special.max = max;
        },

        nextLong(index) {
            utils.clearTimer(this.playTimer);
            if (this.status.play) {
                index = index >= this.special.max ? 0 : index + 1;
                if (this.$refs['special-slider']) this.$refs['special-slider'].setIndex(index);
                this.sys = TU().split(TU(this.rangeTime.start).hour(index)._date);
                this.updateTime();
                let time = this.status.dual ? 750 : 1500;
                this.playTimer = window.setTimeout(() => {
                    return this.nextLong(index);
                }, time);
            }
        },

        fast(status) {
            if (!!this.fastTimer) {
                window.clearTimeout(this.fastTimer);
                this.fastTimer = null;
            }
            if (status === 'stop') return;
            this.fastTimer = window.setTimeout(() => {
                let key = (status === 'prev') ? 7 : 9;
                let date = this.hours[key];
                if ((TU(date.data).clearMMSS().getTime() > TU().clearMMSS().getTime()) && status === 'next') return;
                this.renderShort(date.data);
                this.selectHour(this.hours[8]);
                return this.fast(status);
            }, 50);
        },

        reset() {
            if (!this.status.lock) this.initShort(TU().clearMMSS());
        },

        lock() {
            this.status.lock = !this.status.lock;
        },

        drag() {
            this.status.drag = !this.status.drag;
        },
        // 当时间轴被拖动鼠标弹起时需重新初始化slider组件
        sliderrefresh() {
            this.$nextTick(() => {
                this.$refs['normal-slider'].refresh();
            })
        },

        updateSysTime() {
            if (!!this.updateSysTimer) {
                window.clearTimeout(this.updateSysTimer);
                this.updateSysTimer = null;
            }
            const scale = this.status.min ? this.config.min : 60;
            const time = TU().nextTime(scale);
            var style = 'color: #39f;';
            console.log(`%cSYSTEM REFRESH AFTER ${Math.ceil(time / 1000)} SEC`, style);
            this.updateSysTimer = window.setTimeout(() => {
                if (!this.status.lock) {
                    this.initShort(TU().clearMMSS());
                    this.updateSysTime();
                }
            }, time);
        }

    },

    mounted() {
        this.initConstData();
        this.initShort(TU().clearMMSS());
        this.updateSysTime();
        this.updateParam([ 'time', { min: this.config.min } ]);
        WD.init(this.$refs['time-title'], this.$refs['time-panel'], lmap.map);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.normal {
    width: 503px;
}

.play {
    width: 540px;
}

.time {
    position: absolute;
    z-index: @pop-index;
    // bottom: 36px; // 4px;
    right: 8px;
    height: 47px;

    .min-box, .ten-min-box {
        background: rgba(255, 255, 255, 0.9);
        box-shadow: @shadow;
        border: 1px solid #ccc;
        position: absolute;
        bottom: 50px;
        white-space: nowrap;
        overflow: hidden;
        height: 33px;
        text-align: left;
        z-index: @pop-index;
        border-radius: 4px;
        -moz-border-radius: 4px;
        -webkit-border-radius: 4px;

        .select-min {
            background: rgba(0, 0, 0, 0.2);
            em {
                display: block;
                position: absolute;
                top: -12px;
                right: 5px;
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 10px solid rgba(255, 255, 255, 0.9);
                &.block {
                    opacity: 1;
                }
                &.none {
                    opacity: 0;
                }
            }
        }

        .min-ship {
            position: absolute;
            &.select-min {
                background: rgba(0, 0, 0, 0.2);
            }
        }

        .min li {
            display: inline-block;
            text-align: center;
            margin: 2px;
            width: 38px;
        }

        .min-scale {
            height: 10px;
            li {
                width: 42px;
                height: 5px;
                display: inline-block;
                border-bottom: 1px solid #6d82a1;
                text-align: center;
                &:hover {
                    cursor: default;
                    // background: rgba(0, 0, 0, 0.2);
                }
                em {
                    height: 6px;
                    margin-bottom: 9px;
                    width: 1px;
                    background: #6d82a1;
                    display: inline-block;
                }
            }
        }
    }

    .ten-min-box {
        left: 71px;
    }

    .min-box {
        right: -5px;
    }

    .timeline {

        height: 43px;

        background: rgba(255, 255, 255, .9);
        box-shadow: @shadow;
        padding: 1px 1px 1px 2px;
        border: 1px solid #ccc;
        border-radius: 4px;

        .datepicker {
            float: left;
            width: 41px;
            height: 31px;
            margin-top: 1px;
            position: relative;
            cursor: pointer;
            text-align: center;
            line-height: 14px;
            padding-top: 10px;
            color: #fff;
            background: #6d82a1;
            border-radius: 3px;
            -webkit-border-radius: 3px;
            -moz-border-radius: 3px;
            &::after,
            &::before {
                content: "";
                position: absolute;
                width: 4px;
                height: 4px;
                top: 3px;
                background: #fff;
                -webkit-border-radius: 4px;
                -moz-border-radius: 4px;
                border-radius: 4px;
            }
            &::before {
                left: 10px;
            }
            &::after {
                right: 10px;
            }
            span {
                display: block;
            }
        }

        .animate {
            width: auto;
            position: relative;
            float: left;
            // height: 42px;
            .normal-slider {
                position: relative;
                width: 82%;
                left: 32px;
                // top: -19px;
            }
            .special-slider {
                position: relative;
                width: 82%;
                left: 32px;
                // top: -19px;
            }
            .scale li {
                display: inline-block;
                width: 25px;
                height: 18px;
                line-height: 18px;
                text-align: center;
                position: relative;
                &:first-child, &:last-child {
                    font-size: 14px;
                }
                &:nth-child(10) {
                    border: 1px solid red;
                }
                &.select-time {
                    background: rgba(0, 0, 0, 0.2);
                }
                &.arrow::before {
                    content: '';
                    border-top-color: rgba(255, 255, 255, 0.9);
                    border-right: 6px solid transparent;
                    border-left: 6px solid transparent;
                    border-top: 6px solid rgba(255, 255, 255, 0.9);
                    position: absolute;
                    bottom: 20px;
                    left: 6px;
                    z-index: @panel-index;
                }
                &.display {
                    color: #999;
                    &:hover {
                        background: #fff;
                    }
                }
                &:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
            }

            .scale-line {
                vertical-align: middle;
                margin-top: 2px;
                height: 7px;
                ul {
                    height: 7px;
                    li {
                        cursor: default;
                        width: 25px;
                        height: 3px;
                        border-bottom: 1px solid #6d82a1;
                        position: relative;
                        float: left;
                        em {
                            height: 5px;
                            bottom: 0px;
                            width: 1px;
                            background: #6d82a1;
                            margin-left: 13px;
                            display: inline-block;
                            position: absolute;
                            &.disabled {
                                height: 0px;
                            }
                        }
                    }
                }
            }

            .star-end-time {
                height: 20px;
                width: 100%;
                position: relative;
                .start-box, .end-box {
                    display: inline-block;
                    position: absolute;
                }
                .start-box {
                    left: 5px;
                }
                .end-box {
                    right: 5px;
                }
            }

            .start-time {
                margin-left: 12px;
            }

            .start-time, .end-time {
                display: inline-block;
                width: 10px;
                height: 10px;
                border: 2px solid #6d82a1;
                position: absolute;
                border-radius: 100%;
                -webkit-border-radius: 100%;
                -moz-border-radius: 100%;
                &::before {
                    content: "";
                    display: inline-block;
                    position: absolute;
                    width: 1px;
                    height: 5px;
                    left: 50%;
                    margin-left: -1px;
                    top: 1px;
                    background: #6d82a1;
                }
            }
            .end-time {
                position: absolute;
                right: 11px;
            }
            .start-time::after, .end-time::after {
                content: "";
                display: inline-block;
                position: absolute;
                width: 4px;
                height: 1px;
                left: 50%;
                margin-left: -1px;
                top: 50%;
                background: #6d82a1;
            }

        }

        .operate {
            position: relative;
            float: left;
            top: 50%;
            transform: translateY(-50%);

            div {
                transition: box-shadow .5s;
                &:hover {
                    box-shadow: @shadow;
                }
                &.lock:hover, &.unlock:hover {
                    box-shadow: inherit
                }
            }
            .ospeed, .tspeed, .reset {
                width: 26px;
                height: 26px;
                text-align: center;
                margin: 8px 3px 0;
                position: relative;
                float: left;
                cursor: pointer;
                border: 2px solid #6d82a1;
                -webkit-border-radius: 100%;
                -moz-border-radius: 100%;
                border-radius: 100%;
            }

            .playing, .stop {
                width: 32px;
                height: 32px;
                text-align: center;
                margin: 4px 1px 0;
                position: relative;
                float: left;
                cursor: pointer;
                border: 2px solid @font-color;
                -webkit-border-radius: 100%;
                -moz-border-radius: 100%;
                border-radius: 100%;
            }

            .stop::before {
                content: "";
                display: inline-block;
                position: absolute;
                left: 50%;
                top: 50%;
                margin-top: -7px;
                margin-left: -4px;
                width: 0;
                height: 0;
                border-top: 7px solid transparent;
                border-bottom: 7px solid transparent;
                border-left: 12px solid @font-color;
            }

            .playing::before, .playing::after {
                content: "";
                display: inline-block;
                position: absolute;
                left: 50%;
                top: 50%;
                margin-top: -5px;
                width: 3px;
                height: 10px;
                background: @font-color;
            }

            .playing::before {
                margin-top: -5px;
                margin-left: -5px;
            }

            .playing::after {
                margin-left: 2px;
            }

            .lock, .unlock {
                width: 22px;
                width: 32px;
                display: inline-block;
                text-align: center;
            }

            .ospeed::before {
                content: "X1";
                display: inline-block;
                width: 100%;
                line-height: 26px;
            }

            .tspeed::before {
                content: "X2";
                display: inline-block;
                width: 100%;
                line-height: 26px;
            }

            .lock, .unlock {
                height: 20px;
                width: 26px;
                margin-left: 0px;
                margin-top: 10px;
                position: relative;
                cursor: pointer;
            }

            .lock {
                background: url('../../assets/img/common/lock.png') no-repeat center;
            }

            .unlock {
                background: url('../../assets/img/common/unlock.png') no-repeat center;
            }

            .reset::before {
                content: "";
                display: inline-block;
                position: absolute;
                left: 50%;
                top: 50%;
                margin-top: -5px;
                margin-left: -5px;
                width: 10px;
                height: 10px;
                background: #6d82a1;
            }

        }

        .drag {
            width: 14px;
            height: 14px;
            position: absolute;
            right: -2px;
            top: 2px;
            // z-index: @panel-index;
            cursor: move;
            background: url("../../assets/img/common/drag.png") no-repeat center;
        }
    }
}

.big {
    .normal {
        width: 700px;
        height: 64px;
    }

    .play {
        width: 740px;
        height: 64px;
    }
    .time {
        .timeline {
            .datepicker {
                width: 70px;
                height: 52px;
                span {
                    .height-big(22px);
                    font-size: 20px;
                }
            }
            .animate {
                .star-end-time {
                    .height-big();
                }
                .special-slider {
                    left: 48px;
                }
                .scale li {
                    width: 36px;
                    .height-big();
                    font-size: 20px;

                    &.select-time {
                        &::before {
                            border-width: 8px;
                            bottom: 38px;
                            left: 10px;
                        }
                    }
                }
                .scale-line {
                    ul {
                        li {
                            width: 36px;
                            em {
                                margin-left: 18px;
                            }
                        }
                    }
                }
                .start-time,
                .end-time {
                    width: 14px;
                    height: 14px;

                    &::before {
                        top: 2px;
                        height: 6px;
                    }

                    &::after {
                        width: 5px;
                    }
                }
                .normal-slider {
                    width: 81%;
                    left: 46px;
                    // top: -26px;
                }
            }
            .operate {
                .stop {
                    width: 40px;
                    height: 40px;
                }
                .reset {
                    width: 32px;
                    height: 32px;
                }
                .playing {
                    width: 40px;
                    height: 40px;
                }
                .tspeed {
                    width: 36px;
                    height: 36px;

                    &::before {
                        line-height: 36px;
                    }
                }
            }
        }
        .min-box,
        .ten-min-box {
            height: 40px;
            bottom: 70px;
            .min {
                li {
                    width: 54px;
                    font-size: 18px;
                }
            }
            .min-scale {
                li {
                    width: 58px;

                    em {
                        margin-bottom: 16px;
                    }
                }
            }
        }
    }
}
</style>
