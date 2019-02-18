<template>
    <div>
        <ul>
            <li></li>
        </ul>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Legend',
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
</style>
