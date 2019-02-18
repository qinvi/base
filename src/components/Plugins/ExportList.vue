<template>
    <div class="export-list">
        <div class="list-param">
            <v-dropdown :list="poiTypes.data" :tip="poiTypes.tip" class="dropdown-export-list" @select="select"></v-dropdown>
            <div class="list-type">
                <label>导出列表：</label>
                <div v-for="(item, index) of poi" :key="index">
                    <input class="radio" type="radio" name="poi" :id="'el-' + item.id" :value="item.type" v-model="radioType"/>
                    <label :for="'el-' + item.id">{{ item.text }}</label>
                </div>
            </div>
            <a class="btn" @click="exportTable">全部导出</a>
            <a class="close" @click="close"></a>
        </div>
        <div class="list-table">
            <ul class="city-collect">
                <li v-for="(item, index) of list.city" :key="index" :title="item.text" :style="{ height: item.height + 'px', lineHeight: item.height + 'px' }">{{ item.text }}</li>
            </ul>
            <ul class="county-collect">
                <li v-for="(item, index) of list.county" :key="index">
                    <div v-for="(citem, cindex) of item" :key="cindex" :title="citem.text" :style="{ height: citem.height + 'px', lineHeight: citem.height + 'px' }">{{ citem.text }}</div>
                </li>
            </ul>
            <ul class="town-collect">
                <li v-for="(item, index) of list.town" :key="index">
                    <div v-for="(citem, cindex) of item" :key="cindex" :title="citem.text" :style="{ height: citem.height + 'px', lineHeight: citem.height + 'px' }">{{ citem.text }}</div>
                </li>
            </ul>
            <ul class="info-collect">
                <li v-for="(item, index) of list.info" :key="index">
                    <div v-for="(citem, cindex) of item" :key="cindex" :title="citem" v-show="citem !== null">{{ citem }}</div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Model as MD } from '@/utils/tools/Model';
import Dropdown from '../Plugins/Dropdown';
import _ from 'lodash'

import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default {
    props: [ 'data', 'selectData', 'cacheId', 'type' ],
    name: 'ExportList',
    components: {
        'v-dropdown': Dropdown
    },
    data() {
        return {
            poiTypes: { data: [], tip: '' },
            list: {},
            poi: [
                { id: 'sum', text: 'POI汇总', type: 'sum' },
                { id: 'single', text: 'POI单行', type: 'single' }
            ],
            radioType: 'single'
        };
    },
    computed: {
        ...mapState({
            param: state => state.model.param,
            bigScreen: state => state.toolsBar.bigScreen
        }),
        lineHeight() {
            return this.bigScreen ? 32 : 26;
        }
    },
    watch: {
        lineHeight() {
            this.select({ value: this.selectData[0].value });
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        close() {
            this.$emit('close');
        },

        select(param) {
            let lineHeight = this.lineHeight;
            this.poiType = param.value;
            const list = this.data[param.value];
            const temp = { city: [], county: [], town: [], info: [] }
            let city = [];
            let cityH = 0
            _.forEach(list, function(cityArr, cityKey) {
                let county = [];
                let countyH = 0
                _.forEach(cityArr, function(countyArr, countyKey) {
                    let town = [];
                    _.forEach(countyArr, function(townArr, townKey) {
                        let info = [];
                        _.forEach(townArr, function(infoStr) {
                            info.push(infoStr);
                        });
                        temp.info.push(info);
                        town.push({ text: townKey, height: townArr.length * lineHeight });
                        countyH += townArr.length * lineHeight + 1;
                    });
                    temp.town.push(town);
                    county.push({ text: countyKey, height: countyH - 1 });
                    cityH += countyH;
                    countyH = 0;
                });
                cityH += countyH - 1;
                temp.county.push(county);
                city.push({ text: cityKey, height: cityH });
                cityH = 0;
            });
            temp.city = city;
            this.list = temp;
            /* eslint-disable no-new */
            if (!!this.ps) {
                this.ps.update();
                utils.selectElem('.list-table').scrollTop = 0;
            } else {
                this.ps = new PS('.list-table', {
                    minScrollbarLength: 40
                });
            }
        },

        exportTable() {
            const url = sysconfig.TESTPATH + (this.isModel ? MD.url[this.param.pType].modelPoi : '/atwill/exportAtwillPoi');
            let poiTypes = [];
            for (const poi of this.poiTypes.data) {
                poiTypes.push(poi.value);
            }
            poiTypes = poiTypes.join(',');
            const reqParam = this.isModel ? this.param : { cacheId: this.cacheId, code: this.param.code };
            const param = utils.serializeWithAuth(Object.assign({ poiTypes, single: this.radioType === 'single' }, reqParam));
            window.open(url + '?' + param);
        }

    },
    mounted() {
        this.poiTypes.data = this.selectData;
        this.poiTypes.tip = this.selectData[0].text;
        this.select({ value: this.selectData[0].value });
        this.isModel = this.type === 'model';
    },
    destroyed() {
        this.poiTypes = null;
        this.list = null;
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
@border-color: #bbb;

.export-list {
    width: @analysis-width;
    height: auto;
    position: fixed;
    z-index: @panel-index;
    right: 0px;
    top: 30px;
    background: #fff;
    box-shadow: @shadow;

    .list-param {
        padding: 6px;
        background-color: @title-color;

        .dropdown {
            margin-right: 6px;
        }

        .list-type {
            display: inline-block;
            label, div {
                display: inline-block;
            }
            label {
                height: @height;
                line-height: @height;
            }
            .radio:checked + label::after {
                top: 10px;
            }
        }
        .bth {
            height: @height;
            line-height: @height;
        }
    }
    .list-table {
        max-height: 400px;
        position: relative;
        ul {
            float: left;
            li {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
                border-top: 1px solid @border-color;
                border-left: 1px solid @border-color;
                text-align: center;
                vertical-align: middle;
                &:nth-last-child(1) {
                    border-bottom: 1px solid @border-color;
                }
                div {
                    height: @height;
                    line-height: @height;
                    // border-bottom: 1px solid @border-color;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
            }
            &:nth-child(1) {
                width: 60px;
            }
            &:nth-child(2) {
                width: 60px;
            }
            &:nth-child(3) {
                width: 150px;
            }
            &:nth-child(4) {
                width: 168px;
            }
        }
        ul.town-collect li, ul.county-collect li {
            border-top: none;
            &:nth-child(1) {
                border-top: 1px solid @border-color;
            }
            &:nth-last-child(1) {
                border-bottom: none;
            }
            div {
                border-bottom: 1px solid @border-color;
            }
        }
        ul.info-collect {
            border-right: 1px solid @border-color;
            div {
                // border-bottom: 1px solid @border-color;
                // height: 20px;
                // text-align: left;
                // text-indent: 10px;
            }
        }
    }
}

.big {
    .export-list {
        top: @top-big;
        width: @analysis-width-big;

        .list-param {
            .dropdown {
                height: 32px;
                line-height: 32px;
            }
            .list-type {
                label {
                    height: @height-big;
                    line-height: @height-big;
                }
                .radio:checked + label::after {
                    top: 13px;
                }
            }
            .btn {
                height: @height-big;
                line-height:  @height-big;
            }
        }
        .list-table {
            ul {
                li {
                    div {
                        height: @height-big;
                        line-height: @height-big;
                    }
                }
                &:nth-child(1) {
                    width: 100px;
                }
                &:nth-child(2) {
                    width: 90px;
                }
                &:nth-child(3) {
                    width: 200px;
                }
                &:nth-child(4) {
                    width: 209px;
                }
            }
        }
    }
}
</style>
