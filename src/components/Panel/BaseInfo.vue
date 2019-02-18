<template>
    <div class="base-info hover" :style='panelStyle.panelHeight'>
        <!-- <div> -->
        <ul class="modules">
            <li v-for="(text, key) of modules.list" :key="key" :class="['bar-item', { select: modules.selected == key }]" @click="selectModules(key)">
                <span class="text">{{ text }}</span>
            </li>
        </ul>
        <div id="panel" class="panel hover" :class="[modules.selected ? 'Exhibition' : 'ExhibitionEnd']">
            <div v-show="modules.selected == 'monitor'" class="detail monitor">
                <ul>
                    <li class="part" v-for="(part, index) in monitorSorted" :key="index">
                        <!-- <div class="part"> -->
                        <div class="logo-center">
                            <div :class="[ 'logo', part.key ]" @click="selectLogo(part.data, part.status = !part.status, part)">
                                <label>{{ part.text }}</label>
                            </div>
                        </div>
                        <ul>
                            <li v-for="(item, idx) in part.dataSorted" :key="idx" :class="{ 'no-data': item.dataNull }" @click="select(item, item.key)">
                                <v-icon-chose :selected="item.status"></v-icon-chose>
                                <!-- <span :class="{ 'icon-chose': item.status }"></span> -->
                                {{ item.text }}
                            </li>
                        </ul>
                        <!-- </div> -->
                    </li>
                </ul>
            </div>
            <div v-show="modules.selected === 'pois'" class="detail pois">
                <ul class="pois-list">
                    <li class="part" v-for="(part, index) in poisSorted" :key="index">
                        <!-- <div class="part"> -->
                            <div class="logo-center"><div :class="[ 'logo', part.key ]" @click="selectLogo(part.data, part.status = !part.status, part)"><label>{{ part.text }}</label></div></div>
                            <ul>
                                <li v-for="(item, idx) in part.dataSorted" :key="idx" :class="{ 'no-data': item.dataNull, child: !!item.child && item.show }" @click="select(item, item.key)" @mouseover="showChild(item, true)" @mouseout="showChild(item, false)">
                                    <v-icon-chose :selected="item.status"></v-icon-chose>
                                    <!-- <span :class="{ 'icon-chose': item.status }"></span> -->
                                    {{ item.text }}
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
                        <!-- </div> -->
                    </li>
                    <li class="select-all" @click="selectPoiAll(all.poi = !all.poi)">全选>></li>
                </ul>
            </div>
            <div v-show="modules.selected === 'deptments'" class="detail deptments">
                <ul>
                    <li :style="panelStyle.deptmentsMargin" v-for="(item, key) of deptments" :key="key" @click.stop="selectDep(key, item.status = !item.status)">
                        <!-- , {'icon-chose': item.status} -->
                        <div :class="['logo', key]" ></div>
                        <v-icon-chose :selected="item.status"></v-icon-chose>
                        <label>{{ item.text }}</label>
                    </li>
                    <li class="select-all dept-select-all" @click="selectDepAll(all.dep = !all.dep)">全选>></li>
                </ul>
            </div>
            <!-- 显示隐藏按钮 -->
            <div class="showButton icon-prev" @click="ExhibitionChange($event)"></div>
        </div>
        <div class="popDiv-ndata" v-if="alertPoi">
            <div class="box">暂无数据！</div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { BaseInfo as BI } from '../../utils/tools/BaseInfo.js';
import PS from 'perfect-scrollbar';
import 'perfect-scrollbar/css/perfect-scrollbar.css';
import IconChose from '../Plugins/IconChose';

