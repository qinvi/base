<template>
   <div class="login-box" v-if="status" v-on:keyup.enter="oncheckuser();">
		<div class="login-bottom"></div>
		<div class="login-table">
			<div class="logo">
				<h3>{{ title }}</h3>
			</div>
			<div class="login-left-box">
				<div class="login-ban">
					<h1>你若安好，便是晴天</h1>
				</div>
			</div>
			<div class="login-right-box">
                <table width="100%" height="120">
                    <tr height="40">
                        <td>
                            <div class="input">
                                <label>用户名</label>
                                <input v-model="username" @blur="checkUserName();"/>
                            </div>
                        </td>
                    </tr>
                    <tr height="40">
                        <td>
                            <div class="input">
                                <label>密码</label>
                                <input type='password' v-model='password'/>
                            </div>
                            <div class="message">{{message}}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 15px;">
                            <input type="checkbox" class="checkbox" v-model="isAutoLogin" id="j_autologin"/>
                            <label for="j_autologin" style="color: #f5f5f6;font-size: 13px;">自动登录</label>
                        </td>
                    </tr>
                    <tr height="40">
                        <td>
                            <input type="button" class="login-btn" @click="oncheckuser();" value="登录" v-focus/>
                        </td>
                    </tr>
                    <tr>
                        <td v-show="tip">
                            <label class="tips"><i class="icon-info"></i>系统默认测试账号仅提供基础功能，体验高级功能需使用专属账号登录</label>
                        </td>
                    </tr>
                </table>
			</div>
			<div class="footer">
				<span>{{ title }}</span>
				<span>技术支持：数鹏通（LinkCM）科技</span>
				<span>Copyright©广东省气象局</span>
				<span>值班电话：18818401760</span>
			</div>

		</div>
		<div class="pop_div" v-if="showChrome">
			<a class="close" @click="showChrome = false"></a>
			<span>请使用谷歌浏览器打开本系统
				<a class="downsrc" href="http://10.148.16.56/soft/ChromeSetup-32.exe"><i class="icon-download"></i>32位下载</a>
				<a class="downsrc" href="http://10.148.16.56/soft/ChromeSetup.exe"><i class="icon-download"></i>64位下载</a>
			</span>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import md5 from 'blueimp-md5';
