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
            maps: ['dh', 'dt1', 'wx1', 'wx', 'dx', 'dt'] // wx: '卫星图'， dx: '地形图', dt: '业务图(原)', dh: '业务图', dt1: '新业务图', wx1: '新影像图'
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
    z-index: 5011;
    display: flex;
    padding: 7px;
    width: 547px; // 368px;
    background: #fff;
    box-shadow: @shadow;

    .map-item {
        position: relative;
        // flex: 1 0 0;
        margin: 0 4px;
        width: 83px;
        height: 56px;
        cursor: pointer;
        background: url(../../assets/img/toolsbar/map-type.png) no-repeat;
        background-size: 100%;

        &::before {
            position: absolute;
            right: 0;
            bottom: 0;
            padding: 1px 4px;
            color: #fff;
            .height();
            background: rgba(51,51,51, .7)
        }

        &.dh {
            background-position: 0 -118px;
            &::before {
                content: '业务图';
            }
        }

        &.wx {
            background-position: 0 -175px;
            &::before { content: '卫星图(原)' }
        }

        &.wx1 {
            background-position: 0 -290px;
            &::before { content: '组合影像图' }
        }        

        &.dx{
            background-position: 0 -58px;
            &::before { content: '地形图(原)' }
        }

        &.dt {
            background-position: 0 0;
            &::before { content: '业务图(原)' }
        }
        &.dt1 {
            background-position: 0 -232px;
            &::before { content: '组合业务图' }
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
        width: 948px;

        .map-item {
            width: 150px;
            height: 90px;
            background-size: 100%;

            &::before {
                .height-big();
            }

            &.dh {
                background-position: 0 -225px;
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

            &.dt1 {
                background-position: 0 -418px;
            }
            &.wx1 {
                background-position: 0 -519px;
            }
        }
    }
}
</style>
