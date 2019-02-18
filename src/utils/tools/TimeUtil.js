/**
 * 时间转换
 * @author smile2u2013
 * @class TimeUtil
 */
class TimeUtil {
    constructor(date) {
        this._date = this.toDate(date) || new Date();
        return this;
    }

    patchZero(val) {
        val = Number(val);
        return Number.isNaN(val) ? '00' : val < 10 ? `0${val}` : `${val}`;
    }

    format(template = 'YYYYMMDDHHmmss') {
        let date = this.split(this._date);
        let dateTypes = Object.keys(date);
        for (let type of dateTypes) {
            date[type] = this.patchZero(date[type]);
        }
        return template
            .replace('YYYY', date.year)
            .replace('MM', date.month)
            .replace('DD', date.date)
            .replace('HH', date.hour)
            .replace('mm', date.min)
            .replace('ss', date.sec);
    }

    split(param) {
        param = param || this._date;
        let year, month, date, hour, min, sec;
        if (this.isStr(param)) {
            if (Number.isNaN(Number(param))) {
                [year, month, date, hour, min, sec] = param.replace(/:;_-\\s+/g, '#').match(/\d+/g);
            } else {
                year = param.substring(0, 4);
                month = param.substring(4, 6);
                date = param.substring(6, 8);
                hour = param.substring(8, 10);
                min = param.substring(10, 12) || 0;
                sec = param.substring(12, 14) || 0;
            }
        } else if (this.isDate(param)) {
            year = param.getFullYear();
            month = param.getMonth() + 1;
            date = param.getDate();
            hour = param.getHours();
            min = param.getMinutes();
            sec = param.getSeconds();
        }
        return {
            year: year,
            month: this.patchZero(month),
            date: this.patchZero(date),
            hour: this.patchZero(hour),
            min: this.patchZero(min),
            sec: this.patchZero(sec)
        };
    }

    toDate(param) {
        param = param || this._date;
        if (this.isStr(param)) {
            let { year, month, date, hour, min, sec } = this.split(param);
            return new Date(year, month - 1, date, hour, min, sec);
        } else if (this.isDate(param)) {
            return param;
        } else if (this.isObj(param)) {
            let { year, month, date, hour, min, sec } = param;
            return new Date(year, month - 1, date, hour, min, sec);
        }
    }

    getDate() {
        return this._date;
    }

    year(val) {
        this._date.setFullYear(this._date.getFullYear() + Number(val));
        return this;
    }

    setYear(val) {
        this._date.setFullYear(Number(val));
        return this;
    }

    month(val) {
        this._date.setMonth(this._date.getMonth() + Number(val));
        return this;
    }

    setMonth(val) {
        this._date.setMonth(Number(val));
        return this;
    }

    date(val) {
        this._date.setDate(this._date.getDate() + Number(val));
        return this;
    }

    setDate(val) {
        this._date.setDate(Number(val));
        return this;
    }

    hour(val) {
        this._date.setHours(this._date.getHours() + Number(val));
        return this;
    }

    setHour(val) {
        this._date.setHours(Number(val));
        return this;
    }

    min(val) {
        this._date.setMinutes(this._date.getMinutes() + Number(val));
        return this;
    }

    setMin(val) {
        this._date.setMinutes(Number(val));
        return this;
    }

    sec(val) {
        this._date.setSeconds(this._date.getSeconds() + Number(val));
        return this;
    }

    setSec(val) {
        this._date.setSeconds(Number(val));
        return this;
    }

    clearMMSS(date) {
        date = date || this._date;
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    clone(date) {
        let result = new Date('2000-1-1');
        result.setFullYear(date.getFullYear());
        result.setMonth(date.getMonth());
        result.setDate(date.getDate());
        result.setHours(date.getHours());
        result.setMinutes(date.getMinutes());
        result.setSeconds(date.getSeconds());
        result.setMilliseconds(date.getMilliseconds());
        return result;
    }

    subtract(start, end) {
        start = this.toDate(start);
        end = this.toDate(end);
        let time = Math.abs(start - end);
        let date = Math.floor(time / (1000 * 60 * 60 * 24));
        let tempHour = time % (1000 * 60 * 60 * 24);
        let hour = Math.floor(tempHour / (1000 * 60 * 60));
        let tempMin = tempHour % (1000 * 60 * 60);
        let min = Math.floor(tempMin / (1000 * 60));
        let tempSec = tempMin % (1000 * 60);
        let sec = Math.round(tempSec / 1000);
        if (sec === 60) {
            min += 1;
            sec = 0;
        }
        if (min === 60) {
            hour += 1;
            min = 0;
        }
        if (hour === 24) {
            date += 1;
            hour = 0;
        }
        return { date, hour, min, sec };
    }

    matchMin(date, source = 6, target = 6) {
        source = Number(source);
        target = Number(target);
        date = this.clone(this.toDate(date));

        const mapping = {
            5: [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ],
            6: [ 0, 0, 6, 12, 18, 24, 30, 30, 36, 42, 48, 54 ],
            10: [ 0, 0, 10, 10, 20, 20, 30, 30, 40, 40, 50, 50 ]
        };

        let min = date.getMinutes();

        const index = mapping[source].indexOf(min);
        min = mapping[target][index];
        date.setMinutes(min);
        return date;
    }

    nextTime(min) {
        min = Number(min);
        let date = new Date();
        let tempMin = date.getMinutes();
        let nextDate = this.clearMMSS(this.clone(date));
        for (let i = 1; i <= min; i++) {
            if ((tempMin + i) % min === 0) {
                nextDate.setMinutes(tempMin + i);
                break;
            }
        }
        let time = nextDate.getTime() - date.getTime();
        return time;
    }

    lastMin(min) {
        min = Number(min);
        let date = new Date();
        let tempMin = date.getMinutes();
        let nextDate = this.clearMMSS(this.clone(date));
        for (let i = 1; i <= min; i++) {
            if ((tempMin + i) % min === 0) {
                nextDate.setMinutes(tempMin + i);
                break;
            }
        }
        let result = Number(nextDate.getMinutes() - min);
        result = result < 0 ? 60 - min : result;
        result = result < 10 ? '0' + result : result;
        return result + '';
    }

    timeCN(time) {
        const mapping = {
            month: [ '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月' ]
        }
        return mapping.month[time - 1];
    }

    isDate(date) {
        return Object.prototype.toString.call(date) === '[object Date]';
    }

    isStr(str) {
        return Object.prototype.toString.call(str) === '[object String]';
    }

    isObj(str) {
        return Object.prototype.toString.call(str) === '[object Object]';
    }
}

function TU(date) {
    return new TimeUtil(date);
}

module.exports = TU;
