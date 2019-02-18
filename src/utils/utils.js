const md5 = require('blueimp-md5')
const base64 = require('js-base64').Base64
const isDevEnv = process.env.NODE_ENV === 'development'

/**
 * ----------------------------------------------------------------------------
 *                              Utillity list
 * ----------------------------------------------------------------------------
 * serialize          - 序列化参数对象
 * composeReqUrl      - 拼接请求 URL
 * serializeWithAuth  - 序列化参数对象并注入鉴权信息
 * generateAuthInfo   - 生成鉴权参数对象
 * injectAuthInfo     - 向参数对象中注入鉴权属性
 * checkLoop          - 循环检测对象属性并在满足条件时执行回调函数
 * selectElem         - querySelector
 * selectElems        - querySelectorAll
 * get                - fetch get
 * post               - fetch post
 */

class utils {
    /**
     * 序列化参数对象
     *
     * @param {object} reqParamObj 参数对象
     * @returns {string} query string
     */
    static serialize(reqParamObj) {
        const queryArray = []
        const encode = encodeURIComponent

        for (let key in reqParamObj) {
            const value = reqParamObj[key]

            if (typeof value === 'object') {
                queryArray.push(encode(key) + '=' + encode(JSON.stringify(value)))
            } else {
                queryArray.push(encode(key) + '=' + encode(reqParamObj[key]))
            }
        }

        return queryArray.join('&')
    }

    /**
     * 拼接请求 URL，默认添加鉴权参数
     *
     * @param {string} baseUrl 未添加参数的 URL
     * @param {object} reqParamObj 请求参数对象
     * @param {boolean} needAuthInfo 是否需要添加鉴权信息
     * @returns {string} 目标请求 URL
     */
    static composeReqUrl(baseUrl, reqParamObj = {}, needAuthInfo = true) {
        if (needAuthInfo === true) {
            return baseUrl + '?' + this.serializeWithAuth(reqParamObj)
        } else {
            return baseUrl + '?' + this.serialize(reqParamObj)
        }
    }

    /**
     * 序列化参数对象并注入鉴权信息
     *
     * @param {object} reqParamObj 请求参数对象
     * @returns {string} query string
     */
    static serializeWithAuth(reqParamObj) {
        return this.serialize(this.injectAuthInfo(reqParamObj))
    }

    /**
     * 生成鉴权参数对象
     *
     * @returns {object} 鉴权参数对象
     */
    static generateAuthInfo() {
        let PRIVATE_KEY = '123!@#QWE'
        let time = new Date().getTime()
        let signTime = base64.encode(time)
        let sign = md5(PRIVATE_KEY + time)

        return { signTime, sign }
    }

    /**
     * 生成鉴权参数对象（别名）
     *
     * @returns {object} 鉴权参数对象
     */
    static genAuthInfo() {
        return this.generateAuthInfo()
    }

    /**
     * 往参数对象中注入鉴权属性
     *
     * @param {object} reqParamObj 请求参数对象
     * @returns {object} 原参数对象
     */
    static injectAuthInfo(reqParamObj = {}) {
        return Object.assign(reqParamObj, this.generateAuthInfo())
    }

    /**
     * querySelector
     *
     * @param {string} selector 选择器
     * @param {HTMLElement} searchRoot 开始搜索的根元素
     * @returns {Element} 匹配的第一个元素
     */
    static selectElem(selector, searchRoot) {
        if (searchRoot) {
            try {
                return searchRoot.querySelector(selector)
            } catch (err) {
                console.error(err)
                return null
            }
        } else {
            return document.querySelector(selector)
        }
    }

    /**
     * querySelectorAll
     *
     * @param {string} selector 选择器
     * @param {HTMLElement} searchRoot 开始搜索的根元素
     * @returns {NodeList} 匹配的所有元素
     */
    static selectElems(selector, searchRoot) {
        if (searchRoot) {
            try {
                return searchRoot.querySelectorAll(selector)
            } catch (err) {
                console.error(err)
                return null
            }
        } else {
            return document.querySelectorAll(selector)
        }
    }

