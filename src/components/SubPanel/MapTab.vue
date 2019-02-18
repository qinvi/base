<template>
    <div class="map-type hover">
        <a v-for="key in maps" :key="key" :class="['map-item', key, { 'map-active': key === select }]" @click="switchMap(key)"></a>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
    data() {
        return {
            select: 'dh',
            maps: ['wx', 'dx', 'dt', 'dh'] // wx: '卫星图'， dx: '地形图', dt: '业务图(原)', dh: '业务图'
        }
    },
    computed: {
        ...mapState({
            mapType: state => state.mapType
        })
    },
    watch: {
        mapType(code) {
            this.switchMap(code);
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 切换地图
         * @param {string} item 地图类型
         */
        switchMap(code) {
            if (this.select !== code) {
                this.select = code;
                lmap.switchMap(code);
                this.updateParam([{ mapType: code }]);
            }
        }
    },
    mounted() {
        this.select = this.mapType;
    }
}
</script>

<style scoped lang='less'>
@import "../../assets/css/common.less";
.map-type {
    position: absolute;
    right: 0;
    top: @title-height;
    z-index: @panel-index;
    display: flex;
    padding: 7px;
    width: 368px;
    background: #fff;
    box-shadow: @shadow;

    .map-item {
        position: relative;
        flex: 1 0 0;
        margin: 0 4px;
        height: 58px;
        cursor: pointer;
        background: url(../../assets/img/toolsbar/map-type.png) no-repeat;
        background-size: 100%;

        &::before {
            position: absolute;
            right: 0;
            bottom: 0;
            padding: 2px 4px;
            color: #fff;
            .height();
        }

        &.dh {
            background-position: 0 -118px;
            &::before {
                color: #414141;
                content: '业务图';
            }
        }

        &.wx {
            background-position: 0 -176px;
            &::before { content: '卫星图' }
        }

        &.dx{
            background-position: 0 -58px;
            &::before { content: '地形图' }
        }

        &.dt {
            background-position: 0 0;
            background-size: 100% 400%;
            &::before { content: '业务图(原)' }
        }

        &.map-active {
            outline: 2px solid #188eee;
            &::before {
                color: #fff;
                background: #3385ff;
            }
        }

        &:hover::before {
            color: #fff;
            background: #3385ff;
        }
    }
}

/*big*/
.big {
    .map-type {
        top: @title-height-big;
        width: 640px;

        .map-item {
            width: 150px;
            height: 90px;
            background-size: 100%;

            &::before {
                .height-big();
            }

            &.dh {
                background-position: 0 -220px;
            }
            &.wx {
                background-position: 0 -320px;
            }

            &.dx {
                background-position: 0 -120px;
            }

            &.dt {
                background-position: 0 0;
            }
        }
    }
}
</style>
