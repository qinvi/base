<template>
    <div class="ecase">
        <div class="ecase-main">
            <div class="ecase-if clearfix">
                <v-dropdown :list="area.prov.data" :tip="area.prov.tip" class="dropdown-plan" @select="select"></v-dropdown>
                <v-dropdown :list="area.city.data" :tip="area.city.tip" class="dropdown-plan" @select="select"></v-dropdown>
                <v-dropdown :list="area.county.data" :tip="area.county.tip" class="dropdown-plan" @select="select"></v-dropdown>
                <v-dropdown :list="area.town.data" :tip="area.town.tip" class="dropdown-plan" @select="select"></v-dropdown>
            </div>
            <div class="ecase-table list">
                <table cellpadding="0" cellspacing="0">
                    <thead>
                        <tr>
                            <td>序号</td>
                            <td>预案名称(点击选择)</td>
                            <td>版本</td>
                            <td>附件</td>
                        </tr>
                    </thead>
                    <tbody id="plan-list">
                        <tr v-for="(item, index) in list" :key="index" v-if="index < count" :class="{ selected: item.status }" @click="getEmergencyPlanInfo(item)">
                            <td>{{ index + 1 }}</td>
                            <td>{{ item.title }}</td>
                            <td>暂无版本</td>
                            <td>--</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';
import Dropdown from '../Plugins/Dropdown';

export default {
    components: {
        'v-dropdown': Dropdown
    },
    data() {
        return {
            area: {
                prov: { data: [ { text: '广东省', value: '44' } ], tip: '广东省' },
                city: { data: [], tip: '选择市' },
                county: { data: [], tip: '选择区' },
                town: { data: [], tip: '选择镇' }
            },
            list: [],
            count: 100
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            areaName: state => state.sys.areaName
        })
    },
    watch: {
        code() {
            this.initSelect();
            this.listEmergencyPlan(this.code);
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化影响分析
         */
        initConstData() {
            this.urls = {
                listAdministrativeName: sysconfig.TESTPATH + '/atwill/listAdministrativeName',
                listEmergencyPlan: sysconfig.TESTPATH + '/atwill/listEmergencyPlan',
                getEmergencyPlanInfo: sysconfig.TESTPATH + '/atwill/getEmergencyPlanInfo'
            }
            this.layer = lmap.layer.init(lmap.map, 'active');
            this.last = null;
            this.select({ text: this.areaName, value: this.code });
        },

        initSelect() {
            const [ prov, city, county, town ] = this.code.replace(/(\d{2})(?=[^$])/g, '$1,').split(',');
            if (!!town) {
                this.select({ text: this.areaName, value: prov + city + county + town }, true);
                return;
            }
            if (!!county) {
                this.select({ text: this.areaName, value: prov + city + county }, true);
                return;
            }
            if (!!city) {
                this.select({ text: this.areaName, value: prov + city }, true);
                return;
            }
            if (!!prov) {
                this.select({ text: this.areaName, value: prov }, true);
                return;
            }
        },

        /**
         * 选择区域获取下一级区域信息
         * @param {string} item 区域信息
         * @param {boolean} status 是否初始化
         */
        select(item, status) {
            utils.get(this.urls.listAdministrativeName, { code: item.value }).then((json) => {
                const data = json.data.next;
                const areaMap = [];
                for (const index in data) {
                    const area = data[index];
                    areaMap.push({ text: area.codeCN, value: area.code });
                }
                this.selectArea(areaMap, item, status);
            });
        },

        /**
         * 根据区域编码动态赋值
         * @param {array} data 区域信息
         * @param {object} item 选中地区信息
         * @param {boolean} status 初始化提示
         */
        selectArea(data, item, status) {
            const length = item.value.length;
            if (length === 2) {
                const t = { value: item.value, text: '选择市' };
                data.unshift(t);
                if (status) this.area.prov.tip = item.text;
                this.area.city = { data: data, tip: '选择市' };
                this.area.county = { data: [], tip: '选择县' };
                this.area.town = { data: [], tip: '选择镇' };
            } else if (length === 4) {
                const t = { value: item.value, text: '选择县' };
                data.unshift(t);
                if (status) this.area.city.tip = item.text;
                this.area.county = { data: data, tip: '选择县' };
                this.area.town = { data: [], tip: '选择镇' };
            } else if (length === 6) {
                const t = { value: item.value, text: '选择镇' };
                data.unshift(t);
                if (status) this.area.county.tip = item.text;
                this.area.town = { data: data, tip: '选择镇' };
            }
            this.list = [];
            this.listEmergencyPlan(item.value);
        },

        /**
         * 根据区域编码查询相关预案
         * @param {string} code 区域编码
         */
        listEmergencyPlan(code) {
            utils.GET(this.urls.listEmergencyPlan, { code: code }).then((json) => {
                const data = json.data.resp;
                data.map(function(obj) {
                    obj.status = false;
                    return obj;
                });
                this.list = data;
            });
        },

        /**
         * 根据ID查询预案
         * @param {string} item 单个预案
         */
        getEmergencyPlanInfo(item) {
            if (!!this.last) {
                this.last.status = false;
            }
            item.status = true;
            this.last = item;
            this.updateParam([ 'toolsBar', { planId: item.id } ]);
            this.updateParam([ 'toolsBar', { econtrol: true } ]);
            // utils.GET(this.urls.getEmergencyPlanInfo, { planId: item.id }).then((json) => {
            //     this.restore(json);
            // });
        },

        /**
         * 还原预案
         */
        restore(json) {
            const data = JSON.parse(json.data.layerEle);
            const features = [];
            data.forEach(function(ele) {
                if (ele.type !== 'map') {
                    const feature = lmap.polygon.addWKT(ele.wkt)[0];
                    let styles = [ lmap.style.getStyle(ele.style) ];
                    feature.setStyle(styles);
                    feature.set('type', ele.type);
                    feature.set('style', ele.style);
                    features.push(feature);
                } else {
                    lmap.map.getView().setCenter(ele.center);
                    lmap.map.getView().setZoom(ele.zoom);
                    this.updateParam([ { mapType: ele.mapType } ]);
                }
            }, this);
            lmap.draw.clear(this.layer);
            this.layer.getSource().addFeatures(features);
        }
    },
    mounted () {
        this.initConstData();
        this.initSelect();
        this.listEmergencyPlan(this.code);
        /* eslint-disable */
        new PS('#plan-list');
    },
    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
        this.updateParam([ 'toolsBar', { econtrol: false } ]);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

#plan-list {
    height: 176px;
    position: relative;
}

