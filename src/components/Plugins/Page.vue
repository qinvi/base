<template>
    <div class="page-box">
        <ul class="page-control">
            <li>第{{ page.curr || 0 }}页/共{{ page.sum || 0 }}页 {{ page.length || 0 }}条记录</li>
            <li class="btn next" @click="toPage(1)">下一页</li>
            <li class="btn prev" @click="toPage(-1)">上一页</li>
        </ul>
    </div>
</template>

<script>
export default {
    name: 'Page',
    props: [ 'page' ],
    methods: {
        /**
         * 数据分页
         * @param {number} num 1 => 下一页 / -1 => 上一页
         */
        toPage(num) {
            const temp = Object.assign({}, this.page);
            let curr = temp.curr;
            curr += num;
            curr = curr <= 0 ? 1 : curr;
            curr = curr >= temp.sum ? temp.sum : curr;
            temp.curr = curr;
            this.$emit('toPage', utils.calcPage(temp));
        }
    },
    mounted() {
        this.toPage(0);
    },
    destroyed() {}
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.page-control {
    text-align: left;
    margin-left: 4px;
    .height(36px);
    li {
        .height(24px);
        display: inline-block;
        margin-right: 8px;
        margin-left: 4px;
        &.next, &.prev {
            float: right;
            position: relative;
            top: 6px;
            right: 4px;
        }
    }
}

.big .page-control {
    .height(44px);
}
</style>
