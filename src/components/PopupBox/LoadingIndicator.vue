<template>
    <!-- 全局加载指示器
        新加入的项目首先进入加载等待池，在指定的时间过去后进入加载池

        @example this.pendingPool.push({ id: 'test', sleep: 2000 })
        @example this.pendingPool.push({ id: 'test' })
        @example this.updateParam(['loadingIndicator', { sigCancel: 'test' }])
    -->
    <div v-show="indicatorActive" class="loading-indicator-container">
        <div class="loading-indicator-wrapper">
            <div class="loading-indicator-image"></div>
            <!-- <div class="loading-indicator-text">数据加载中</div> -->
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
    data: function () {
        return {
            // 默认等待时间，在此时间后出现加载指示器
            defaultSleepTime: 2000,

            // 加载池，包含所有已触发加载指示器的项目
            loadingPool: [],

            // 加载等待池的大小
            pendingPoolSize: 0
        }
    },

    computed: {
        ...mapState({
            pendingPool: state => state.loadingIndicator.pendingPool,
            sigCancel: state => state.loadingIndicator.sigCancel
        }),

        indicatorActive: function () {
            return this.loadingPool.length > 0
        }
    },

    watch: {
        pendingPool: function (val, prevVal) {
            // 若往加载等待池添加了新项目时
            if (val.length > this.pendingPoolSize) {
                const lastAdded = val[val.length - 1]

                window.setTimeout(() => {
                    const index = this.pendingPool.findIndex((item) => {
                        return lastAdded.id === item.id
                    })

                    if (index >= 0) {
                        this.loadingPool.push(lastAdded)
                    }
                }, !isNaN(lastAdded.sleep) ? lastAdded.sleep : this.defaultSleepTime)

            }

            this.pendingPoolSize = val.length
        },

        sigCancel: function (val) {
            const ids = val.split(',')

            ids.forEach((id) => {
                const pendingIndex = this.pendingPool.findIndex((item) => {
                    return item.id === id
                })
                const loadingIndex = this.loadingPool.findIndex((item) => {
                    return item.id === id
                })

                if (pendingIndex >= 0) {
                    this.pendingPool.splice(pendingIndex, 1)
                }

                if (loadingIndex >= 0) {
                    this.loadingPool.splice(loadingIndex, 1)
                }
            })

            this.updateParam(['loadingIndicator', { sigCancel: '' }])
        }
    },

    methods: {
        ...mapActions(['updateParam'])
    }
}
</script>

<style lang="less" scoped>
.loading-indicator-container {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, .9);
    border-radius: 4px;
    padding: 15px 40px;

    .loading-indicator-wrapper {
        .loading-indicator-image {
            margin: 0 auto;
            width: 50px;
            height: 50px;
            background: url(../../assets/img/common/sysTip-loading.png) no-repeat;
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

        .loading-indicator-text {
            text-align: center;
            font-size: 16px;
            margin-top: 10px;
        }
    }
}
</style>