.ecase {
    .ecase-main {
        clear: both;
        .ecase-if {
            padding: 4px;
            text-align: left;
        }
        .ecase-table {
            width: 100%;
            table {
                width: 100%;
                tr td {
                    border: 0;
                    height: @height;
                    line-height: @height;
                    text-align: center;
                    border-bottom: 1px solid #E5E8EC;
                    border-right: 1px solid #E5E8EC;
                }
                tr:hover {
                    background: @title-color;
                    cursor: pointer;
                }
                tr td:first-child {
                    width: 50px
                }
                tr td:nth-child(2) {
                    width: 220px
                }
                tr td:nth-child(3) {
                    width: 80px
                }
                tr td:nth-child(4) {
                    width: 76px;
                    text-align: left;
                    padding-left: 10px;
                }
                tr.selected {
                    background: #bfe1ff;
                }
            }

            &.ecase-title tr {
                background: @title-color;
            }

            &.list {
                clear: both;
                cursor: pointer;
            }

            .list tr td:nth-child(4) {
                text-align: left;
                padding-left: 18px;
            }
        }
    }
}

.big {
    .ecase {
        .ecase-table {
            table {
                tr {
                    td {
                        height: @height-big;
                        line-height: @height-big;

                        &:nth-child(1) {
                            width: 70px;
                        }
                        &:nth-child(2) {
                            width: 300px;
                        }
                        &:nth-child(3) {
                            width: 120px;
                        }
                        &:nth-child(4) {
                            width: 100px;
                        }
                    }
                }
                thead {
                    tr {
                        td {

                        }
                    }
                }
                tbody {
                    tr {
                        td {

                        }
                    }
                }
            }
        }
    }
}
</style>
