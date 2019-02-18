<template>
    <div class="min-base-info detail pois">
        <ul>
            <li v-for="(part, index) of poisSorted" :key="index">
                <div class="part">
                    <ul class="clearfix">
                        <li v-for="(item, index) in part.dataSorted" v-if="item.isPoi" :key="index" :class="{ 'no-data': item.dataNull, child: !!item.child && item.show }" @click="select(item, item.key)">
                            <v-icon-chose :selected="item.status"></v-icon-chose>
                            {{ item.text }}
                        </li>
                    </ul>
                </div>
            </li>
        </ul>
        <span class="no-content">{{message}}</span>
        <template v-if="type === 'target'">
            <a class="show-table btn hover" @click="requestTarget">完成</a>
        </template>
    </div>
 </template>

<script>
import { mapActions, mapState } from 'vuex';
import { BaseInfo as BI } from '../../utils/tools/BaseInfo.js';
import IconChose from '../Plugins/IconChose';

export default {
    name: 'MinBaseInfo',
    props: [ 'type', 'cacheId', 'refresh', 'wkt', 'destory', 'ideaOnly', 'forCheck' ],
    components: {
        'v-icon-chose': IconChose
    },

    data() {
        return {
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
            otherStatus: state => state.target.otherStatus,
            poiOrder: state => state.userSetting.poiOrder
        })
    },

    watch: {
        /** 逻辑destory组件，重置组件 */
        destory() {
            if (this.destory) {
                this.pois = JSON.parse(JSON.stringify(this.poisCustom));
                delete this.pois.info.data.pois_info_mountainTorrents;
                this.initConstData();
            }
        }
    },

    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.poiTypes = '';
            this.typeArr = [];
            this.specialStatus = {
                goods: false,
                power: false,
                place: false
            };
            if (!!this.otherStatus) this.specialStatus = JSON.parse(JSON.stringify(this.otherStatus));
            this.modify = false;
        },

        requestTarget() {
            this.$emit('selectPoi', this.typeArr);
            if (this.modify) {
                this.updateParam([ 'target', {otherStatus: this.specialStatus} ]);
                this.modify = false;
            }
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

        select(item, key, status) {
            let lone, ltwo, lthree, b;
            b = key.includes('pois&');
            if (b) [ lone, ltwo, lthree ] = key.split('&');
            else [ lone, ltwo, lthree ] = key.split('_');
            item = !item ? this[lone][ltwo]['data'][key] : item;
            status = item.status = (status !== undefined ? status : !item.status);

            if (item.isPoi) {
                let type;
                if (b) type = lthree.split(',');
                else type = BI.poiTypes[lone][ltwo][lthree];
                this.mergePoiType(type, status);
            }
            let t = false;
            if (!this.otherStatus) t = true;
            if (key.includes('pois&goods')) this.specialStatus['goods'] = t || !this.otherStatus['goods'];
            if (key.includes('pois&power')) this.specialStatus['power'] = t || !this.otherStatus['power'];
            if (key.includes('pois&place')) this.specialStatus['place'] = t || !this.otherStatus['place'];
            if (key.includes('pois&')) this.modify = true;
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
            if (obj.key === 'info') {
                obj.dataSorted.forEach(ele => {
                    if (this.forCheck.includes(ele.code)) {
                        ele.status = true;
                        this.mergePoiType([ele.code.split('_').join('')], true);
                    }
                });
            } else {
                if (this.otherStatus && this.otherStatus[obj.key]) {
                    obj.dataSorted.forEach(ele => {
                        if (this.forCheck.includes(ele.code)) {
                            ele.status = true;
                            this.mergePoiType([ele.code.split('_').join('')], true);
                        }
                    });
                }
            }
        },

        /**
         * 创造数据
         */
        createData() {
            this.pois = JSON.parse(JSON.stringify(this.poisCustom));
            if (this.type === 'target') this.clearAllStatus();
            let poiStr = '';
            let poiKey = [];
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
            });
            if (!this.poiOrder.includes('info')) {
                this.poisSorted.unshift({
                    text: '基本信息',
                    status: false,
                    key: 'info',
                    dataSorted: []
                });
            }
            let arr = this.poisSorted.shift();
            this.poisSorted.forEach(ele => {
                if (ele.key === 'goods' || ele.key === 'power' || ele.key === 'place') {
                    poiKey[0] = (ele.key === 'goods') ? '应急物资' : (ele.key === 'power') ? '救援力量' : '避难场所';
                    poiKey[1] = (ele.key === 'goods') ? 'EMERGENCY' : (ele.key === 'power') ? 'RESCUE' : 'PLACE';
                    ele.dataSorted.forEach(e => {
                        poiStr += ',' + e.code.split('_').join('');
                    });
                    poiStr = poiStr.substr(1);
                    if (poiStr) {
                        arr.dataSorted.push({
                            otherStatus: ele.key,
                            code: poiStr,
                            count: 0,
                            dataNull: false,
                            ename: poiKey[1],
                            isPoi: 'true',
                            key: `pois&${ele.key}&${poiStr}`,
                            name: poiKey[0],
                            originalType: poiStr,
                            status: this.otherStatus && this.otherStatus[ele.key],
                            text: poiKey[0]
                        });
                    }
                    poiStr = '';
                }
            });
            this.poisSorted = [arr];
            delete this.pois.info.data.pois_info_mountainTorrents;
            this.isModel = (this.type === 'model');
        }

    },

    mounted() {
        this.initConstData();
        this.createData();
    },

    destroyed() {
        this.poiTypes = '';
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
        // padding: 0 2px;
        padding: 0 0.5%;
        width: 97%;
        // width: @analysis-width;
        // margin: 0 10px;
        margin: 0 1%;
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
a.show-table {
    display: block;
    position: relative;
    width: 50px;
    float: right;
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
    a.show-table {
        width: 70px;
    }
    .no-content {
        right: 140px;
        bottom: 6px;
    }
}
</style>
