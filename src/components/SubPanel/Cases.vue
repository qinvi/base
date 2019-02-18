<template>
    <div :class="[ 'cases', status ? 'big' : '' ]" ref="caseBox">
        <a :class="[ status ? 'cases-big' : 'cases-small' ]" @click="status = !status"></a>
        <a class="close" @click="close"></a>
        <div class="title-w" ref="title-w">
            <div :title="data.name">{{ data.name }}</div>
            <span class="time">{{ data.time }}</span>
            <span class="source">{{ data.source }}</span>
        </div>
        <div class="cases-box">
            <div v-html="data.content"></div>
        </div>
    </div>
</template>

<script>
import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default {
    name: 'Cases',
    props: [ 'data' ],
    data() {
        return {
            status: false
        };
    },
    methods: {
        close() {
            this.$emit('close');
        }
    },
    mounted() {
        /* eslint-disable no-new */
        WD.init(this.$refs['title-w'], this.$refs['caseBox'], lmap.map);
        new PS('.cases-box');
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.cases {
    position: fixed;
    height: 480px;
    width: 800px;
    overflow: hidden;
    top: calc(~'50% - 400px');
    left: calc(~'50% - 240px');
    // transform: translate(-50%, -50%);
    background: #fff;
    z-index: @panel-index;
    text-align: left;
    box-shadow: @shadow;

    &.noTranslate {
        transform: translate(0%, 0%);
    }

    &.big {
        width: 1000px;
    }

    .cases-small {
        position: absolute;
        top: 3px;
        right: 16px;
        height: 20px;
        width: 20px;
        display: inline-block;
        zoom: 1;
        cursor: pointer;
        &::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            margin-top: 5px;
            border: 1px solid #bbb;
        }
    }
    .cases-big {
        position: absolute;
        top: 3px;
        right: 16px;
        height: 20px;
        width: 20px;
        display: inline-block;
        zoom: 1;
        cursor: pointer;
        &::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 1px;
            margin-top: 2px;
            background: #bbb;
            vertical-align: middle;
        }
    }
    .title-w {
        cursor: move;
        padding-left: 6px;
        padding-bottom: 6px;
        border-bottom: 1px solid #bbb;
    }
    .title-w > div {
        height: 26px;
        line-height: 26px;
        width: 750px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 24px;
        margin-top: 5px;
        margin-bottom: 4px;
        color: @select-font-color;
    }
    .title-w > span {
        margin-right: 10px;
        font-size: @font-normal;
    }
    .cases-box {
        position: relative;
        height: 400px;
        overflow-y: auto;
        background: #fff;
        padding: 10px;
    }
}
</style>