    /**
     * 循环检测对象属性并在满足条件时执行回调函数
     *
     * @param {object} arg 参数对象
     * @returns {promise} Promise 对象
     */
    static checkLoop(arg) {
        return new Promise((resolve, reject) => {
            let thisVal, checkInterval, checkKey, checkVal, booleanConversion

            if (typeof arg === 'object') {
                thisVal = arg.thisVal
                checkInterval = arg.checkInterval || 15
                checkKey = arg.checkKey
                checkVal = arg.checkVal
                booleanConversion = arg.booleanConversion || false

                if (typeof thisVal !== 'object') {
                    reject(new Error('Invalid argument'))
                }

                if (isNaN(Number(checkInterval))) {
                    reject(new Error('Invalid argument'))
                }

                if (typeof checkKey !== 'string') {
                    reject(new Error('Invalid argument'))
                }

                booleanConversion = !!booleanConversion

                let checkValue = function () {
                    if (booleanConversion === true) {
                        if (!!thisVal[checkKey] === checkVal) {
                            resolve()
                        } else {
                            setTimeout(checkValue, checkInterval)
                        }
                    } else {
                        if (thisVal[checkKey] === checkVal) {
                            resolve()
                        } else {
                            setTimeout(checkValue, checkInterval)
                        }
                    }
                }

                setTimeout(checkValue, checkInterval)
            } else {
                reject(new Error('Invalid argument'))
            }
        })
    }

    static get(url, param = {}) {
        return this.GET(url, param);
    }

    /**
     * fetch get 请求
     *
     * @param {string} url 请求路径
     * @param {object} param 请求参数
     * @return {promise} 返回回调函数
     */
    static GET(url, param = {}) {
        if (!param.code) param.code = '44';
        url = this.composeReqUrl(url, param);
        return fetch(url, { credentials: isDevEnv ? 'same-origin' : 'include' }).then(function (response) {
            if (response.ok) return response.json();
            else throw new Error(`request failed: ${url}`);
        });
    }

    static post(url, param = {}) {
        return this.POST(url, param);
    }

    /**
     * fetch post 请求
     *
     * @param {string} url 请求路径
     * @param {object} param 请求参数
     * @return {promise} 返回回调函数
     */
    static POST(url, param = {}) {
        if (!param.code) param.code = '44';
        return fetch(url, {
            method: 'POST',
            credentials: isDevEnv ? 'same-origin' : 'include',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: this.serializeWithAuth(param)
        }).then(function (response) {
            if (response.ok) return response.json();
            else throw new Error(`request failed: ${url}`);
        });
    }

    /**
     * 区域编码补零
     *
     * @param {string} code 旧区域编码
     * @return {string} 新区域编码
     */
    static patchZero(code) {
        const count = 6 - code.length;
        for (let i = 0; i < count; i++) code += '0';
        return code;
    }

    /**
     * 判断对象是否为空
     */
    static isEmptyObject(param = {}) {
        return !!param && Object.keys(param).length === 0;
    }

    /**
     * 判断数组是否为空
     */
    static isEmptyArray(param = []) {
        return !!param && param.length === 0;
    }

    /**
     * 判断是否为数组
     */
    static isArray(param = []) {
        return Object.prototype.toString.call(param) === '[object Array]';
    }

    /**
     * 判断是否为空字符串
     */
    static isEmptyString(param = '') {
        return param.length === 0;
    }

    /**
     * 去除两边空格
     */
    static trim(str = '') {
        return str.replace(/^\s+|\s+$/g, '');
    }

    /**
     * 清除定时器
     */
    static clearTimer(timer) {
        if (!!timer) window.clearTimeout(timer);
        return null;
    }

    /**
     * 自动计算页码
     */
    static calcPage(param) {
        param.sum = Math.ceil(param.length / param.num);
        param.start = (param.curr - 1) * param.num;
        param.end = (param.curr) * param.num;
        return Object.assign({}, param);
    }

}

module.exports = utils
