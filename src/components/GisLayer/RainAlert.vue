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
        ...mapState({})
    },
    watch: {

    },
    methods: {
        ...mapActions([ 'updateParam' ])
    },
    mounted() {

    },
    destroyed() {

    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
</style>
