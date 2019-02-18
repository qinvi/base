<template>
    <!-- 下拉菜单 -->
    <!-- 基本宽度 100px 需要扩展的使用less语言进行添加, 可在组件引用时添加类, 通过类控制宽度 -->
    <div id='dropdown' class="dropdown" @mouseenter="handleMouse" @mouseleave="handleMouse">
        <cite data-cite="select" :title="name" :class="['dropdown-name', {'dropdown-cur': status}]" @click="showChildList">{{ name }}</cite>
        <!-- <transition name="fade"> -->
            <div data-cite="select" :id="'dropdown-' + unicul" v-show="status" class="dropdown-option" style="maxHeight: 150px">
                <ul data-cite="select" class="dropdown-list">
                    <li data-cite="select" class="dropdown-item" v-for="(item, key) in list" @click="select(item)" :title="item.text" :key="key">
                        <span class="dropdown-text">{{ item.text }}</span>
                    </li>
                </ul>
            </div>
        <!-- </transition> -->
    </div>
</template>

<script>
// import PS from 'perfect-scrollbar';
import IScroll from 'iscroll';
import util from '@/utils/linkcm-map/utils/util';
export default {
    props: ['list', 'tip', 'autoDismiss'],
    data() {
        return {
            status: false,
            name: '',
            unicul: util.getUUID(),
            scrollId: null
        };
    },
    computed: {},
    watch: {
        list() {
            this.initConstData();
        },
        tip(val) {
            this.name = val;
        },
        status(bool) {
            if (!bool) return;
            this.setScroll();
        }
    },
    methods: {
        /**
         * 初始化默认参数
         * @return {[type]} [description]
         */
        initConstData() {
            this.name = this.tip;
            const func = window.document.onclick;
            window.document.onclick = e => {
                const dom = e.target;
                if (dom.getAttribute('data-cite') !== 'select' && !dom.classList.contains('iScrollIndicator')) {
                    this.status = false;
                }
                if (!!func) func(e);
            };
            this.timers = {
                autoDismiss: null
            }
        },

        // 子菜单弹窗显示
        showChildList() {
            if (this.list.length) {
                this.status = !this.status;
            }
        },

        // 选择子菜单
        select(item) {
            this.name = item.text;
            this.$emit('select', item);
            this.hide();
        },
        // 隐藏菜单
        hide() {
            this.status = false;
        },
        setScroll() {
            let id = `#dropdown-${this.unicul}`;
            this.$nextTick(() => {
                /* eslint-disable */
                if (this.scrollId) {
                    this.scrollId.refresh();
                } else {
                    /* eslint-disable */
                    this.scrollId = new IScroll(id, {
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

        handleMouse: function (e) {
            if (this.autoDismiss) {
                if (e.type === 'mouseleave') {
                    this.timers.autoDismiss = window.setTimeout(() => {
                        this.status = false
                    }, 2000)
                } else if (e.type === 'mouseenter') {
                    window.clearTimeout(this.timers.autoDismiss)
                }
            }
        }
    },
    mounted() {
        this.initConstData();
    }
};
</script>

<style lang='less' scoped>
@import '../../assets/css/select.less';
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.dropdown {
    position: relative;
    float: left;
    text-align: left;
    width: 100px;
    .height();

    cite {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .dropdown-name {
        position: relative;
        font-style: normal;
        display: block;
        padding-right: 20px;
        padding-left: 8px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        cursor: pointer;

        &::before {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%) rotate(0deg);
            transition: transform 0.3s;
            width: 20px;
            height: 20px;
            content: '';
            display: block;
            background: url(../../assets/img/common/sarrow.png) no-repeat right center;
        }

        &.dropdown-cur {
            &::before {
                transform: translateY(-50%) rotate(180deg);
            }
        }
    }

    .dropdown-option {
        position: absolute;
        width: 100%;
        max-height: 150px;
        border-bottom: 1px solid #ccc;
        border-right: 1px solid #ccc;
        border-top: 0;
        box-sizing: border-box;
        background: #fff;
        overflow: hidden;
        // overflow-y: scroll;
        z-index: @panel-index;

        .dropdown-item {
            .height();
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-left: 1px solid #ccc;

            &:hover {
                background: #ccc;
            }

            .dropdown-text {
                display: block;
                text-indent: 8px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}

// 外部组件style控制区域
.dropdown {
    &.dropdown-decide {
        height: 26px;
        line-height: 26px;
        width: 120px;
    }

    &.dropdown-font {
        width: 70px;
        .height(30px);
    }

    &.dropdown-area {
        width: 100px;
        float: left;
        margin-right: 4px;
    }

    &.dropdown-target {
        width: 120px;
        margin-right: 4px;
    }

    &.dropdown-track {
        width: 120px;
        margin-right: 4px;
    }

    &.dropdown-site-rain {
        margin-right: 4px;
    }

    &.dropdown-plan {
        margin-right: 6px;
    }

    &.dropdown-lib {
        margin-right: 4px;
    }

    &.dropdown-pd-strength {
        width: 110px;
        text-indent: 30px;
        margin-right: 4px;
    }

    &.dropdown-pd-mean {
        margin-right: 4px;
        width: 126px;
        text-indent: 54px;
    }

    &.dropdown-pd-factory {
        width: 124px;
        margin-right: 10px;
        margin-left: 4px;
    }

    &.dropdown-pd-chemical {
        width: 124px;
    }

    &.dropdown-video-back {
        width: 160px;
    }

    &.dropdown-econtrol {
        width: 120px;
    }

    &.dropdown-tag {
        width: 70px;
    }
}
// 大屏状态下 外部组件style控制区域
.big {
    .dropdown {
        .height-big();
        .dropdown-item {
            .height-big();
        }

        // 决策服务
        &.dropdown-decide {
            width: 150px;

            .dropdown-item {
            }
        }

        &.dropdown-font {
            width: 140px;

            .dropdown-item {
            }
        }

        &.dropdown-target {
            width: 160px;
            margin-right: 8px;
        }

        &.dropdown-track {
            width: 160px;
            margin-right: 8px;

            &:nth-child(1) {
                width: 100px;
            }
        }

        &.dropdown-site-rain {
            width: 140px;
            margin-right: 8px;

            li {
                text-indent: 10px;
            }
        }

        &.dropdown-plan {
            width: 140px;
        }

        &.dropdown-lib {
            width: 140px;
            margin-right: 8px;
        }

        &.dropdown-pd-strength {
            width: 160px;
            text-indent: 50px;
            margin-right: 8px;
        }

        &.dropdown-pd-mean {
            margin-right: 8px;
            width: 190px;
            text-indent: 90px;
        }

        &.dropdown-pd-factory {
            width: 162px;
            margin-right: 14px;
            margin-left: 0;
        }

        &.dropdown-pd-chemical {
            width: 180px;
        }

        &.dropdown-video-back {
            width: 200px;
        }

        &.dropdown-econtrol {
            width: 170px;
        }

        &.dropdown-tag {
            width: 96px;
        }
    }
}
</style>
