<template>
    <div class="min-base-info detail pois">
        <ul>
            <li v-for="(part, index) of poisSorted" :key="index">
                <div class="part">
                    <div class="logo-center">
                        <div :class="[ 'logo', part.key ]" @click="selectLogo(part.dataSorted, part.status = !part.status)"><label>{{ part.text }}</label></div>
                    </div>
                    <ul class="clearfix">
                        <li v-for="(item, index) in part.dataSorted" v-if="item.isPoi" :key="index" :class="{ 'no-data': item.dataNull, child: !!item.child && item.show }" @click="select(item, item.key), showChild(item, true)">
                            <!-- <span :class="{'icon-chose': item.status}"></span> -->
                            <v-icon-chose :selected="item.status"></v-icon-chose>
                            {{ item.text }}
                            <!-- <span class="blue-text">({{ item.count }})</span> -->
                            <div class="box" v-if="!!item.child && item.show">
                                <ul @click.stop>
                                    <li v-for="(child, keyc) of item.child" :key="keyc">
                                        <input type="checkbox" v-model="item.childmodel" name="poic" class="checkbox" :id="keyc" :value="keyc" @change="selectChild(item, keyc)"/>
                                        <label :for="keyc">{{ child.text }}</label>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </li>
        </ul>
        <span class="no-content">{{message}}</span>
        <a class="show-table btn hover" @click="exportTable()" v-show="type !== 'globalSearch'">显示列表</a>
        <v-export-list v-if="exportList" :select-data="selectItems" :cacheId="cacheId" :type="type" :data="exportData" @close="exportList = false"></v-export-list>
    </div>
 </template>

<script>
import { mapActions, mapState } from 'vuex';
import { BaseInfo as BI } from '../../utils/tools/BaseInfo.js';
import { Model as MD } from '@/utils/tools/Model';
import ExportList from '../Plugins/ExportList';
import IconChose from '../Plugins/IconChose';

