<template>
    <div class="about" ref="about-panel">
        <a class="close" @click="close"></a>
        <div class="title" ref="about-title"><span>{{ areaName }}{{ name }}{{ ename }}</span></div>
        <div class="version-con">
            <div class="version-option">
                <ul>
                    <li><label>当前版本：<label title="版本日志">{{ version }}</label></label><label>值班电话：<a href="tel: 18818401760">188-1840-1760</a></label></li>
                    <li><label>技术支持：数鹏通（LinkCM）科技</label><label>企业QQ800：2853098227</label></li>
                    <!-- <li><label>视频插件下载VLC：<a href="/soft/VLC-x86.exe" class="download">VLC下载</a></label></li> -->
                    <li><label class="long-w">推荐谷歌浏览器：<a href="http://10.148.16.56/soft/ChromeSetup-32.exe" class="download">32位下载</a><a href="http://10.148.16.56/soft/ChromeSetup.exe" class="download">64位下载</a></label></li>
                </ul>
            </div>
        </div>
        <div class="version-log">
            <!-- <a class="close" @click="log.status = false"></a> -->
            <div class="title"><span>版本日志</span></div>
            <div class="logs">
                <ul>
                    <li v-for="(item, index) of log.data" :key="index" class="verison">
                        <ul>
                            <li>{{ item.time }} 发布 {{ item.version }} 版本</li>
                            <li v-for="(issue, si) of item.issues" :key="si">
                                <div>
                                    <label>{{ issue.type }}</label>
                                    <ol>
                                        <li v-for="(content, ci) of issue.data" :key="ci">{{ content }}</li>
                                    </ol>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import PS from 'perfect-scrollbar';

export default {
    name: 'About',
    data() {
        return {
            log: {
                status: true,
                data: []
            }
        }
    },
    computed: {
        ...mapState({
            name: state => state.sys.name,
            areaName: state => state.sys.areaName,
            ename: state => state.sys.ename,
            version: state => state.sys.version,
            navItemsCallback: state => state.toolsBar.navItemsCallback
        })
    },
    watch: {
        'log.status'(status) {
            if (status) {
                this.getLog();
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        close() {
            this.updateParam([ 'toolsBar', { about: false } ]);
            this.navItemsCallback('about');
        },
        getLog() {
            utils.get(sysconfig.TESTPATH + '/track/getVersionMsg').then((json) => {
                this.log.data = json.data.resp;
            });
        }
    },
    mounted() {
        WD.init(this.$refs['about-title'], this.$refs['about-panel'], lmap.map);
        this.getLog();
        /* eslint-disable no-new */
        new PS('.logs');
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.about {
    position: absolute;
    width: 400px;
    top: calc(~'50% - 275px');
    left: calc(~'50% - 200px');
    background: #fff;
    z-index: @pop-index;
    box-shadow: @shadow;
    .version-con {
        background: #fff;
        margin: 10px;
        height: auto;
        overflow: hidden;
        ul li {
            height: 26px;
            line-height: 26px;
            text-align: left;
            label {
                color: #757575;
                display: inline-block;
                &:nth-child(odd) {
                    width: 60%;
                }
                &:nth-child(even) {
                    width: 40%;
                }
                &.long-w {
                    width: 80%;
                }
                .download {
                    display: inline-block;
                    padding-left: 20px;
                    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAOCAMAAADHVLbdAAAAQlBMVEUAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz4TCVIAAAAFXRSTlMAu1qWiGk8Ht0H2X117+XDUExEMRRoCVY1AAAASUlEQVQI163ISw6AIBAE0WZAHRH/9v2v6iSEZDbsqN0r1F4W+GamQX70hujBXSO+XCCcgI1kWLEwVtswOkOMzlbXObRO80Vf+gFx/ASQ9sQr0gAAAABJRU5ErkJggg==) no-repeat 0;
                    margin-right: 20px;
                }
            }
        }
    }
}

.version-log {
    width: auto;
    background: #fff;
	text-align: left;
    .logs {
        position: relative;
        max-height: 400px;
    }
    .verison {
        border: 1px solid #bbb;
        margin: 8px;
        padding: 8px;
        ol li {
            list-style-type: decimal;
        }
    }
}

.big .about {
    width: 640px;
    top: calc(~'50% - 300px');
    left: calc(~'50% - 320px');
    .version-con {
        ul li {
            height: 36px;
            line-height: 36px;
            text-align: left;
        }
    }
}
</style>
