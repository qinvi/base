<!-- 全局警告提示 -->
<!--
    使用: 通过vuex引入alerts状态 在需要的地方通过push 修改需要显示的警告弹窗
    this.alerts.push({ type: 'error', message: '获取数据失败，请稍后重试' });
-->
<template>
    <div class="global-alerts">
        <div v-for="item in alerts" :class="[ 'alerts-item', 'alert-' + item.type ]">
            {{ item.message }}
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
    data() {
        return {
            timeId: null
        };
    },
    computed: {
        ...mapState({
            alerts: state => state.globalAlerts.alerts
        }),
        alertsLength() {
            return this.alerts.length;
        }
    },
    watch: {
        alertsLength(val, prevVal) {
            if (val > prevVal) {
                let timeId = setTimeout(() => {
                    if (timeId === this.timeId) {
                        this.updateParam(['globalAlerts', { alerts: [] }]);
                    }
                }, 5000);

                this.timeId = timeId;
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        demos() {
            let index = 1;
            let timeInterval = window.setInterval(() => {
                index++;
                this.alerts.push({ type: 'error', message: '获取数据失败，请稍后重试' + index });
                if (index === 5) {
                    clearInterval(timeInterval);
                }
            }, 1000);
        }
    },
    mounted() {
        // this.demos();
    }
};
</script>

<style lang="less" scoped>
@import '../../assets/css/common.less';
.global-alerts {
    position: fixed;
    top: 110px;
    left: 0;
    z-index: @panel-index;

    .alerts-item {
        position: relative;
        left: -100%;
        width: 280px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 4px;
        margin-bottom: 4px;
        background: #fff;
        padding: 8px 10px;
        font-size: 16px;
        box-sizing: border-box;
        animation: alert-in 5s;
    }

    .alert-error {
        background-image: linear-gradient(to bottom, #f2dede 0, #e7c3c3 100%);
        border-color: #dca7a7;
        color: #a94442;
        background-color: #f2dede;
    }

    .alert-warning {
        background-image: linear-gradient(to bottom, #fcf8e3 0, #f8efc0 100%);
        border-color: #f5e79e;
        color: #8a6d3b;
        background-color: #fcf8e3;
    }
}

@keyframes alert-in {
    0% {
        left: -100%;
    }

    20% {
        left: 0;
    }

    80% {
        left: 0;
    }
    100% {
        left: -100%;
    }
}
</style>
