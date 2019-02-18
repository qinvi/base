<template>
    <div class="param-panel">
        <div class="min-rectangle" v-show="false">漫滩</div>
        <div class="min-rectangle" v-show="!!typhoonCallback" @click="typhoonCallback()">台风</div>
        <div class="min-rectangle" v-show="!!siteCallback" @click="siteCallback()">监测站</div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'Blockage',
    computed: {
        ...mapState({
            typhoonCallback: state => state.typhoon.panelCallback,
            siteCallback: state => state.site.panelCallback
        })
    }
}
</script>
<style scoped lang='less'>
@import '../../assets/css/common.less';
.param-panel {
    z-index: @panel-index - 1;

    .min-rectangle {
        height: 30px;
        margin-bottom: 5px;
        padding: 0 5px;
    }
}
</style>
