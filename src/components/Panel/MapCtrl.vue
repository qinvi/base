<template>
    <div class="control">
        <ul>
            <li @click="zoomIn" class="zoom-in"></li>
            <li @click="reset" class="reset"></li>
            <li @click="zoomOut" class="zoom-out"></li>
        </ul>
    </div>
</template>

<script>
export default {
    methods: {
        /**
         * 地图放大1级
         */
        zoomIn: function () {
            lmap.ctrl.zoomIn(lmap.map);
        },
        /**
         * 地图缩小1级
         */
        zoomOut: function () {
            lmap.ctrl.zoomOut(lmap.map);
        },
        /**
         * 重置地图
         */
        reset: function () {
            let zoom = lmap.config.zoom;
            lmap.ctrl.panTo(lmap.map, lmap.config.center, zoom);
        }
    },
    mounted() {
    }
}
</script>

<style scoped lang='less'>
.control {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    .zoom-in {
        background-position: -55px 4px !important;
    }
    .reset {
        background-position: -28px 4px !important;
    }
    .zoom-out {
        background-position: -1px 4px !important;
    }
    ul li {
        border: 1px solid #ccc;
        margin-top: 4px;
        width: 24px;
        height: 24px;
        text-align: center;
        line-height: 24px;
        cursor: pointer;
        background: #fff url("../../assets/img/common/icon.png") no-repeat;
    }
}
</style>
