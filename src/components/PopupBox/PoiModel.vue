<template>
    <div>
        <slot name="waterLogging">
            <ul v-if="type === 'waterLogging' && poiDetail">
                <li :title="poiDetail.fullName">地址：{{ poiDetail.fullName }}</li>
                <li :title="poiDetail.level">等级：{{ poiDetail.level }}</li>
            </ul>
        </slot>
        <slot name="fireDanger">
            <ul v-if="type === 'fireDanger' && poiDetail">
                <li :title="poiDetail.sateName">卫星名称：{{ poiDetail.sateName }}</li>
                <li :title="poiDetail.fullName">位置：{{poiDetail.fullName }}</li>
                <li :title="poiDetail.lon + ',' + poiDetail.lat">经纬度：{{ poiDetail.lon }} , {{ poiDetail.lat }}</li>
                <li :title="poiDetail.level">等级：{{ poiDetail.level }}</li>
                <li :title="poiDetail.fireConfidence">火点置信度：{{ poiDetail.fireConfidence }}</li>
                <li :title="poiDetail.bt_4">4微米亮温：{{ poiDetail.bt_4 }}</li>
               <li :title="poiDetail.bt_11">11微米亮温：{{ poiDetail.bt_11 }}</li>
               <!-- <li>详情：未知</li> -->
           </ul>
        </slot>
    </div>
</template>
<script>
    import { mapActions, mapState } from 'vuex';
    export default {
        name: 'PoiModel',
        data() {
            return {
                poiDetail: null,
                status: false
            }
        },
        computed: {
            ...mapState({
                code: state => state.sys.code,
                normalPoiDetail: state => state.normalPoiDetail.data,
                type: state => state.model.type,
                removeSelectPoint: state => state.selectPoint.remove,
                selectPointStatus: state => state.selectPoint.status
            })
        },
        watch: {
            normalPoiDetail: {
                deep: true,
                handler(data) {
                    this.setPoiDetail(data);
                }
            }
        },
        methods: {
            ...mapActions(['updateParam']),

            setPoiDetail(data) {
                let {lon = '', lat = '', fullName = '', areaCode} = data;
                this.status = (!!fullName);
                if (this.status) {
                    this.poiDetail = data;
                    this.updateParam([ 'selectPoint', { lonlat: [lon, lat], status: this.status, type: 'normal_normal', areaCode, share: false } ]);
                }
                // 防止第一点击空白处出现弹窗
                if (!this.status && !this.poiDetail) this.$emit('status', false);
            }
        },
        mounted() {
            this.setPoiDetail(this.normalPoiDetail);
        }
    }
</script>
<style scoped lang='less'>
    @import '../../assets/css/common.less';
    ul {
        width: 98%;
        margin: auto;
        margin-top: 3px;
        margin-bottom: 3px;
        min-height: 30px;
        max-height: 300px;
        overflow-y: auto;
    }
    li {
        .height();
        width: 48%;
        margin-right: 1%;
        text-align: left;
        float: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        &:nth-child(even) {
            text-indent: 10px;
        }
    }

    .big {
        li {
            .height(@height-big);
        }
    }
</style>