export default {
    name: 'Login',
    data() {
        return {
            showChrome: false,
            tip: false,
            status: false,
            isAutoLogin: false,
            username: '',
            password: '',
            message: '',
            areaInfo: {}
        };
    },
    directives: {
        focus: {
            // 指令的定义
            inserted: function (el) {
                el.focus()
            }
        }
    },
    watch: {
        message() {
            this.status = true;
        },
        version() {
            this.updateSysName();
        }
    },
    computed: {
        ...mapState({
            name: state => state.sys.name,
            areaName: state => state.sys.areaName,
            ename: state => state.sys.ename,
            version: state => state.sys.version,
            userId: state => state.userId
        })
    },
    methods: {
        ...mapActions(['updateParam']),
        getClientFromIps() {
            utils.GET(`${sysconfig.TESTPATH}/login/getBrowsesUserInfo`).then(data => {
                data = data.data.userName;
                // data = null;
                if (!data) {
                    this.username = 'guest'; // 'guest'; TestAdmin gduser
                } else {
                    this.username = data;

                    if (data.substr(0, 5) !== 'guest') {
                        const areaPinYin = data.substring(0, data.length - 5)

                        utils.GET(`${sysconfig.TESTPATH}/login/getNameByPinYin`, {
                            pinyin: areaPinYin,
                            code: 44
                        }).then(json => {
                            if (!json || !json.data || !json.data.area) {
                                throw new Error('NO DATA')
                            }

                            this.areaInfo.areaName = json.data.area.name
                            this.areaInfo.code = json.data.area.code
                        }).catch(ex => {
                            console.error(ex.message)
                        })

                        window.history.replaceState({}, document.title, window.location.protocol + '//' + [window.location.host, 'dss', areaPinYin, 'index.html'].join('/'))
                    }
                }
                this.password = 'LinkCM_Test'; // 'LinkCM_Test'; 123456 user123
                this.tip = this.username.endsWith('guest');
            });
        },

        trim(str) {
            return str.replace(/(^\s*)|(\s*$)/g, '');
        },

        keyEvenFocus(e) {
            var key = window.event ? e.keyCode : e.which;
            if (key === 13 && this.trim(document.securityForm.j_username.value)) {
                document.securityForm.password.focus();
            }
        },

        checkUserName() {
            if (this.username.endsWith('guest') !== -1) {
                this.tip = true;
                this.password = 'LinkCM_Test';
            } else {
                this.tip = false;
            }
        },

        // 获取浏览器访问地址的市县拼音
        getLocationParam() {
            // 如 http://10.148.16.56/dss/shanwei/login.jsp  => shanwei
            var location = window.location.href.toString();
            var tempParam = location.split('dss/')[1];
            tempParam = tempParam.replace('login.jsp', '').replace(/\//g, '');
            return tempParam;
        },

        isIe(userAgent) {
            var UA = userAgent || navigator.userAgent;
            if (/msie/i.test(UA)) {
                return UA.match(/msie (\d+\.\d+)/i)[1];
            } else if (~UA.toLowerCase().indexOf('trident') && ~UA.indexOf('rv')) {
                return UA.match(/rv:(\d+\.\d+)/)[1];
            }
            return false;
        },

        changeAutoStatus() {
            this.isAutoLogin = !this.isAutoLogin;
        },
        oncheckuser(isAuto = false) {
            if (this.username === '') {
                this.message = '用户不能为空.';
                return;
            } else if (this.password === '') {
                this.message = '密码不能为空.';
                return;
            } else {
                let url = sysconfig.TESTPATH + '/login/login';
                let md5Password = md5(this.username + this.password);
                let data = { username: this.username, password: isAuto ? this.password : md5Password, code: this.areaInfo.code };
                utils.POST(url, data).then(data => {
                    let username = this.username;
                    if (data.status === 0) {
                        data = data.data;
                        if (data.message === 'success') {
                            let userId;
                            if (username.endsWith('guest')) {
                                this.tip = true;
                                userId = 188; // 188; 343 25 387
                            } else {
                                userId = data.userId;
                            }
                            this.updateParam([ 'userSetting', { region: { code: data.code, areaName: data.areaName }, userId: userId, userName: username } ]);
                            this.updateParam([ 'sys', { areaName: data.areaName, code: data.code } ]);
                            // if (this.areaInfo.code) {
                            //     this.updateParam([ 'userSetting', { region: { code: this.areaInfo.code, areaName: this.areaInfo.areaName }, userId: userId, userName: username } ]);
                            //     this.updateParam([ 'sys', { areaName: this.areaInfo.areaName, code: this.areaInfo.code } ]);
                            // } else {
                            //     this.updateParam([ 'userSetting', { region: { code: data.code, areaName: data.areaName }, userId: userId, userName: username } ]);
                            //     this.updateParam([ 'sys', { areaName: data.areaName, code: data.code } ]);
                            // }

                            let obj = {
                                username: this.username,
                                password: isAuto ? this.password : md5Password
                            };
                            let user = JSON.stringify(obj);
                            if (this.status) {
                                this.setCookieParam(user);
                            }
                            window.sessionStorage.setItem('user', user);
                            this.$emit('destroy');
                        } else {
                            this.message = '用户名或密码错误';
                        }
                    }
                });
            }
        },
        autoLoin(obj) {
            obj = JSON.parse(obj);
            this.username = obj.username;
            this.password = obj.password;
            this.oncheckuser(true);
        },

        setCookieParam(user) {
            if (this.isAutoLogin) {
                window.localStorage.setItem('j_view_autologin', user);
            } else {
                window.localStorage.setItem('j_view_autologin', '');
            }
        },

        updateSysName() {
            const title = utils.selectElem('#sysname');
            const sysName = `${this.areaName}${this.name} ${this.version}`;
            title.text = this.title = sysName;
        }
    },
    beforeMount() {
        this.updateSysName();
        let user = window.sessionStorage.getItem('user');
        if (!!user) {
            this.autoLoin(user);
        } else {
            let obj = window.localStorage.getItem('j_view_autologin');
            if (!!obj) this.autoLoin(obj);
            else {
                this.status = true;
                let ischrome = this.isIe();
                if (!ischrome || parseInt(ischrome) < 11) {
                    this.showChrome = true;
                }
                this.getClientFromIps();
            }
        }
    }
}
</script>

<style scoped lang="less">
@import '../assets/css/common.less';
@import '../assets/css/icomoon/style.css';
@images: '../assets/img/login';
body {
    background: #f2f5fa;
    margin: 0px;
    padding: 0px;
    min-width: 1280px;
}
@-webkit-keyframes bounce-down {
    0% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0);
    }
}

