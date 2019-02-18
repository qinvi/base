<template>
    <div class="tag" ref="tag-panel" :style="computedWidth">
        <div class="drag" ref="tag-title"></div>
        <div class="box">
            <div class="text" :style="param">{{ msg }}</div>
            <input type="text" placeholder="请输入主题" v-model="msg"  @click="(status = true)" :style="param">
        </div>
        <div class="tools" v-show="status">
            <ul class="clearfix">
                <li>
                    <a class="font-color-box" @click="(cp =! cp)" :style="{ backgroundColor: param.color }"></a>
                    <ul class="color-selectbox" v-show="cp">
						<li v-for="(color, key) in colors" :key="key" :style="{ background: color }" @click="(param.color = color, cp = false)"></li>
					</ul>
                </li>
                <li>
                    <span class="font"></span>
                    <div class="font-select">
                        <v-dropdown :list="fonts.data" :tip="fonts.tip" class="dropdown-tag" @select="(param) => { this.param.fontSize = param.value }"></v-dropdown>
                    </div>
                </li>
                <li><a class="btn-tools delete" title="删除" @click="(msg = '')"></a></li>
                <li><a class="btn-tools closed" title="关闭" @click="close"></a></li>
                <li><a class="btn-tools complete" @click="(status = false)"><label>完成</label></a></li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Dropdown from '../Plugins/Dropdown';

