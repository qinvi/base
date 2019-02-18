<template>
    <div class="suggestion" ref="suggestion-panel">
        <div class="title" ref="suggestion-title">
            <span>意见反馈</span>
            <a class="close" @click="close"></a>
        </div>
        <div class="main">
            <div class="info">
                <p>感谢您使用{{ areaName }}应急指挥决策辅助系统！请告诉我们您对本站的意见和建议，我们会参考您的反馈不断优化我们的产品和服务。</p>
                <p><span>值班电话：18818401760</span><span>QQ800：2853098227</span></p>
            </div>
            <div id="editor-tool" class="editor-tool"></div>
            <div id="editor-content" class="editor-content"></div>
            <div class="right">
                <div class="btn clear" @click="clear('main')">清空</div>
                <div class="btn" @click="save('main')">提交</div>
            </div>
        </div>
        <div class="reply" id="reply">
            <div>
                <div class="title">历史意见：<a @click="getList">{{ user.text }}</a></div>
                <ul class="q-content">
                    <li v-for="(itemQ, indexQ) of list" :key="indexQ">
                        <div>
                            <label>{{ itemQ.fromUser }}</label>
                            ：<span v-html="itemQ.content"></span>
                        </div>
                        <div class="bottom-right">
                            <span class="time">日期：{{ itemQ.time }}</span>
                            <a @click="reply(itemQ)">回复</a>
                        </div>
                        <div v-if="itemQ.status">
                            <div :id="`editor-tool-${itemQ.id}`" class="editor-tool"></div>
                            <div :id="`editor-content-${itemQ.id}`" class="editor-content"></div>
                            <div class="right"><div class="btn clear" @click="clear('reply')">清空</div><div class="btn" @click="save('reply', itemQ, itemQ)">提交</div></div>
                        </div>
                        <div class="q-reply">
                            <ul>
                                <li v-for="(itemR, indexR) of itemQ.reply" :key="indexR">
                                    <div class="r-content">
                                        <label>{{ itemR.fromUser }}</label>
                                         回复
                                        <label>{{ itemR.toUser }}</label>
                                        ：
                                        <span v-html="itemR.content"></span>
                                    </div>
                                    <div class="bottom-right">
                                        <span class="time">日期：{{ itemR.time }}</span>
                                        <a @click="reply(itemR)">回复</a>
                                    </div>
                                    <div v-if="itemR.status">
                                        <div :id="`editor-tool-${itemR.id}`" class="editor-tool"></div>
                                        <div :id="`editor-content-${itemR.id}`" class="editor-content"></div>
                                        <div class="right"><div class="btn clear" @click="clear('reply')">清空</div><div class="btn" @click="save('reply', itemQ, itemR)">提交</div></div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import WE from 'wangeditor';
import IScroll from 'iscroll';

