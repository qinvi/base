<template>
    <div class="sys-tip" v-show="status">
        <!-- <a href="#" class="close"></a> -->
        <div :class="[ 'tip-type', typeLogo, typePosition ]"></div>
        <div class="tip-text">{{ text }}</div>
        <div class="btn-position" v-if="type === 'confirm'">
            <label class="btn cancel" @click="cancel">取消</label>
            <label class="btn confirm" @click="confirm">确认</label>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'SysTip',
    data() {
        return {
            clsMap: {
                loading: 'loading',
                confirm: 'info',
                info: 'info',
                success: 'success',
                warn: 'warning',
                error: 'error'
            }
        };
    },
    computed: {
        ...mapState({
            status: state => state.sysTip.status,
            type: state => {
                return state.sysTip.type || 'loading'
            },
            text: state => {
                return state.sysTip.text || '加载中...'
            },
            call: state => state.sysTip.call,
            timeout: state => state.sysTip.timeout
        }),
        typeLogo() {
            return 'icon-sysTip-' + this.clsMap[this.type];
        },
        typePosition() {
            return this.type === 'confirm' ? '' : 'margin-double';
        },
        isLive() {
            return !this.liveMap[this.type];
        }
    },

    watch: {
        close() {
            this.cancel();
        },

        type() {
            utils.clearTimer(this.timer);
            if (this.isLive) {
                this.timer = window.setTimeout(() => {
                    this.cancel();
                }, isNaN(this.timeout) ? 2000 : this.timeout)
            }
        },

        status(status) {
            utils.clearTimer(this.timer)
            if (status && this.isLive) {
                this.timer = window.setTimeout(() => {
                    this.cancel();
                }, isNaN(this.timeout) ? 2000 : this.timeout)
            }
        }

    },

    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.liveMap = { confirm: true, loading: true };
        },

        confirm() {
            if (!!this.call) this.call();
        },

        cancel() {
            this.updateParam([ 'sysTip', { status: false, type: null, text: null, call: null, timeout: undefined } ]);
        }
    },

    mounted() {
        this.initConstData();
    },

    destroyed() {
        this.cancel();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.sys-tip {
    position: fixed;
    top: calc(~'50% - 50px');
    left: calc(~'50% - 122px');
    width: 244px;
    height: 100px;
    background: rgba(255, 255, 255, 0.9);
    z-index: @pop-index + 1000;
    box-shadow: @shadow;
    border-radius: 4px;
    // padding: 0 2em;
    .tip-type {
        font-size: 30px;
        text-align: center;
        margin-top: 6px;
        margin-bottom: 8px;
    }
    .tip-text {
        text-align: center;
    }
    .btn-position {
        text-align: center;
        margin: 8px;
        label {
            margin: 0 4px;
            // &.confirm {
            //     background: @select-font-color;
            //     color: #fff;
            // }
        }
    }
    .margin-double {
        margin-top: 20px;
        margin-bottom: 14px;
    }
    .icon-sysTip-loading {
        margin: 0 auto;
        margin-top: 20px;
        margin-bottom: 14px;
        background-position: center;
        animation: endless-rotation 1.2s infinite linear;
        @keyframes endless-rotation {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
    }
}
.big .sys-tip {
    top: calc(~'50% - 64px');
    left: calc(~'50% - 147px');
    width: 294px;
    height: 128px;
    .tip-type {
        font-size: 42px;
    }
}
</style>