export default {
    name: 'BaseInfo',
    data() {
        return {
            modules: {
                selected: '',
                list: {
                    monitor: '实时观测',
                    pois: '基础数据',
                    deptments: '部门信息'
                }
            },
            deptments: null,
            typesByDept: {},
            pois: null,
            monitor: null,
            // 全选状态
            all: {
                poi: false,
                dep: false
            },
            alertPoi: false
        };
    },
    components: {
        'v-icon-chose': IconChose
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            leftClose: state => state.baseInfo.status,
            lastSelect: state => state.baseInfo.lastSelect,
            controlPoi: state => state.baseInfo.poi,
            poiStatus: state => state.baseInfo.poiStatus,
            monitorCustom: state => state.userSetting.monitor,
            monitorSorted: state => state.userSetting.monitorSorted,
            poisCustom: state => state.userSetting.pois,
            poisSorted: state => state.userSetting.poisSorted,
            deptmentsCustom: state => state.userSetting.deptments,
            videoTypes: state => state.video.types,
            bigScreen: state => state.toolsBar.bigScreen,
            sysTime: state => state.time.sysTime,
            reservoir: state => /RESERVOIR_SWJ/.test(state.reservoirs.type),
            poiTip: state => state.tip.poi,
            reservoirDetailsType: state => state.reservoirDetails.type
        }),
        // 计算 基础数据 基本信息行数
        poisLine() {
            let count = 0;
            let line = 0;
            let baseLength = !this.bigScreen ? 12 : 10;
            if (!!this.pois) {
                if (!this.pois.info) {
                    return;
                }
                let data = this.pois.info.data;
                for (let ele in data) {
                    let text = data[ele].text;
                    count = count + text.length;
                }
                line = Math.ceil(count / baseLength);
            }
            return line;
        },
        panelStyle() {
            let heights = !this.bigScreen ? 416 : 475; // 588 425
            let addHeight = !this.bigScreen ? 24 : 36;
            let margin = !this.bigScreen ? 8 : 22;
            let addMargin = !this.bigScreen ? 2 : 4;
            if (this.poisLine > 4) {
                heights = heights + (this.poisLine - 4) * addHeight;
                margin = margin + (this.poisLine - 4) * addMargin;
            }
            if (this.bigScreen) heights = (heights < 680) ? 680 : heights;
            let styles = {
                panelHeight: {
                    'height': heights + 'px'
                },
                deptmentsMargin: {
                    marginTop: margin + 'px',
                    marginBottom: margin + 'px'
                }
            }
            return styles;
        }
    },
    watch: {
        leftClose(status) {
            if (!status) {
                this.modules.selected = '';
                this.selectPoiAll(false);
                this.poiTypes = '';
            } else {
                this.modules.selected = status;
            }
        },
        poisCustom() {
            this.pois = this.poisCustom;
            this.isDataNull();
        },
        deptmentsCustom() {
            this.deptments = this.deptmentsCustom;
        },
        monitorCustom() {
            this.monitor = this.monitorCustom;
        },
        code() {
            this.isDataNull();
        },
        controlPoi(val, prevVal) {
            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                if (prevVal) {
                    this.controlSelectPoi(prevVal, false);
                }
                this.controlSelectPoi(this.controlPoi, this.poiStatus);
            }, 80)
        },
        poiStatus() {
            if (this.timer1) clearTimeout(this.timer1);
            this.timer1 = setTimeout(() => {
                this.controlSelectPoi(this.controlPoi, this.poiStatus);
            }, 80)
        },
        sysTime: function (val) {
            // 更新公众实景上报标题时间
            if (this.poiTip.name === '公众实景上报') {
                this.poiTip.time = this.getLiveThingTime()
            }
        },
        bigScreen() {
            this.setScroll('monitor');
            this.setScroll('pois')
            this.setScroll('deptments')
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.poiTypes = '';
            this.setScroll('monitor');
            this.setScroll('pois')
            this.setScroll('deptments')
            this.PARAMSToPoi = {
                imageUrl: sysconfig.TESTPATH + '/basedata/getPoiImage',
                detailUrl: sysconfig.TESTPATH + '/basedata/getPoiDetail',
                asyncType: 'GET', // 默认是get请求,
                type: 'left',
                params: {} // 请求参数
            };
        },

        selectModules(key) {
            let modules = this.modules;
            modules.selected = modules.selected === key ? '' : key;
            let status = modules.selected;
            if (status) this.updateParam(['baseInfo', {status: status}]);
            if (this.poiTypes) this.mergePoiType([], false); // 打开原来的面板，重画
        },

        ExhibitionChange() {
            this.modules.selected = '';
        },

        /**
         * 选中一组（实况和基础数据）
         * @param {Object} list 组内成员
         * @param {boolean} status 是否选中
         * @param {object} parent 父元素
         * @param {boolean} allStatus 是否所有全选
         */
        selectLogo(list, status, parent, allStatus = false) {
            let poiArr = [];
            let b = 0;
            if (!allStatus) {
                for (let key in list) {
                    if (!list[key].status) {
                        b = 1;
                        break;
                    }
                }
                if (!b) {
                    parent.status = status = false;
                }
            }
            for (let key in list) {
                // item 一个poi对象 { text: '雨窝', isPoi: true, status: false },
                let item = list[key];
                const [ lone, ltwo, lthree ] = key.split('_');
                if (item.status !== status) {
                    item.status = status;
                    if (item.child) {
                        const arr = Object.keys(item.child);
                        item.childmodel = status ? arr : [];
                        let all = BI.poiTypes[lone][ltwo][lthree];
                        let allType = [];
                        for (let key in all) {
                            allType = allType.concat(all[key]);
                        }
                        poiArr = poiArr.concat(allType);
                    } else {
                        if (item.isPoi) {
                            poiArr = poiArr.concat(BI.poiTypes[lone][ltwo][lthree]);
                        } else if (item.isVideo) {
                            if (lthree === 'liveView') {
                                this.updateParam(['liveView', { status: status }])
                            }
                            if (lthree === 'liveThing') {
                                this.updateParam(['liveThing', { status: status }])
                            }
                            this.updateParam(['video', { types: this.getVideoType(BI.videoType[lone][ltwo][lthree], status) }]);
                        } else {
                            if (lthree.includes('reservoir') || lthree === 'SOUTHRESERVOIR') {
                                const types = status ? BI.poiTypes[lone][ltwo][lthree].join(',') : '';
                                this.updateParam([lthree, { status: status, type: types }]);
                            } else {
                                this.updateParam([lthree, { status: status }]);
                            }
                        }
                    }
                     // 基础数据面板--关联的部门不为空
                    if (lone === 'pois' || item.mapDep) {
                        let depArr = BI.poi2Dep[lone][ltwo][lthree];
                        // 控制关联部门样式
                        depArr.forEach((dep) => {
                            let obj = this.deptments[dep];
                            obj.count = status ? obj.count + 1 : obj.count - 1;
                            obj.status = obj.count > 0;
                        });
                        item.count = status ? depArr.length : 0;
                    }
                }
            }
            this.mergePoiType(poiArr, status);
        },

        /**
         * 视频类型组装
         */
        getVideoType(typeArr, status) {
            let temp = this.videoTypes ? this.videoTypes.split(',') : [];
            typeArr.forEach((type) => {
                if (status && !temp.includes(type)) temp.push(type)
                else if (!status) {
                    let index = temp.findIndex((val) => {
                        return val === type;
                    })
                    if (index !== -1) temp.splice(index, 1);
                }
            })
            return temp.join();
        },

        /**
         * poi全选
         * @param {boolean} status 是否全选
         */
        selectPoiAll(status) {
            let pois = this.pois;
            for (let i in pois) {
                pois[i].status = status;
                let list = pois[i].data;
                this.selectLogo(list, status, pois[i], true);
            }
        },

        /**
         * 部门信息全选
         * @param {boolean} status 是否全选
         */
        selectDepAll(status) {
            let deptments = this.deptments;
            let set = [];
            for (let key in deptments) {
                let dep = deptments[key];
                if (dep.status !== status) {
                    dep.status = status;
                    let item = this.setDepCss(key, status);
                    this.updateReservoirTypes(item.types, key, status)
                    set = set.concat(item.types);
                }
            }
            set = [...new Set(set)];
            this.mergePoiType(set, status);
        },
        /**
         * 设置单个部门--关联的poi的选中样式
         * @param {string} type 部门的key
         * @param {boolean} status 是否选中
         */
        setDepCss(type, status) {
            let item = BI.deptments[type];
            // item.poi {Array} 部门对应的poi的key  item.types部门对应的poi的类型
            item.poi.forEach((poi) => {
                const [ lone, ltwo, lthree ] = poi.split('_');
                if (!this[lone][ltwo]) return
                let obj = this[lone][ltwo]['data'][poi];
                if (!obj) return; // 没有订制该Poi
                if (obj.status !== status) {
                    // if (type === 'water_conservancy' || type === 'emergency_office') {
                    //     if (status) {
                    //         if (isNaN(obj.count)) {
                    //             obj.count = 1;
                    //         }
                    //     } else {
                    //         obj.count = 0;
                    //     }
                    // }
                    const count = obj.count;
                    obj.count = status ? count + 1 : count - 1;
                    obj.status = obj.count > 0;
                }
                if (!obj.isPoi && !obj.child) this.updateParam([lthree, { status: status }]);
            })
            this.deptments[type].count = status ? item.poi.length : 0;
            return item;
        },

        /**
         * 选中部门
         * tips: 考虑到一个poi类型的内容可能来自于两个部门，比如避难点[ 'SJZX_KEYPLACE_REFUGES'-》来自三防部门, 'GDSYJB_SLECTER'-》应急办部门 ]
         * @param {String} type 部门类型标识
         * @param {boolean} status 是否选中
         */
        selectDep(type, status) {
            let item = this.setDepCss(type, status);
            this.updateReservoirTypes(item.types, type, status)
            this.mergePoiType(item.types, status, type);
        },

        select(item, key, status) {
            const [ lone, ltwo, lthree ] = key.split('_');
            try {
                item = !item ? this[lone][ltwo]['data'][key] : item;
                if (!item) throw console.error('暂无定制 ' + key);
            } catch (e) {
                return
            }
            status = item.status = (status !== undefined ? status : !item.status);
            if (item.child) {
                const arr = Object.keys(item.child);
                item.childmodel = status ? arr : [];
                let all = BI.poiTypes[lone][ltwo][lthree];
                let allType = [];
                for (let key in all) {
                    allType = allType.concat(all[key]);
                }
                this.mergePoiType(allType, status);
            } else {
                const isTip = item.isVideo || (item.isPoi && (lthree.includes('reservoir') || lthree === 'SOUTHRESERVOIR') || ![ 'typhoon', 'radar' ].includes(lthree));
                // const tipData = [ 'geologicHazard', 'waterSystem' ].includes(lthree) ? this.pois : this.monitor;
                if (item.isPoi) {
                    this.mergePoiType(BI.poiTypes[lone][ltwo][lthree], status);
                    // 手动无数据弹出面板
                    if (key === 'pois_goods_waterConservancy') {
                        if (status) {
                            this.noDataPoi();
                        }
                    }
                } else if (item.isVideo) {
                    let videoType = BI.videoType[lone][ltwo][lthree];
                    if (videoType.join() === 'liveView') {
                        this.updateParam(['liveView', { status: status }]);
                    } else if (videoType.join() === 'liveThing') {
                        this.updateParam(['liveThing', { status: status }]);
                    } else {
                        this.updateParam(['video', { types: this.getVideoType(BI.videoType[lone][ltwo][lthree], status) }]);
                    }
                } else {
                    if (lthree.includes('reservoir') || lthree === 'SOUTHRESERVOIR') { // 特殊情况，因为水库原来是Poi
                        let t = status ? BI.poiTypes[lone][ltwo][lthree].join() : '';
                        this.updateParam([ lthree, { status: status, type: t } ]);
                        if (!status) {
                            this.updateParam([[lthree], { detail: false }]);
                        }
                        if (!status && this.reservoirDetailsType === lthree) {
                            this.updateParam([[lthree], { detail: false }]);
                            this.updateParam(['reservoirDetails', { type: null, data: null }])
                        }
                    } else {
                        this.updateParam([ lthree, { status: status } ]);
                        // 手动无数据弹出面板
                        if (key === 'monitor_detection_water' || key === 'monitor_detection_nuclear') {
                            if (status) {
                                this.noDataPoi();
                            }
                        }
                    }
                }

                if (isTip) {
                    const { text: name, ename } = this[lone][ltwo]['data'][key];
                    let time = ''
                    if (name === '公众实景上报') {
                        time = this.getLiveThingTime()
                    } else if (name === '船舶') {
                        time = this.getShipTime()
                    }
                    this.updateParam([ 'tip', { poi: { status: status, name, ename, time } } ]);
                }
            }

            // 基础数据面板--关联的部门不为空
            if (lone === 'pois' || item.mapDep) {
                let depArr = BI.poi2Dep[lone][ltwo][lthree];
                // 控制关联部门样式
                depArr.forEach((dep) => {
                    let obj = this.deptments[dep];
                    obj.count = status ? obj.count + 1 : obj.count - 1;
                    obj.status = obj.count > 0;
                });
                item.count = status ? depArr.length : 0;
            }
        },

        // 无数据时弹出弹窗
        noDataPoi() {
            this.alertPoi = true;
            window.setTimeout(() => {
                this.alertPoi = false;
            }, 1000);
        },

        selectChild(parent, key) {
            let childmodel = parent.childmodel;
            // 记录父节点之前是否已经选中
            let lastParentStatus = parent.status;
            // 根据子节点是否选中判断父节点是否应该选中
            parent.status = childmodel.length > 0;
            const [ lone, ltwo, lthree, lfour ] = key.split('_');
            // ---- 关联部门勾选样式 ----
            if (parent.status !== lastParentStatus) {
                let depArr = BI.poi2Dep[lone][ltwo][lthree];
                depArr.forEach((dep) => {
                    let obj = this.deptments[dep];
                    obj.count = parent.status ? obj.count + 1 : obj.count - 1;
                    obj.status = obj.count > 0;
                });
            }
            // ----- end ------
            let selectArr = BI.poiTypes[lone][ltwo][lthree][lfour];
            this.mergePoiType(selectArr, childmodel.includes(key));
        },

        showChild(item, status) {
            if (!!item.child) item.show = status;
        },

        mergePoiType(arr, status = false, type) {
            let poiTypeStr = this.poiTypes;
            if (status) {
                let poiTypesArr = poiTypeStr.split(',');
                poiTypesArr = poiTypesArr.concat(arr);
                poiTypesArr = [...new Set(poiTypesArr)];
                this.poiTypes = poiTypesArr.join();
            } else {
                let poiTypesArr = poiTypeStr.split(',')
                poiTypeStr = poiTypeStr + ','
                for (let i = poiTypesArr.length - 1; i >= 0; i--) {
                    if (arr.includes(poiTypesArr[i]) || arr.includes(poiTypesArr[i].replace(/_/g, ''))) { // 有下横线跟没下横线都匹配
                        poiTypeStr = poiTypeStr.replace(`${poiTypesArr[i]},`, '')
                    }
                }
                // poiTypeStr = poiTypeStr + ',';
                // arr.forEach((poi) => {
                //     // 采用"," 为后缀是因为在replace时方便区分同一前缀的poi， 如'LCD_LED', 'LCD_LED_TYFON'
                //     poiTypeStr = poiTypeStr.replace(`${poi},`, '');
                // })
                poiTypeStr.replace(',,', '');
                this.poiTypes = poiTypeStr;
            }
            // 去掉首尾逗号“,”
            this.poiTypes = this.poiTypes.replace(/[,]$|^[,]/, '');
            let typeArr = this.poiTypes.split(',');
            typeArr = (!!typeArr[0]) ? typeArr.map(function(t) {
                // if (t.includes('_') || type === 'meteorological') return t
                // else return BI.poiTypeMapping[t];
                // 以前的判断有问题，为防止改动太大，作以下处理
                // 最起码这个判断保证this.poiTypes不会出现,,,,的情况
                if (BI.poiTypeMapping[t]) return BI.poiTypeMapping[t]
                else return t
            }) : [];
            this.updateParam(['poi', {PARAMS: this.PARAMSToPoi, types: typeArr.join()}]);

            if (typeArr.includes('demage_demage')) {
                this.updateParam(['geologicHazard', { status: true }])
            } else {
                this.updateParam(['geologicHazard', { status: false }])
            }
        },

        /**
         * 外部选中左侧面板
         */
        controlSelectPoi(poiArr, status) {
            poiArr.forEach((poi) => {
                this.select(null, poi, status);
            })
        },

        /**
         * 判断该poi是否有数据,给元素的dataNull赋值，true无数据，false有数据， 无数据->文字灰色
         */
        isDataNull() {
            utils.GET(`${sysconfig.TESTPATH}/basedata/listPoiType`, {code: this.code}).then((json) => {
                if (json.status === 0) {
                    let list = json.data.poiTypeList;
                    let pois = this.pois;

                    list = list.map(item => item.replace(/_/g, ''))

                    for (let key in pois) { // info、goods、power、place
                        let data = pois[key].data;
                        for (let poiKey in data) {
                            const [ lone, ltwo, lthree ] = poiKey.split('_');
                            if (data[poiKey].child) {
                                let childArr = data[poiKey].child;
                                for (let child in childArr) {
                                    const [ lone, ltwo, lthree, lfour ] = poiKey.split('_');
                                    childArr[child].dataNull = !this.checkAforB(BI.poiTypes[lone][ltwo][lthree][lfour], list)
                                }
                            } else {
                                data[poiKey].dataNull = !this.checkAforB(BI.poiTypes[lone][ltwo][lthree], list)
                            }
                        }
                    }
                    // 地质灾害单独处理
                    if (!this.pois.info) {
                        return;
                    }
                    let demage = this.pois.info.data.pois_info_geologicHazard;
                    if (demage) demage.dataNull = !list.includes('demage_demage');
                    // 山洪沟
                    let mountainTorrents = this.pois.info.data.pois_info_mountainTorrents;
                    if (mountainTorrents) mountainTorrents.dataNull = false;
                    this.pois = Object.assign({}, this.pois);
                }
            })
        },

        /**
         * 判断A中的某个元素是否在B中
         */
        checkAforB(A, B) {
            for (let i in A) {
                if (B.includes(A[i])) return true;
            }
            return false;
        },

        setScroll(type) {
            /* eslint-disable */
            if (this[type + 'Ps']) {
                this[type + 'Ps'].update();
            } else {
                this[type + 'Ps'] = new PS('.' + type, {
                    swipeEasing: true
                });
            }
        },

        getLiveThingTime: function () {
            const date = this.sysTime
            const prevDate = new Date(this.sysTime.getTime() - 1000 * 60 * 60)

            return TU(prevDate).format('YYYY年MM月DD日HH时') + ' - ' +
                TU(date).format('YYYY年MM月DD日HH时')
        },

        getShipTime: function () {
            const date = new Date(this.sysTime.getTime() + 1000 * 60 * 60)
            const prevDate = this.sysTime;

            return TU(prevDate).format('YYYY年MM月DD日HH时') + ' - ' +
                TU(date).format('YYYY年MM月DD日HH时')
        },
        /*
         * 更新水库相关的类型
         * 
         * @param {string[]} types 待筛选的类型
         * @param {string} deptType 部门类型
         * @param {boolean} status 部门目标状态
         */
        updateReservoirTypes: function (types, deptType, status) {
            const originalTypes = Array.from(types)

            if (Object.values(this.deptments).every(dept => dept.status === false)) {
                this.updateParam(['reservoirsSWJ', { type: '' }])
                this.updateParam(['SOUTHRESERVOIR', { type: '' }])
                this.typesByDept = {}
                return originalTypes
            }
            // 以下只涉及基础数据的勾选，不影响实时观测的数据
            if (!(deptType in this.typesByDept)) {
                this.typesByDept[deptType] = originalTypes
            }

            if (!status) {
                delete this.typesByDept[deptType]
            }

            let allTypes = []

            Object.values(this.typesByDept).forEach((types) => {
                allTypes.push(...types)
            })
            allTypes = Array.from(new Set(allTypes))

            const reservoirTypes = []

            let shuikuIdx = allTypes.findIndex(type => type.includes('SHUIKU'))

            while (shuikuIdx >= 0) {
                reservoirTypes.push(allTypes.splice(shuikuIdx, 1)[0])
                shuikuIdx = allTypes.findIndex(type => type.includes('SHUIKU'))
            }

            let reservoirIdx = allTypes.findIndex(type => type.includes('RESERVOIR'))

            while (reservoirIdx >= 0) {
                reservoirTypes.push(allTypes.splice(reservoirIdx, 1)[0])
                reservoirIdx = allTypes.findIndex(type => type.includes('RESERVOIR'))
            }

            const swjIndex = reservoirTypes.findIndex(type => type.includes('SWJ'))
            
            if (swjIndex >= 0) {
                this.updateParam(['reservoirsSWJ', { type: reservoirTypes.splice(swjIndex, 1)[0] }])
            }

            if (reservoirTypes.length > 0) {
                this.updateParam(['reservoirs', { type: reservoirTypes.join(',') }])
            }
        }
    },
    mounted() {
        this.initConstData();
        // 测试外部控制
        // this.controlSelectPoi([ 'monitor_monitor_typhoon', 'pois_info_passengerStation' ], true)
    },
    destroyed() {

    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

// .icon-chose {
//     position: absolute;
//     top: 0;
//     right: 0;
// }
// .icon-chose:before {
//     position: absolute;
//     right: -6px;
//     top: -2px;
// }
.ps__thumb-y {
    background: #999 !important;
}
.showButton {
    position: absolute;
    right: 0;
    top: 50%;
    margin-top: -25px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 16px;
    height: 50px;
    cursor: pointer;
    background: #ecf2fc;

    &::before {
        font-size: 16px;
    }
}
.base-info {
    position: fixed;
    top: 56%;
    left: 1px;
    transform: translateY(-50%);
    background: #fff;
    box-shadow: @shadow;

    &:hover {
        .panel {
            box-shadow: @hover-shadow;
        }
    }
    .modules {
        position: relative;
        z-index: @panel-index;
        width: 32px;
        height: 100%;
        flex-direction: column;
        float: left;
        display: flex;
        box-sizing: border-box;
        border-top: 1px solid #ccc;
        // border-bottom: 1px solid #ccc;
        background-color: #fff;

        .bar-item {
            position: relative;
            flex: 1 1 0;
            justify-content: center;
            align-items: center;
            text-align: center;
            border-bottom: 1px solid #ccc;
            border-right: 1px solid #ccc;
            background: @title-color;
            clear: both;
            cursor: pointer;
            text-align: center;
            border-left: 0;
            &:last-child {
                border-bottom: 1px solid @title-color;
            }
            &.select {
                background: #fff;
                border-right: 1px solid #fff;
            }
            span {
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY( -50% );
                display: inline-block;
                width: 100%;
                // padding: 0 10%;
                box-sizing: border-box;
            }
        }
    }
    .panel {
        position: absolute;
        left: 32px;
        z-index: @panel-index - 1;
        height: 100%;
        background: #fff;
        border: 1px solid #ddd;
        border-left: 0;
        transition: transform .3s, box-shadow .3s;
        // border-top: 0;
        box-shadow: @shadow;
        box-sizing: border-box;

        &.ExhibitionEnd {
            transform: translateX(-332px);
        }
    }
    .select-all {
        position: absolute;
        right: 3px;
        bottom: -6px;
        cursor: pointer;
        color: #1f7ed0;

        &.dept-select-all {
            bottom: 2px;
        }
        &:hover {
            color: #000;
        }
    }
    .detail {
        position: relative;
        // float: left;
        // overflow: hidden;
        height: 100%;
        background: #fff;

        .pois-list {
            position: relative;
            min-height: calc(~"100% - 8px");
        }

        ul li:nth-last-child(1).part {
            border-bottom: none;
        }
        .part {
            background-color: #fff;
            width: 230px;
            margin: 0 6px 0 12px;
            display: table;
            border-bottom: 1px solid #e5e8ec;
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
                padding: 3px;
                display: table-cell;
                vertical-align: middle;
                li {
                    position: relative;
                    display: inline-block;
                    padding: 6px 8px;
                    line-height: 16px;
                    font-family: "Microsoft Yahei";

                    &.no-data, &.no-data:hover {
                        // color: #bfbfbf;
                        color: #c0c0c0;
                    }
                    &:hover {
                        color: @select-font-color;
                    }
                }
            }
        }

        &.pois .part:nth-last-child(2) {
            border-bottom: none;
        }

        &.monitor {
            // overflow: hidden;
            .part ul li {
                line-height: 21px;
                padding: 4px 8px;
            }
            .monitor {
                background: url("../../assets/img/minbase/a5.png") no-repeat center center;
            }
            .river {
                background: url("../../assets/img/minbase/a8.png") no-repeat center center;
            }
            .detection {
                background: url("../../assets/img/minbase/a6.png") no-repeat center center;
            }
            .video {
                background: url("../../assets/img/minbase/a7.png") no-repeat center center;
            }
            .traffic {
                background: url("../../assets/img/minbase/a9.png") no-repeat center center;
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
                        right: -2px;
                        top: -1px;
                    }
                }
                &:after {
                    content: "";
                    display: inline-block;
                    position: absolute;
                    left: 0;
                    bottom: -2px;
                    background: #FFFFFF;
                    width: 52px;
                    height: 3px;
                    z-index: @panel-index;
                }
                .box {
                    position: absolute;
                    width: 241px;
                    float: left;
                    overflow: hidden;
                    background: #fff;
                    left: -112px;
                    margin-top: 3px;
                    z-index: @panel-index;
                    ul {
                        border: 1px solid #b3b3b3;
                        width: 241px;
                        box-sizing: border-box;
                    }
                }
            }
        }

        &.deptments {
            ul {
                position: relative;
                min-height: calc(~"100% - 8px");
                margin-left: 12px;
                width: 236px;
                .select-all {
                    position: absolute;
                    bottom: 0px;
                    width: 100%;
                    text-align: right;
                    margin: 0px;                    
                }
                li {
                    position: relative;
                    width: 36px;
                    text-align: center;
                    display: inline-block;
                    margin: 8px 10px;
                }
            }
            .logo {
                position: relative;
                width: 32px;
                height: 32px;
                margin: auto;
                &:before {
                    right: -6px;
                }
            }
            .water {
                background: url("../../assets/img/minbase/07.png") no-repeat center;
            }
            .forestry {
                background: url("../../assets/img/minbase/04.png") no-repeat center;
            }
            .powered {
                background: url("../../assets/img/minbase/03.png") no-repeat center;
            }
            .safety_supervision {
                background: url("../../assets/img/minbase/16.png") no-repeat center;
            }
            .land {
                background: url("../../assets/img/minbase/06.png") no-repeat center;
            }
            .education {
                background: url("../../assets/img/minbase/11.png") no-repeat center;
            }
            .communication {
                background: url("../../assets/img/minbase/13.png") no-repeat center;
            }
            .maritime {
                background: url("../../assets/img/minbase/09.png") no-repeat center;
            }
            .environmental_protection {
                background: url("../../assets/img/minbase/05.png") no-repeat center;
            }
            .public_security {
                background: url("../../assets/img/minbase/15.png") no-repeat center;
            }
            .health {
                background: url("../../assets/img/minbase/14.png") no-repeat center;
            }
            .meteorological {
                background: url("../../assets/img/minbase/08.png") no-repeat center;
            }
            .civil_affairs {
                background: url("../../assets/img/minbase/02.png") no-repeat center;
            }
            .traffic {
                background: url("../../assets/img/minbase/12.png") no-repeat center;
            }
            .water_conservancy {
                background: url("../../assets/img/minbase/07.png") no-repeat center;
            }
            .three_anti {
                background: url("../../assets/img/minbase/01.png") no-repeat center;
            }
            .emergency_office {
                background: url("../../assets/img/minbase/office.png") no-repeat center;
            }
            .housing_construction {
                background: url("../../assets/img/minbase/build.png") no-repeat center;
            }
            .tourism {
                background: url("../../assets/img/minbase/lvyou.png") no-repeat center
            }
        }
    }

    .popDiv-ndata {
        position: absolute;
        width: 250px;
        height: 90px;
        background: #fff;
        left: 1800%;
        top: 40%;
        margin-top: -45px;
        box-shadow: 3px 0px 8px 0 rgba(0, 0, 0, 0.3);

        .box {
            line-height: 90px;
            font-size: 16px;
            text-align: center;
        }
    }
}

.big .base-info {
    top: 55%; // 62%; 57%
    .modules {
        width: 48px;
        ul li {
            padding: 60px 2px;
            width: 50px;
        }
    }
    .panel {
        left: 48px;
    }
    .detail {
        .part {
            width: 349px;
        }
    }
    .monitor .part ul li {
        padding: 11px;
    }
    .pois .part ul li {
        padding: 10px 16px;
    }
    .deptments ul li {
        margin: 22px 10px;
    }
    .deptments {
        ul {
            width: 355px;
            li {
                width: 68px;
                div.icon-chose::before {
                    right: -16px;
                    top: -8px;
                }
            }
        }
        .logo {
            width: 48px;
            height: 48px;
            background-size: auto 80%!important;
        }
    }
    
}
</style>
