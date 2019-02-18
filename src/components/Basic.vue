<template>
    <div></div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Basic',
    props: [],
    components: {},
    data() {
        return {

        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime
        })
    },
    watch: {
        sysTime() {

        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {

        }
    },
    mounted() {
        this.initConstData();
    },
    destroyed() {

    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
</style>