@keyframes bounce-down {
    0% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0);
    }
}

.pop_div {
    color: #f5f5f6;
    width: 260px;
    height: 82px;
    right: 0px;
    top: -82px;
    box-sizing: border-box;
    position: absolute;
    padding: 15px 30px;
    -webkit-animation: bounce-down 0.5s ease;
    animation: bounce-down 0.5s ease;
    background: url('@{images}/chrome.png') no-repeat, -ms-linear-gradient(top, #10b3fb 0%, #398cef 100%);
    background: url('@{images}/chrome.png') no-repeat, -webkit-linear-gradient(top, #10b3fb 0%, #398cef 100%);
}
.pop_div a.downsrc {
    color: #f5f5f6;
    display: inline-block;
    text-decoration: none;
    margin-right: 10px;
    margin-top: 12px;
    line-height: 18px;
}
.pop_div a.downsrc:hover {
    text-decoration: underline;
}
.icon-download:before {
    padding-right: 5px;
}

a.close {
    &:after {
        color: #f5f5f6;
    }
    &:hover:after {
        color: #fff;
    }
}

.login-box {
    width: 100%;
    height: 400px;
    position: absolute;
    left: 0;
    top: 50%;
    margin-top: -200px;
    font-size: 14px;
    background: url('@{images}/login-box.png') repeat;
}

.logo {
    position: absolute;
    left: 0px;
    top: -80px;
}

.login-bottom {
    background: url('@{images}/bottom.png') no-repeat;
    background-size: 1260px 271px;
    height: 271px;
    width: 1260px;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: @panel-index;
}

.logo h3 {
    font-size: 30px;
    font-weight: 700;
    color: @main-color;
    letter-spacing: 1px;
}

.logo h3 small {
    font-size: @font-big;
    font-weight: 400;
}

.login-table {
    width: 1000px;
    margin: auto;
    height: 400px;
    position: relative;
}

.login-left-box {
    background: url('@{images}/left.png') no-repeat;
    float: left;
    height: 400px;
    width: 1000px;
    padding-top: 78px;
}

.login-ban {
    height: 90px;
    overflow: hidden;
    position: relative;
    -webkit-transition: all 0.3s;
    -moz-transition: all 0.3s;
    -o-transition: all 0.3s;
    -ms-transition: all 0.3s;
    transition: all 0.3s;
}

.login-ban:before,
.login-ban:after {
    content: '';
    width: 596px;
    height: 5px;
    display: inline-block;
    background: url('@{images}/ban.png') no-repeat;
    position: absolute;
    z-index: @panel-index;
}

.login-ban:before {
    left: 10px;
    top: 0px;
}

.login-ban:after {
    right: 160px;
    bottom: 0px;
}

.login-ban h1 {
    color: #fff;
    float: left;
    font-size: 50px;
    margin: 0px;
    padding: 0;
    margin-left: 40px;
    margin-top: 10px;
    opacity: 1;
}

.login-ban h1:first-child {
    margin-left: 94px;
}

td {
    text-align: left;
}

.login-right-box {
    height: 330px;
    width: 360px;
    position: absolute;
    right: 0px;
    top: 88px;
    z-index: @panel-index;
}

.login-btn {
    border: none;
    outline: none;
    display: block;
    background: @eye-color;
    color: #fff;
    width: 140px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    cursor: pointer;
    margin-bottom: 13px;
}
.input {
    width: 340px;
    height: 50px;
    line-height: 50px;
    background: #fff;
    color: #ccc;
    padding-left: 10px;
    margin-bottom: 20px;
}
.input input {
    margin-left: 10px;
    height: 40px;
    background-color: none;
    background: none;
    border: none;
    outline: medium;
    width: 278px;
}
input {
    font-family: 'Microsoft Yahei';
}

.footer {
    position: absolute;
    width: 105%;
    left: 0px;
    bottom: -45px;
    color: #5c6168;
}
.footer span {
    margin: 0 10px;
}

.tips {
    margin-top: 10px;
    color: #3c6d99;
    i {
        display: inline-block;
        width: 12px;
        height: 12px;
        background: url('../assets/img/login/tip.png') no-repeat;
        padding-right: 5px;
    }
}

.message {
    color: #d65601;
}
</style>