export default {
    name: 'Suggestion',
    data() {
        return {
            user: { me: false, name: '', text: '只看本市县' },
            list: [],
            focusBlur: false
        };
    },
    computed: {
        ...mapState({
            areaName: state => state.sys.areaName,
            code: state => state.sys.code,
            bigScreen: state => state.toolsBar.bigScreen
        }),
        textt() {
            const editor = this.editors['main'];
            return editor.txt.html();
        }
    },
    watch: {
        code() {
            this.getList('refresh');
        },
        areaName() {
            this.user.name = this.areaName === '广东省' ? '省局' : this.areaName;
        },
        list() {
            window.setTimeout(() => {
                this.setScroll();
            }, 1000);
        },
        bigScreen() {
            this.setScroll();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.editors = { main: null, reply: null };
            this.urls = {
                list: sysconfig.TESTPATH + '/track/getMsg',
                save: sysconfig.TESTPATH + '/track/sendMsg'
            };
            this.user.name = this.areaName === '广东省' ? '省局' : this.areaName;
        },

        /**
         * 初始化富文本编辑器
         * @param {string} type 提问、回复
         * @param {string} toolId 初始化富文本工具栏ID
         * @param {string} contentId 初始化富文本内容框ID
         */
        init(type, toolId, contentId) {
            const editor = new WE(toolId, contentId);
            editor.customConfig.uploadImgShowBase64 = true;
            editor.customConfig.menus = [ 'head', 'bold', 'italic', 'underline', 'strikeThrough', 'foreColor', 'backColor', 'image' ];
            editor.create();
            this.editors[type] = editor;
            if (!!this.last) {
                this.last.status = false;
                this.last = null;
            }
            utils.selectElem('#editor-content').children[0].onfocus = () => {
                this.focusBlur = true;
                if (!!this.last) {
                    this.last.status = false;
                    this.last = null;
                }
            }
        },

        /**
         * 清空内容文本
         * @param {string} type 提问、回复
         */
        clear(type) {
            const editor = this.editors[type];
            editor.txt.clear();
        },

        /**
         * 保存提问、回复
         * @param {string} type 提问、回复
         * @param {object} item 回复对象相关信息
         * @param {object} itemR 回复对象相关信息
         */
        save(type, item, itemR) {
            const editor = this.editors[type];
            if (editor.txt.html() !== '<p><br></p>') {
                const param = {
                    code: this.code,
                    pid: type === 'main' ? 0 : item.id,
                    toUser: encodeURIComponent(type === 'main' ? '' : itemR.fromUser),
                    fromUser: encodeURIComponent(this.user.name + '用户'),
                    content: encodeURIComponent(editor.txt.html())
                };
                utils.post(this.urls.save, param).then((json) => {
                    if (type === 'reply') item.status = false;
                    this.getList('refresh');
                    this.clear(type);
                });
            }
        },

        /**
         * 获取提问内容
         * @param {string} type 用于判断是否刷新列表
         */
        getList(type) {
            let status = false;
            if (type === 'refresh') {
                status = this.user.me;
            } else {
                status = this.user.me = !this.user.me;
                this.user.text = status ? '返回' : '只看本市县';
            }
            const fromUser = this.user.name;
            const param = status ? { fromUser, code: this.code } : {};
            utils.get(this.urls.list, param).then((json) => {
                const data = json.data.resp.map(function(element) {
                    element.status = false;
                    element.reply = element.reply.map(function(reply) {
                        reply.status = false;
                        return reply;
                    })
                    element.reply.reverse();
                    return element;
                }, this);
                this.list = data;
            });
        },

        /**
         * 初始化回复组件
         * @param {object} item 判断是否初始化
         */
        reply(item) {
            const status = item.status = !item.status;
            if (status) {
                window.setTimeout(() => {
                    this.init('reply', '#editor-tool-' + item.id, '#editor-content-' + item.id);
                    this.setScroll();
                    this.last = item;
                }, 1);
            } else {
                this.editors['reply'] = null;
                this.last = null;
                this.setScroll();
            }

        },

        /**
         * 关闭组件
         */
        close() {
            this.updateParam([ 'toolsBar', { suggestion: false } ]);
        },

        setScroll() {
            this.$nextTick(() => {
                if (this.scrollId) {
                    this.scrollId.refresh();
                } else {
                    /* eslint-disable */
                    this.scrollId = new IScroll('#reply', {
                        // disablePointer: true,
                        scrollbars: 'custom',
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        click: false
                    });
                }
                // const reply = utils.selectElem('#reply');
                // reply.children[1].children[0].style.height = '30px';
            })
        }

    },
    mounted() {
        this.initConstData();
        this.init('main', '#editor-tool', '#editor-content');
        WD.init(this.$refs['suggestion-title'], this.$refs['suggestion-panel'], lmap.map);
        this.getList('refresh');
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
[contentEditable=true]:empty:not(:focus):before{
    content:attr(data-placeholder)
}
.suggestion {
    width: 800px;
    position: fixed;
    top: calc(~'50% - 279px');
    left: calc(~'50% - 400px');
    background: #FFF;
    z-index: @pop-index;
    box-shadow: @shadow;
    text-align: left;

    .editor-tool {
        background: #fff;
        width: 100%;
        border: 1px solid #e6e5e5;
    }
    .editor-content {
        background: #fff;
        width: 100%;
        border: 1px solid #e6e5e5;
        border-top: 0;
        height: 100px;
        margin-bottom: 6px;
    }
    .right {
        text-align: right;
        .clear {
            margin-right: 10px;
            // margin-bottom: 10px;
        }
    }
    .main {
        padding: 10px;
        width: 100%;
        box-sizing: border-box;
        .info {
            span {
                display: inline-block;
                &:nth-child(2) {
                    margin-left: 40px;
                }
            }
        }
    }
    .reply {
        position: relative;
        padding: 10px;
        padding-top: 0;
        margin-bottom: 10px;
        width: 100%;
        height: 300px;
        overflow: hidden;
        box-sizing: border-box;
        .title {
            .height();
            border-bottom: 1px solid #e6e5e5;
            a {
                cursor: pointer;
            }
        }
        .q-content {
            &>li {
                background: @title-color;
                padding: 12px 20px 0px 20px;
                margin-bottom: 20px;
            }
            label {
                color: @select-font-color;
            }
            .bottom-right {
                text-align: right;
                line-height: 30px;
                margin-top: 20px;
                .time {
                    margin-right: 10px;
                }
            }
            .q-reply {
                li {
                    border-top: 1px solid #fff;
                    padding: 12px 16px 6px 16px;
                }
            }
        }
    }
}
p {
    margin: 0;
    word-wrap: break-word;
}
.big {
    .suggestion {
        // top: 80px;

        .reply {
            height: 345px;

            .title {
                .height-big();
            }
        }
        .btn {
            .height-big();
        }
    }
}
</style>