export default {
    name: 'MinBaseInfo',
    props: [ 'type', 'cacheId', 'refresh', 'wkt', 'destory', 'ideaOnly', 'forCheck' ],
    components: {
        'v-export-list': ExportList,
        'v-icon-chose': IconChose
    },

    data() {
        return {
            exportList: false,
            message: '',
            selectItems: [], // 将选中的poi拼装成select组件的数据格式
            exportData: {},
            pois: null,
            poisSorted: []
        };
    },

    computed: {
        ...mapState({
            poisCustom: state => state.userSetting.pois,
            modelParam: state => state.model.param,
            poiOrder: state => state.userSetting.poiOrder
        }),
        PARAMSToPoi() {
            const imageUrl = sysconfig.TESTPATH + ((this.modelParam.hasOwnProperty('pType')) ? MD.url[this.modelParam.pType].poiImage : MD.url[this.modelParam.modelType].poiImage);
            const detailUrl = sysconfig.TESTPATH + ((this.modelParam.hasOwnProperty('pType')) ? MD.url[this.modelParam.pType].poiDetail : MD.url[this.modelParam.modelType].poiDetail);
            let PARAMSToPoi = {
                imageUrl: imageUrl,
                detailUrl: detailUrl,
                asyncType: 'GET', // 默认是get请求,
                type: 'model',
                params: {} // 请求参数
            };
            const { levels, modelType, dateTime } = this.modelParam;
            PARAMSToPoi.type = this.type;
            switch (this.type) {
                case 'model':
                    PARAMSToPoi.params = { levels, modelType, dateTime };
                    break;
                case 'atwill':
                    PARAMSToPoi.params = { cacheId: this.cacheId };
                    PARAMSToPoi.imageUrl = sysconfig.TESTPATH + '/atwill/getAtwillPoiImg';
                    PARAMSToPoi.detailUrl = sysconfig.TESTPATH + '/atwill/getAtwillPoiDetail';
                    break;
                case 'globalSearch':
                    PARAMSToPoi.params = { wkt: this.wkt };
                    PARAMSToPoi.imageUrl = sysconfig.TESTPATH + '/basedata/getPoiImage';
                    PARAMSToPoi.detailUrl = sysconfig.TESTPATH + '/basedata/getPoiDetail';
                    break;
            }
            return PARAMSToPoi;
        }
    },

    watch: {
        PARAMSToPoi() {
            this.updateParam([ 'poi', { PARAMS: this.PARAMSToPoi, types: this.typeArr.join() + ',' } ]);
        },
        /** 逻辑destory组件，重置组件 */
        destory() {
            if (this.destory) {
                this.pois = JSON.parse(JSON.stringify(this.poisCustom));
                delete this.pois.info.data.pois_info_mountainTorrents;
                this.initConstData();
                this.updateParam([ 'poi', { types: '' } ]);
            }
        }
    },

    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.poiTypes = '';
            this.typeArr = [];
        },

        /**
         * 清除状态
         */
        clearAllStatus() {
            for (let key in this.pois) {
                this.pois[key].dataSorted.forEach((ele) => {
                    ele.status = false;
                });
            }
        },

        /**
         * 选中一组（实况和基础数据）
         * @param {Object} list 组内成员
         * @param {boolean} status 是否选中
         */
        selectLogo(list, status) {
            list.forEach((item) => {
                if (item.status !== status && item.isPoi) {
                    this.select(item, item.key, status);
                }
            })
        },

        select(item, key, status) {
            const [ lone, ltwo, lthree ] = key.split('_');
            item = !item ? this[lone][ltwo]['data'][key] : item;
            status = item.status = (status !== undefined ? status : !item.status);

            if (item.child) {
                const arr = Object.keys(item.child);
                item.childmodel = status ? arr : [];
                const all = BI.poiTypes[lone][ltwo][lthree];
                let allType = [];
                for (const name in all) {
                    allType = allType.concat(all[name]);
                }
                this.mergePoiType(allType, status);
            } else {
                let type;
                if (item.isPoi) {
                    type = BI.poiTypes[lone][ltwo][lthree];
                    this.mergePoiType(type, status);
                } else {
                    this.updateParam([ lthree, { status: status } ]);
                }
            }
        },

        selectChild(parent, key) {
            let childmodel = parent.childmodel;
            // 根据子节点是否选中判断父节点是否应该选中
            parent.status = childmodel.length > 0;
            const [ lone, ltwo, lthree, lfour ] = key.split('_');
            let selectArr = BI.poiTypes[lone][ltwo][lthree][lfour];
            let status = childmodel.includes(key);
            this.mergePoiType(selectArr, status);
        },

        showChild(item, status) {
            if (!!item.child) item.show = status;
        },

        mergePoiType(arr, status = false) {
            let poiTypeStr = this.poiTypes;
            if (status) {
                let poiTypesArr = poiTypeStr.split(',');
                poiTypesArr = poiTypesArr.concat(arr);
                poiTypesArr = [...new Set(poiTypesArr)];
                this.poiTypes = poiTypesArr.join();
            } else {
                poiTypeStr = poiTypeStr + ',';
                arr.forEach((poi) => {
                    // 采用"," 为后缀是因为在replace时方便区分同一前缀的poi， 如'LCD_LED', 'LCD_LED_TYFON'
                    poiTypeStr = poiTypeStr.replace(`${poi},`, '');
                })
                poiTypeStr.replace(',,', '');
                this.poiTypes = poiTypeStr;
            }
            // 去掉首尾逗号“,”
            this.poiTypes = this.poiTypes.replace(/[,]$|^[,]/, '');
            let typeArr = this.poiTypes.split(',');
            typeArr = (!!typeArr[0]) ? typeArr.map(function(t) {
                if (t.includes('_')) return t
                else return BI.poiTypeMapping[t];
            }) : [];
            this.typeArr = typeArr;
            this.updateParam([ 'poi', { PARAMS: this.PARAMSToPoi, types: typeArr.join() } ]);
        },

        createPoiSelect() {
            const pois = [...this.typeArr];
            const selectItems = [];
            const tempTextNum = {};
            pois.forEach((value) => {
                const key = BI.poiType2Key[value];
                const [ lone, ltwo, lthree ] = key.split('_');
                const hasChild = BI.poiTypes[lone][ltwo][lthree].length > 1;
                let text = this.poisCustom[ltwo].data[key].text;
                if (hasChild) {
                    if (!tempTextNum[text]) {
                        tempTextNum[text] = 1;
                    } else {
                        tempTextNum[text] += 1;
                    }
                    text = text + '_' + tempTextNum[text];
                }
                selectItems.push({ text, value });
            });
            this.selectItems = selectItems;
        },

        exportTable() {
            if (this.typeArr.length > 0) {
                this.message = '';
                this.createPoiSelect();
                const url = sysconfig.TESTPATH + (this.isModel ? MD.url[this.modelParam.pType].poiTable : '/atwill/getAtwillPoiTable');
                const reqParam = this.isModel ? this.modelParam : { cacheId: this.cacheId, code: this.modelParam.code };
                const param = Object.assign({ poiTypes: this.typeArr.join() + ',' }, reqParam);
                utils.GET(url, param).then((json) => {
                    this.exportData = json.data.poiMap
                    this.exportList = true;
                })
            } else {
                this.message = '请选中类型';
            }
        },

        selectIDEA(obj) {
            let dataSorted = [];
            obj.dataSorted.forEach(ele => {
                if (ele.code.indexOf('IDEA') > -1 || ele.code.indexOf('XXZX') > -1) {
                    dataSorted.push(ele);
                }
            });
            obj.dataSorted = dataSorted;
            return obj;
        },

        initStatus(obj) {
            obj.dataSorted.forEach(ele => {
                if (this.forCheck.includes(ele.code)) {
                    ele.status = true;
                    this.mergePoiType(ele.code.split('_').join(''), true);
                }
            });
        }

    },

    mounted() {
        this.initConstData();
        this.pois = JSON.parse(JSON.stringify(this.poisCustom));
        this.poiOrder.forEach((type) => {
            for (let [key, val] of Object.entries(this.pois)) {
                if (key === type) {
                    val.key = key
                    if (this.ideaOnly) {
                        val = this.selectIDEA(val);
                    }
                    if (this.forCheck) {
                        this.initStatus(val);
                    }
                    this.poisSorted.push(val)
                }
            }
        })
        delete this.pois.info.data.pois_info_mountainTorrents;
        this.isModel = this.type === 'model';
    },

    destroyed() {
        this.poiTypes = '';
        this.updateParam([ 'poi', { PARAMS: this.PARAMSToPoi, types: '' } ]);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.icon-chose::before {
    position: absolute;
    top: -5px;
    right: 0;
}

.detail {
    width: @analysis-width;
    float: left;
    overflow: hidden;
    ul li:nth-last-child(1) > .part {
        border-bottom: none;
    }
    .part {
        background-color: #fff;
        padding: 0 2px;
        // width: @analysis-width;
        margin: 0 10px;
        display: table;
        border-bottom: 1px solid #eee;
        .logo-center {
            width: 48px;
            text-align: center;
            display: table-cell;
            vertical-align: middle;
            padding: 3px 0;
            .logo {
                width: 100%;
                height: 19px;
                padding-top: 43px;
                box-sizing: border-box;
                display: inline-block;
            }
        }
        ul {
            display: table-cell;
            vertical-align: middle;
            padding: 3px;
            li {
                float: left;
                padding: 0 15px;
                height: @height;
                line-height: @height;
                font-family: "Microsoft Yahei";
                position: relative;
                &.no-data, &.no-data:hover {
                    // color: #bfbfbf;
                    color: #c0c0c0;
                }
                &:hover {
                    color: @select-font-color;
                }
                span {
                    display: block;
                    position: absolute;
                    top: 0;
                    right: 0;

                    &::before {
                        right: 2px;
                        top: -4px;
                    }
                }
            }
        }
    }

    &.pois {
        .info {
            background: url("../../assets/img/minbase/a1.png") no-repeat center center;
        }
        .goods {
            background: url("../../assets/img/minbase/a2.png") no-repeat center center;
        }
        .power {
            background: url("../../assets/img/minbase/a3.png") no-repeat center center;
        }
        .place {
            background: url("../../assets/img/minbase/a4.png") no-repeat center center;
        }
        .child {
            border: 1px solid #ccc;
            padding: 3px 8px;
            margin: 0;
            &:hover {
                .icon-chose:before {
                    right: -3px;
                    top: -4px;
                }
            }
            &:after {
                content: "";
                display: inline-block;
                position: absolute;
                left: 0;
                bottom: -2px;
                background: #FFFFFF;
                width: 67px;
                height: 3px;
            }
            .box {
                position: absolute;
                width: 367px;
                float: left;
                overflow: hidden;
                background: #fff;
                left: -1px;
                margin-top: 3px;
                ul {
                    border: 1px solid #b3b3b3;
                    width: 367px;
                    box-sizing: border-box;
                }
            }
        }
    }

    .no-content {
        color: red;
        position: absolute;
        right: 81px;
        bottom: 10px;
    }
}

.blue-text {
    color: @select-font-color;
}

.show-table {
    position: absolute;
    padding: 0 8px;
    bottom: 5px;
    right: 5px;
    background: none;
    color: #414141;
}

.big {
    .detail {
        width: @analysis-width-big;
        line-height: 30px;
        .part {
            ul {
                li {
                    .height-big(30px);
                    padding: 6px 15px;

                    span {
                        &::before {
                            right: 0;
                        }
                    }
                }
            }
        }
    }
    .no-content {
        right: 140px;
        bottom: 6px;
    }
}
</style>
