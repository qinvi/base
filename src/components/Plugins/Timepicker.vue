<template>
    <div id="timepicker" class="timepicker-container timepicker-dropdown" @mouseenter="handleMouse" @mouseleave="handleMouse">
        <div class="timepicker-panel">
            <ul class="tip">
                <li class="prev" @click="prevBig()">‹‹</li>
                <li class="current" @click="selectYM()">{{ tip || shortYM }}</li>
                <li class="next" @click="nextBig()">››</li>
            </ul>
            <ul class="years" v-show="status.year">
                <li v-for="(item, index) of yearItems" :key="index" @click="selectYear(item)" :class="{ picked : item.status }">{{ item.name }}</li>
            </ul>
            <ul class="months" v-show="status.month">
                <li v-for="(item, index) of monthItems" :key="index" @click="selectMonth(item)" :class="{ picked : item.status }">{{ item.name }}</li>
            </ul>
            <ul class="week" v-show="status.date">
                <li v-for="(week, index) of weekUnits" :key="index"> {{ week }} </li>
            </ul>
            <ul class="dates" v-show="status.date">
                <li v-for="(item, index) of dateItems" :key="index" @click="selectDate(item)" :class="{ picked: item.status, muted: item.prev || item.next }">{{ item.name }}</li>
            </ul>
            <ul class="hours" v-show="status.hour">
                <li v-for="(item, index) of hourItems" :key="index" @click="selectHour(item)" :class="{ picked: item.status }">{{ item.name }}</li>
            </ul>
            <ul class="mins" v-show="status.min">
                <li v-for="(item, index) of minItems" :key="index" @click="selectMin(item)" :class="{ picked: item.status }">{{ item.name }}</li>
            </ul>
            <ul class="secs" v-show="status.sec">
                <li v-for="(item, index) of secItems" :key="index" @click="selectSec(item)" :class="{ picked: item.status }">{{ item.name }}</li>
            </ul>
            <ul class="times" v-show="status.date">
                <li class="prev" @click="prev()">‹‹</li>
                <li @click="hourSelect()" :class="{ disabled: option.lock.hour }">{{ time.hour }}</li>
                <li class="colon-disabled">:</li>
                <li @click="minSelect()" :class="{ disabled: option.lock.min }">{{ fillZero(time.min) }}</li>
                <li class="colon-disabled">:</li>
                <li @click="secSelect()" :class="{ disabled: option.lock.sec }">{{ fillZero(time.sec) }}</li>
                <li class="next" @click="next()">››</li>
            </ul>
            <ul class="confirm" v-show="status.date">
                <li class="today" @click="today">今天</li>
                <li class="confirm" @click="confirm">确定</li>
            </ul>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Timepicker',
    props: ['option'],
    data() {
        return {
            tip: '',

            time: { year: '', month: '', date: '', hour: '', min: '', sec: '', day: '' },

            yearItems: {},
            monthItems: {},
            dateItems: {},
            hourItems: {},
            minItems: {},
            secItems: {},

            status: { year: false, month: false, date: true, hour: false, min: false, sec: false, day: false },

            monthUnits: {
                0: { name: '1月', ename: 'Jan' },
                1: { name: '2月', ename: 'Feb' },
                2: { name: '3月', ename: 'Mar' },
                3: { name: '4月', ename: 'Apr' },
                4: { name: '5月', ename: 'May' },
                5: { name: '6月', ename: 'Jun' },
                6: { name: '7月', ename: 'Jul' },
                7: { name: '8月', ename: 'Aug' },
                8: { name: '9月', ename: 'Sept' },
                9: { name: '10月', ename: 'Oct' },
                10: { name: '11月', ename: 'Nov' },
                11: { name: '12月', ename: 'Dec' }
            },

            weekUnits: ['日', '一', '二', '三', '四', '五', '六'],

            units: {
                year: { name: '年', template: 'YYYY' },
                month: { name: '月', template: 'MM' },
                date: { name: '日', template: 'DD' },
                hour: { name: '时', template: 'HH' },
                min: { name: '分', template: 'mm' },
                sec: { name: '秒', template: 'ss' }
            },

            timers: {
                autoDismiss: null
            }
        };
    },

    computed: {
        shortYM() {
            let str = '';
            if (this.status.sec) str = this.time.year + this.units.year.name + (this.time.month + 1) + this.units.month.name + this.time.date + this.units.date.name + this.time.min + this.units.min.name + this.time.sec + this.units.sec.name;
            if (this.status.min) str = this.time.year + this.units.year.name + (this.time.month + 1) + this.units.month.name + this.time.date + this.units.date.name + this.time.min + this.units.min.name;
            if (this.status.hour) str = this.time.year + this.units.year.name + (this.time.month + 1) + this.units.month.name + this.time.date + this.units.date.name;
            if (this.status.date) str = this.time.year + this.units.year.name + (this.time.month + 1) + this.units.month.name;
            if (this.status.month) str = this.time.year + this.units.year.name;
            if (this.status.year) str = (this.time.year - 5) + this.units.year.name + '-' + (this.time.year + 6) + this.units.year.name;
            return str;
        }
    },

    methods: {

        initTime(date) {
            if (!!this.timer) window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                this.time = Object.assign(this.time, date);
            }, 80);
        },

        initDefault(param = new Date()) {
            let date = this.deconstruct(param);
            if (this.checkDate(date)) {
                this.initYMD(date);
                this.initHMS(date);
                this.initTime(date);
            }
        },

        checkDate(date) {
            let select = this.getObjDate(date);
            let cs, ce, start, end;
            if (!!this.option.start) {
                cs = this.getObjDate(this.deconstruct(this.option.start));
                start = select.getTime() < cs.getTime();
            }
            if (!!this.option.end) {
                ce = this.getObjDate(this.deconstruct(this.option.end));
                end = select.getTime() > ce.getTime();
            }
            if (start || end) {
                this.tip = '所选时间超过' + (start ? '开始' : '结束') + '时间';
                window.setTimeout(() => { this.tip = ''; }, 1500);
                return false;
            } else {
                return true;
            }
        },

        initYMD(date) {
            date = Object.assign(Object.assign({}, this.time), date);
            if (this.checkDate(date)) {
                let year = date.year - 5;
                let yearItems = {};
                for (let i = 0; i < 12; i++) {
                    let val = year + i;
                    yearItems[val] = { name: val, val: val, status: date.year === val };
                }
                this.yearItems = yearItems;
                let monthItems = {};
                for (let i = 0; i < 12; i++) {
                    monthItems[i] = { name: this.monthUnits[i].name, ename: this.monthUnits[i].ename, val: i, status: date.month === i };
                }
                this.monthItems = monthItems;
                this.createDateItems(date);
                this.initTime(date);
            }
        },

        initHMS(date) {
            date = Object.assign(Object.assign({}, this.time), date);
            if (this.checkDate(date)) {
                let hourItems = {};
                for (let i = 0; i < 24; i++) {
                    hourItems[i] = { name: i, val: i, status: date.hour === i };
                }
                this.hourItems = hourItems;
                let minItems = {};
                let secItems = {};
                for (let i = 0; i < 56; i = i + 5) {
                    let val = this.fillZero(i);
                    minItems[i] = { name: val, val: i, status: date.min === i };
                    secItems[i] = { name: val, val: i, status: date.sec === i };
                }
                this.minItems = minItems;
                this.secItems = secItems;
                this.initTime(date);
            }
        },

        prev() {
            let date = this.getObjDate(this.time);
            date.setHours(date.getHours() - 1);
            let temp = this.deconstruct(date);
            if (temp.hour === 23) {
                this.initYMD(temp);
            }
            this.initHMS(temp);
        },

        prevBig() {
            let date = this.getObjDate(this.time);
            if (this.status.date) {
                const currentDate = date.getDate();
                date.setDate(1);
                date.setMonth(date.getMonth() - 1);
                let daysInMonth = new Date(date.getYear(), date.getMonth() + 1, 0).getDate();
                date.setDate(Math.min(currentDate, daysInMonth));
            } else if (this.status.month) {
                date.setFullYear(date.getFullYear() - 1);
            } else if (this.status.year) {
                date.setFullYear(date.getFullYear() - 12);
            }
            let temp = this.deconstruct(date);
            this.initYMD(temp);
        },

        selectYM() {
            if (this.status.date) {
                this.status.date = false;
                this.status.month = true;
            } else if (this.status.month) {
                this.status.month = false;
                this.status.year = true;
            }
        },

        nextBig() {
            let date = this.getObjDate(this.time);
            if (this.status.date) {
                date.setMonth(date.getMonth() + 1);
            } else if (this.status.month) {
                date.setFullYear(date.getFullYear() + 1);
            } else if (this.status.year) {
                date.setFullYear(date.getFullYear() + 12);
            }
            let temp = this.deconstruct(date);
            this.initYMD(temp);
        },

        next() {
            let date = this.getObjDate(this.time);
            date.setHours(date.getHours() + 1);
            let temp = this.deconstruct(date);
            if (temp.hour === 0) {
                this.initYMD(temp);
            }
            this.initHMS(temp);
        },

        hourSelect() {
            if (this.option.lock.hour) return;
            this.status.hour = true;
            this.status.date = false;
        },

        minSelect() {
            if (this.option.lock.min) return;
            this.status.min = true;
            this.status.date = false;
        },

        secSelect() {
            if (this.option.lock.sec) return;
            this.status.sec = true;
            this.status.date = false;
        },

        today() {
            let date = new Date();
            if (this.option.lock.min) date.setMinutes(0);
            else date = this.setMinToDate(date);
            if (this.option.lock.sec) date.setSeconds(0);
            date.setMilliseconds(0);
            this.initDefault(date);
        },

        confirm() {
            let format = this.option.template.replace('YYYY', this.time.year).replace('MM', this.fillZero(this.time.month + 1)).replace('DD', this.fillZero(this.time.date)).replace('HH', this.fillZero(this.time.hour)).replace('mm', this.fillZero(this.time.min)).replace('ss', this.fillZero(this.time.sec));
            let date = new Date(this.time.year, this.time.month, this.time.date, this.time.hour, this.time.min, this.time.sec);
            if (this.checkDate(date)) {
                this.$emit('cbtime', { date: format, type: this.option.type });
            }
        },

        destroy(id) {
            this.$emit('destroy', {id: id});
        },

        createDateItems(param) {
            let { year, month, date } = param;
            let months = [31, (this.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            let temp = new Date();
            temp.setFullYear(year);
            temp.setMonth(month);
            temp.setDate(1);
            let start = temp.getDay() > 0 ? temp.getDay() : 7;

            let prev = (month - 1) < 0 ? 11 : month - 1;
            let prevYear = prev === 11;
            let next = (month + 1) > 11 ? 0 : month + 1;
            let nextYear = next === 0;

            let currMonth = months[month];
            let prevMonth = months[prev];

            month = this.fillZero(month);
            prev = this.fillZero(prev);
            next = this.fillZero(next);

            prev = prevYear ? (year - 1) + prev : year + '' + prev;
            next = nextYear ? (year + 1) + next : year + '' + next;
            month = year + month;

            let dateItems = {};
            let end = 0;

            for (let i = prevMonth; i > (prevMonth - start); i--) {
                let index = this.fillZero(i);
                dateItems[prev + '' + index] = { name: i, val: prev + index, status: false, prev: true, next: false };
                end++;
            }

            for (let i = 1; i < (currMonth + 1); i++) {
                let index = this.fillZero(i);
                dateItems[month + '' + index] = { name: i, val: month + index, status: date === i, prev: false, next: false };
                end++;
            }

            for (let i = 1; i < (43 - end); i++) {
                let index = this.fillZero(i);
                dateItems[next + '' + index] = { name: i, val: next + index, status: false, prev: false, next: true };
            }

            this.dateItems = dateItems;
        },

        selectYear(item) {
            this.initYMD({ year: item.val, month: this.time.month - 1 });
            this.status.month = true;
            this.status.year = false;
        },

        selectMonth(item) {
            this.initYMD({ month: item.val });
            this.status.date = true;
            this.status.month = false;
        },

        selectDate(item) {
            let date = item.val;
            this.initYMD({ year: Number(date.substring(0, 4)), month: Number(date.substring(4, 6)), date: Number(date.substring(6, 8)) });
        },

        selectHour(item) {
            this.initHMS({ hour: item.val });
            this.status.date = true;
            this.status.hour = false;
        },

        selectMin(item) {
            this.initHMS({ min: item.val });
            this.status.date = true;
            this.status.min = false;
        },

        selectSec(item) {
            this.initHMS({ sec: item.val });
            this.status.date = true;
            this.status.sec = false;
        },

        deconstruct(param) {
            if (this.isDate(param)) {
                return { year: param.getFullYear(), month: param.getMonth(), date: param.getDate(), hour: param.getHours(), min: param.getMinutes(), sec: param.getSeconds(), ms: param.getMilliseconds(), day: param.getDay() };
            } else if (this.isString(param)) {
                let dateArr = param.replace(/:;_-\\s+/g, '#').match(/\d+/g);
                dateArr = dateArr.map(function (date) {
                    return Number(date);
                });
                let date = { year: dateArr[0], month: dateArr[1] - 1, date: dateArr[2], hour: dateArr[3], min: dateArr[4] || 0, sec: dateArr[5] || 0, ms: 0 };
                let day = this.getObjDate(date).getDay();
                return Object.assign({ day: day }, date);
            }
        },

        isDate(date) {
            return Object.prototype.toString.call(date) === '[object Date]';
        },

        isString(str) {
            return Object.prototype.toString.call(str) === '[object String]';
        },

        fillZero(val) {
            return val < 10 ? '0' + val : '' + val;
        },

        isLeapYear(year) {
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        clone(date) {
            let clone = new Date();
            clone.setFullYear(date.getFullYear());
            clone.setMonth(date.getMonth());
            clone.setDate(date.getDate());
            clone.setHours(date.getHours());
            clone.setMinutes(date.getMinutes());
            clone.setSeconds(date.getSeconds());
            clone.setMilliseconds(date.getMilliseconds());
            return clone;
        },

        getObjDate(param) {
            let date = new Date();
            const daysInMonth = new Date(param.year, date.getMonth() + 1, 0).getDate();
            date.setFullYear(param.year);
            date.setDate(param.date);
            date.setMonth(param.month);
            if (daysInMonth < param.date) date.setDate(param.date);
            date.setHours(param.hour);
            date.setMinutes(param.min);
            date.setSeconds(param.sec);
            date.setMilliseconds(param.ms);
            return date;
        },

        setMinToDate(date, target = 5) {
            let min = date.getMinutes();
            min -= (min % target);
            date.setMinutes(min);
            return date;
        },

        setPosition() {
            let target = document.getElementById(this.option.id).getBoundingClientRect();
            let el = document.getElementById('timepicker');
            let picker = el.getBoundingClientRect();

            let divideW = window.innerWidth - 20 - picker.width;
            let lr = target.left > divideW ? 'right' : 'left';
            let divideH = window.innerHeight - 10 - target.height - picker.height;

            let tb = target.top > divideH ? 'bottom' : 'top';
            let position = 'timepicker-' + tb + '-' + lr;
            if (tb === 'top') {
                el.style.top = target.bottom + 10 - this.option.top + 'px';
            } else {
                el.style.top = (target.bottom - 10 - target.height - picker.height) - this.option.top + 'px';
            }
            if (this.option.hasOwnProperty('left')) {
                el.style.left = this.option.left + 'px';
            } else {
                if (lr === 'left') {
                    el.style.left = (target.left) + 'px';
                } else {
                    el.style.left = (target.right - picker.width) + 'px';
                }
            }

            el.className = 'timepicker-container timepicker-dropdown ' + position;
        },

        handleMouse: function (e) {
            // autoDismiss 选项用于鼠标移出控件达到某个时间后自动销毁控件
            if (this.option.autoDismiss) {
                if (e.type === 'mouseenter') {
                    window.clearTimeout(this.timers.autoDismiss)
                } else if (e.type === 'mouseleave') {
                    this.timers.autoDismiss = window.setTimeout(() => {
                        this.destroy()
                    }, this.option.autoDismissTimeout || 2000)
                }
            }
        }
    },

    mounted() {
        this.initDefault(this.option.date);
        this.setPosition();
        window.setTimeout(function () {
            window.document.onclick = (e) => {
                if (e.target.getAttribute('data-picker')) {
                    this.initDefault(this.option.date);
                    this.setPosition();
                } else if (e.path[3].id !== 'timepicker') {
                    this.destroy(e.target.id);
                }
            };
            window.onresize = () => { this.setPosition(); };
        }.bind(this), 1);
    },

    destroyed() {
        window.onresize = '';
        window.document.onclick = '';
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.timepicker-container {
    font-size: @font-normal;
    line-height: 20px;
    position: fixed;
    z-index: @pop-index + 1;
    top: 0;
    left: 0;
    width: 210px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    background-color: #fff;
    direction: ltr !important;
    -ms-touch-action: none;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
}

.timepicker-container:before,
.timepicker-container:after {
    position: absolute;
    display: block;
    width: 0;
    height: 0;
    content: ' ';
    border: 5px solid transparent;
}

.timepicker-dropdown {
    position: absolute;
    z-index: @pop-index + 100;
    -webkit-box-sizing: content-box;
    -moz-box-sizing: content-box;
    box-sizing: content-box;
    border: 1px solid #ccc;

    box-shadow: @shadow;
}

.timepicker-inline {
    position: static;
}

.timepicker-top-left,
.timepicker-top-right {
    border-top-color: #39f;
}

.timepicker-top-left:before,
.timepicker-top-left:after,
.timepicker-top-right:before,
.timepicker-top-right:after {
    top: -5px;
    left: 10px;
    border-top: 0;
}

.timepicker-top-left:before,
.timepicker-top-right:before {
    border-bottom-color: #39f;
}

.timepicker-top-left:after,
.timepicker-top-right:after {
    top: -4px;
    border-bottom-color: #fff;
}

.timepicker-bottom-left,
.timepicker-bottom-right {
    border-bottom-color: #39f;
}

.timepicker-bottom-left:before,
.timepicker-bottom-left:after,
.timepicker-bottom-right:before,
.timepicker-bottom-right:after {
    bottom: -5px;
    left: 10px;
    border-bottom: 0;
}

.timepicker-bottom-left:before,
.timepicker-bottom-right:before {
    border-top-color: #39f;
}

.timepicker-bottom-left:after,
.timepicker-bottom-right:after {
    bottom: -4px;
    border-top-color: #fff;
}

.timepicker-top-right:before,
.timepicker-top-right:after,
.timepicker-bottom-right:before,
.timepicker-bottom-right:after {
    right: 10px;
    left: auto;
}

.timepicker-panel {
    height: 204px;
}

.timepicker-panel>ul {
    width: 100%;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid #eee;
}

.timepicker-panel>ul:before,
.timepicker-panel>ul:after {
    display: table;
    content: ' ';
}

.timepicker-panel>ul:after {
    clear: both;
}

.timepicker-panel>ul>li {
    float: left;
    width: 30px;
    height: 20px;
    margin: 0;
    padding: 0;
    list-style: none;
    cursor: pointer;
    text-align: center;
    background-color: #fff;
}

.timepicker-panel>ul>li:hover {
    background-color: #eee;
}

.timepicker-panel>ul>li.disabled,
.timepicker-panel>ul>li.disabled:hover {
    cursor: default;
    color: #ccc;
    background-color: #fff;
}

.timepicker-panel>ul>li {
    font-size: @font-normal;
}

.timepicker-panel>ul.tip>li.prev,
.timepicker-panel>ul.tip>li.next {
    font-size: 18px;
}

.timepicker-panel>ul.tip>li.current {
    width: 150px;
}

.timepicker-panel>ul.years>li,
.timepicker-panel>ul.months>li {
    line-height: 52.5px;
    width: 52.5px;
    height: 52.5px;
}

.timepicker-panel>ul.week {
    border-bottom: 0;
}

.timepicker-panel>ul.times>li,
.timepicker-panel>ul.times>li {
    width: 30px;
}

.timepicker-panel>ul.times>li.prev,
.timepicker-panel>ul.times>li.next {
    font-size: 18px;
    width: 45px;
}

.timepicker-panel>ul.times>li.colon-disabled,
.timepicker-panel>ul.times>li.colon-disabled {
    width: 15px;
}

.timepicker-panel>ul.week>li,
.timepicker-panel>ul.week>li:hover,
.timepicker-panel>ul.times>li.colon-disabled:hover,
.timepicker-panel>ul.times>li.colon-disabled:hover {
    cursor: default;
    background-color: #fff;
}

.timepicker-panel>ul.hours>li,
.timepicker-panel>ul.mins>li,
.timepicker-panel>ul.secs>li {
    width: 35px;
    height: 40px;
    line-height: 40px;
}

.timepicker-panel>ul>li.muted,
.timepicker-panel>ul>li.muted:hover {
    color: #999;
}

.timepicker-panel>ul>li.picked,
.timepicker-panel>ul>li.picked:hover {
    background: rgb(85, 139, 193);
    color: #FFF;
}

.timepicker-panel>ul.confirm>li {
    width: 105px;
    height: 20px;
}

.timepicker-panel>ul.confirm>li:nth-child(1) {
    width: 104px;
    border-right: 1px solid #eee;
}

.history-cases {
    .timepicker-dropdown {
        position: fixed;
    }
}

</style>
