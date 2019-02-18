<template>
    <div class="history-cases">
        <v-history-case-list v-if="!model.status" :model="model" @caseModel="caseModel"></v-history-case-list>
        <v-history-case-play v-if="model.status" :model="model" @caseModel="caseModel"></v-history-case-play>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import List from './HistoryCaseList';
import Play from './HistoryCasePlay';

export default {
    name: 'History-Case-Main',

    components: {
        'v-history-case-list': List,
        'v-history-case-play': Play
    },

    data() {
        return {
            model: { new: false, status: false, id: null }
        };
    },

    computed: {
        ...mapState({
            code: state => state.sys.code,
            mapType: state => state.mapType,
            sysMinTime: state => state.time.sysMinTime
        })
    },

    watch: {
        'model.status'() {
            this.updateParam([ 'historyCase', { play: this.model.status } ]);
        }
    },

    methods: {
        ...mapActions(['updateParam']),
        caseModel(param) {
            const commands = Object.keys(param);
            for (const command of commands) {
                this.model[command] = param[command];
            }
        }
    },

    mounted: function() {

    },

    destroyed: function() {
        this.updateParam([ 'historyCase', { play: false } ]);
    }

};
</script>

<style scoped lang='less'>
@import '../../../assets/css/common.less';

.history-cases {
    position: fixed;
    top: @top-normal;
    right: -4px;
    z-index: @pop-index + 100;
    box-shadow: @shadow;
    background: #fff;
}

.big {
    .history-cases {
        top: @top-big;
    }
}

</style>
