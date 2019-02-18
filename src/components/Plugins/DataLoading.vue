<template>
    <div class="dataLoaded">
        <!-- 数据加载动画 -->
        <div class="sk-wave" v-show="loadStatus" @mousedown.stop>
            <div class="sk-rect sk-rect1"></div>
            <div class="sk-rect sk-rect2"></div>
            <div class="sk-rect sk-rect3"></div>
            <div class="sk-rect sk-rect4"></div>
            <div class="sk-rect sk-rect5"></div>
        </div>
        <div :style ="noDataStyle" v-show="!loadStatus && noDataStatus">暂无数据</div>
    </div>

</template>

<script>
    export default {
        props: ['loadStatus', 'noDataStatus', 'noDataStyle']
    }
</script>

<style lang="less" scoped>
    .dataLoaded{
        text-align: center;
        .sk-wave{
            margin: 10px auto;
            width: 50px;
            height: 40px;
            text-align: center;
            font-size: 10px;
        }
        .sk-wave{
            .sk-rect{
                background-color: #888;
                height: 100%;
                width: 6px;
                display: inline-block;
                -webkit-animation: sk-waveStretchDelay 1.2s infinite ease-in-out;
                animation: sk-waveStretchDelay 1.2s infinite ease-in-out;
            }

            .sk-rect1{
                -webkit-animation-delay: -1.2s;
                animation-delay: -1.2s;
            }

            .sk-rect2{
                -webkit-animation-delay: -1.1s;
                animation-delay: -1.1s;
            }

            .sk-rect3{
                -webkit-animation-delay: -1s;
                animation-delay: -1s;
            }

            .sk-rect4{
                -webkit-animation-delay: -0.9s;
                animation-delay: -0.9s;
            }

            .sk-rect5{
                -webkit-animation-delay: -0.8s;
                animation-delay: -0.8s;
            }
        }
    }

        @-webkit-keyframes sk-waveStretchDelay {
            0%, 40%, 100% {
                -webkit-transform: scaleY(0.4);
                transform: scaleY(0.4);
            }
            20%{
                -webkit-transform: scaleY(1);
                transform: scaleY(1);
            }
        }

        @keyframes sk-waveStretchDelay {
            0%, 40%, 100% {
                -webkit-transform: scaleY(0.4);
                transform: scaleY(0.4);
            }
            20% {
                -webkit-transform: scaleY(1);
                transform: scaleY(1);
            }
        }
</style>