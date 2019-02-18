<template>
    <div class="ship" ref="ship-box">
        <div class="title" ref="ship-title">
            <span>船名：{{ item.ename }}</span>
            <a class="close" @click="close()"></a>
        </div>
        <div class="ship-table">
            <table cellpadding="0" cellspacing="0">
                <tr>
                    <td>呼号</td>
                    <td>{{ item.callSign }}</td>
                    <td>船类型</td>
                    <td>{{ item.vesselType }}</td>
                </tr>
                <tr>
                    <td>船长</td>
                    <td>{{ item.length }}</td>
                    <td>船宽</td>
                    <td>{{ item.width }}</td>
                </tr>
                <tr>
                    <td>纬度</td>
                    <td>{{ item.lat }}</td>
                    <td>经度</td>
                    <td>{{ item.lon }}</td>
                </tr>
                <tr>
                    <td>航向</td>
                    <td>{{ item.course }}</td>
                    <td>航速</td>
                    <td>{{ item.sog }}</td>
                </tr>
                <tr>
                    <td>目的地</td>
                    <td>{{ item.dest }}</td>
                    <td>时间</td>
                    <td>{{ item.dDateTime }}</td>
                </tr>
                <tr>
                    <td>ETA</td>
                    <td>{{ item.eta }}</td>
                    <td>终端编号</td>
                    <td>{{ item.mmsi }}</td>
                </tr>
                <tr>
                    <td>最大吃水</td>
                    <td>{{ item.draught }}</td>
                    <td>AIS类型</td>
                    <td>{{ item.aisClass }}</td>
                </tr>
                <tr>
                    <td>IMO</td>
                    <td>{{ item.imo }}</td>
                    <td>船首向</td>
                    <td>{{ item.cog }}</td>
                </tr>
                <tr>
                    <td>导航设备</td>
                    <td>{{ item.deviceType }}</td>
                    <td>导航状态</td>
                    <td>{{ item.state }}</td>
                </tr>
                <tr>
                    <td v-show="item.v01011_01">编码</td>
                    <td v-show="item.v01011_01">{{ item.v01011_01 }}</td>
                    <td v-show="item.shipOwner">所有人</td>
                    <td v-show="item.shipOwner">{{ item.shipOwner }}</td>
                </tr>
                <tr>
                    <td v-show="item.mobphone">所有人手机</td>
                    <td v-show="item.mobphone">{{ item.mobphone }}</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr class="null-data" >
                    <td colspan="4" v-show="newdata">上次同步时间：{{ item.dDateTime }}，此船舶缺少最新上传数据。</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: 'PopupBoxShip',
    props: ['data', 'newdata'],
    data() {
        return {
            item: {}
        };
    },
    computed: {
        ...mapState({
            ndata: state => {
                return state.ship.data || {};
            }
        })
    },
    watch: {
        data() {
            this.item = Object.assign({}, this.ndata, this.data);
            WD.init(this.$refs['ship-title'], this.$refs['ship-box'], lmap.map);
        },
        ndata() {
            this.item = Object.assign({}, this.ndata, this.data);
        }
    },
    methods: {
        close() {
            this.$emit('close');
        }
    },
    mounted() {
        WD.init(this.$refs['ship-title'], this.$refs['ship-box'], lmap.map);
        this.item = Object.assign({}, this.ndata, this.data);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.ship {
	position: absolute;
	top: 0px;
	right: 0px;
	background: #fff;
	z-index: @pop-index;
	width: 427px;
	box-shadow: @shadow;
    table {
        width: 100%;

        tr {
            .height();
            td {
                border-right: 1px solid @title-color;
                border-bottom: 1px solid @title-color;
                box-sizing: border-box;
                /*white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;*/

                &:nth-child(odd) {
                    width: 70px;
                    padding-right: 4px;
                    text-align: right;
                }
                &:nth-child(even) {
                    text-indent: 4px;
                    text-align: left;
                    font-weight: bold;
                }
                &:nth-child(2) {
                    /*width: 130px;*/
                    padding-right: 4px;
                    text-align: left;
                }
                &:last-child {
                    border-right: 0;
                }
                &.autoLength {
                    width: 130px;
                }
            }

            // &:nth-last-child(2) {
            //     td:nth-child(2) {
            //         border-right: 1px solid @title-color;
            //     }
            // }
            &.null-data {
                td:first-child {
                    width: 100%;
                    text-align: center;
                }
            }
        }
    }
}
.big .ship {
    width: 600px;
    table {
        tr {
            .height(@height-big);
            td {
                &:nth-child(odd) {
                    width: 105px;
                }
                &:nth-child(2) {
                    /*width: 130px;*/
                }
            }
        }
    }
}
</style>
