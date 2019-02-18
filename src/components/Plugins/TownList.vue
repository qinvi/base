<template>
    <div class="export-list">
        <div class="list-param">
            <div class="list-type">
                <label>区（镇）列表导出列表：</label>
                <div v-for="(item, index) of poi" :key="index">
                    <input class="radio" type="radio" name="poi" :id="'el-' + item.id" :value="item.type" v-model="excelType"/>
                    <label :for="'el-' + item.id">{{ item.text }}</label>
                </div>
            </div>
            <a class="btn hover" @click="exportAll()">全部导出</a>
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
import { Model as MD } from '../../utils/tools/Model.js';
// import Select from '@/components/Plugins/Select'
import _ from 'lodash'

import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';

export default {
    props: [ 'data', 'type', 'street', 'cacheId' ],
    name: 'TownList',
    components: {
        // 'v-select': Select
    },
    data() {
        return {
            list: {},
            poi: [
                { id: 'all', text: '镇名汇总', type: 'all' },
                { id: 'single', text: '镇名单行', type: 'single' }
            ],
            excelType: 'single'
        };
    },
    computed: {
        ...mapState({
            param: state => state.model.param,
            pType: state => state.model.type
        })
    },
    watch: {
        data() {
            this.select(this.data);
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        close() {
            this.$emit('close');
        },
        select(list) {
            const temp = { city: [], county: [], town: [], info: [] }
            let city = [];
            let cityH = 0
            _.forEach(list, function(cityArr, cityKey) {
                let county = [];
                let countyH = 0
                _.forEach(cityArr, function(countyArr, countyKey) {
                    let town = [];
                    _.forEach(countyArr, function(townArr, townKey) {
                        town.push({ text: townArr, height: townArr.length * 8 });
                        countyH += townArr.length * 8 + 1;
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
                    minScrollbarLength: 20
                });
            }
        },

        exportAll() {
            const url = sysconfig.TESTPATH + (this.isModel ? MD.url[this.pType].modelTown : '/atwill/exportAtwillTown');
            const importType = this.excelType;
            const single = this.excelType === 'single';
            const reqParam = this.isModel ? this.param : { cacheId: this.cacheId, code: this.param.code };
            const param = utils.serializeWithAuth(Object.assign({ single, importType, showStreet: this.street }, reqParam));
            window.open(url + '?' + param);
        }
    },
    mounted() {
        this.select(this.data);
        this.isModel = this.type === 'model';
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
@border-color: #bbb;

.analysis-out {
    .radio:checked + label::after {
        top: 12px;
    }
}

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
        text-align: left;

        .list-type {
            display: inline-block;
            div {
                display: inline;
            }
            label {
                display: inline-block;
            }
        }
    }
    .list-table {
        max-height: 340px;
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
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
            }
            &:nth-child(1) {
                width: 90px;
            }
            &:nth-child(2) {
                width: 90px;
            }
            &:nth-child(3) {
                width: 250px;
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
                height: 20px;
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

        .radio:checked + label::after {
            top: 15px;
        }

        .list-table {
            max-height: 250px;
            ul {
                &:nth-child(1) {
                    width: 140px;
                }
                &:nth-child(2) {
                    width: 140px;
                }
                &:nth-child(3) {
                    width: 320px;
                }
            }
        }
    }
}
</style>