export default {
    name: 'Tag',
    components: {
        'v-dropdown': Dropdown
    },
    computed: {
        ...mapState({
            bigScreen: state => state.toolsBar.bigScreen
        }),
        computedWidth() {
            let clientWidth = document.documentElement.clientWidth;
            let length = this.msg.length * this.param.fontSize.substring(0, this.param.fontSize.length - 2);
            let defaultwidth = this.bigScreen ? 440 : 360;
            let left = (clientWidth - defaultwidth) / 2;
            if (length < defaultwidth) {
                return 'width:' + defaultwidth + 'px;left:' + left + 'px';
            } else if (length > defaultwidth && length < clientWidth) {
                left = (clientWidth - length) / 2;
                return 'width:' + length + 'px;left:' + left + 'px';
            } else {
                left = (clientWidth - clientWidth) / 2;
                return 'width:' + clientWidth + 'px;left:' + left + 'px';
            }
        }
    },
    data() {
        return {
            colors: [ '#000000', '#6F706B', '#6F180E', '#F28837', '#266D28', '#0E37B8', '#6D0B62', '#13807F', '#FFFFFF', '#B3B5AE', '#ED3F2B', '#EBDE37', '#96C130', '#0A78C8', '#D523C8', '#1AC1CA' ],
            fonts: {
                data: [
                    { text: '12px', value: '12px' },
                    { text: '13px', value: '13px' },
                    { text: '14px', value: '14px' },
                    { text: '16px', value: '16px' },
                    { text: '18px', value: '18px' },
                    { text: '24px', value: '24px' },
                    { text: '32px', value: '32px' },
                    { text: '36px', value: '36px' },
                    { text: '42px', value: '42px' },
                    { text: '48px', value: '48px' },
                    { text: '60px', value: '60px' },
                    { text: '72px', value: '72px' }
                ],
                tip: '42px'
            },
            msg: '',
            cp: false,
            status: false,
            param: { fontSize: '42px', color: '#ED3F2B' }
        };
    },
    methods: {
        ...mapActions(['updateParam']),
        close() {
            this.updateParam([ 'toolsBar', { tag: false } ]);
        }
    },
    mounted() {
        WD.init(this.$refs['tag-title'], this.$refs['tag-panel'], lmap.map);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.tag {
    position: fixed;
    width: 360px;
    top: @top-normal;
    height: auto;
    z-index: @pop-index;
    background: #fff;
    box-shadow: 0 2px 9px 0 rgba(0, 0, 0, 0.3);
    padding: 5px 0;

    .drag {
        width: 16px;
        height: 16px;
        position: absolute;
        right: 2px;
        top: 2px;
        cursor: move;
        background: url("../../assets/img/common/drag.png") no-repeat center;
    }

    .box {
        margin: 0 5px;
        height: 100%;
        box-sizing: border-box;
        .text {
            position: absolute;
            white-space: nowrap;
            overflow: hidden;
            height: 0;
        }
        input {
            min-width: 348px;
            padding: 15px 0;
            width: 100%;
            height: auto;
            border: 0;
            font-size: 48px;
            color: #ed3f2b;
            text-align: center;
            cursor: pointer;
            background: 0;
            font-family: "Microsoft Yahei";
            list-style-type: none;
            -webkit-text-size-adjust: none;
            outline: 0;
        }
    }

    .tools {
        position: absolute;
        background: #fff;
        box-shadow: 0 2px 9px 0 rgba(0, 0, 0, 0.3);
        right: 0;
        border-bottom: 5px;
        padding: 4px 0;
        width: 260px;
        bottom: -37px;

        li {
            float: left;
            cursor: default;
            line-height: 28px;
            .color-selectbox {
                position: absolute;
                background: #F7F7F7;
                box-shadow: 0 2px 9px 0 rgba(0, 0, 0, 0.3);
                top: 32px;
                padding: 3px;
                width: 120px;
                li {
                    width: 13px;
                    height: 13px;
                    background: #000;
                    border: 1px solid #F7F7F7;
                    cursor: pointer;
                }
            }
            .font {
                background: url("../../assets/img/common/A.png") no-repeat center center;
                width: 25px;
                height: 22px;
                vertical-align: middle;
                margin-right: 3px;
                float: left;
            }
            .font-color-box {
                width: 22px;
                height: 22px;
                border: 1px solid #ddd;
                background: #ff0000;
                display: block;
                margin: 0 5px;
                cursor: pointer;
            }
            .font-select {
                width: 60px;
                float: left;
                margin-right: 10px;
                .div-select {
                    width: 68px;
                }
            }
            .btn-tools {
                display: block;
                vertical-align: middle;
                width: 22px;
                height: 22px;
                margin-left: 5px;
                border: 1px solid #eee;
                cursor: pointer;

                &.delete {
                    margin-top: 2px;
                    background: url("../../assets/img/econtrol/delete.png") no-repeat center center/cover;
                }

                &.closed {
                    margin-top: 2px;
                    background: url("../../assets/img/econtrol/close.png") no-repeat center center/cover;
                }

                &.complete {
                    width: 34px;
                    .height();
                    padding-left: 19px;
                    border: 1px solid #D6D6D6;
                    position: relative;
                    margin-left: 5px;
                    cursor: pointer;
                    background: linear-gradient(#FEFEFE, #EEEEEE);
                    &>label {
                        margin-left: 5px;
                    }
                    &:before {
                        content: "";
                        display: inline-block;
                        position: absolute;
                        top: 9px;
                        left: 6px;
                        background: #666F7D;
                        width: 2px;
                        height: 9px;
                        transform: rotate(-45deg);
                    }
                    &:after {
                        content: "";
                        display: inline-block;
                        position: absolute;
                        top: 4px;
                        left: 14px;
                        background: #666F7D;
                        width: 2px;
                        height: 14px;
                        transform: rotate(45deg);
                    }
                }
            }
        }
    }
}

:-moz-placeholder {
	color: #ed3f2b;
}

::-moz-placeholder {
	color: #ed3f2b;
}

input:-ms-input-placeholder, textarea:-ms-input-placeholder {
	color: #ed3f2b;
}

input::-webkit-input-placeholder, textarea::-webkit-input-placeholder {
	color: #ed3f2b;
}

.big .tag {
    top: 45px;
    width: 440px;

    .tools {
        bottom: -46px;
        width: 352px;

        .btn-tools {
            width: 36px;
            .height-big();

            &.complete {
                width: 80px;
                .height-big();
                box-sizing: border-box;

                &::before {
                    top: 17px;
                }

                &::after {
                    top: 14px;
                }
            }
        }

        li {
            .font-color-box {
                width: 36px;
                height: 36px;
            }

            span {
                width: 30px;
                height: 36px;
                line-height: 36px;
                background-position: 4px 10px;
            }

            .font-select {
                width: 86px;
            }

            .color-selectbox {
                top: 46px;
                width: 200px;

                li {
                    width: 22px;
                    height: 22px;
                }
            }
        }
    }
}

</style>
