<template>
    <div>
        <div class="emergency-library hover">
            <div class="librarys">
                <ul>
                    <li v-for="(item, type) of librarys" :key="type" :class="{ select: item.status }" @click="select(item)">
                        {{ item.text }}<span>({{ item.count }})</span>
                    </li>
                </ul>
            </div>
            <div class="library-files" v-if="(![ 'good', 'team' ].includes(last.type))">
                <div class="search-hd">
                    <div class="search-bg"></div>
                    <input type="text" class="search-input" v-model="search.text" @keyup.enter="searchText" @input="searchText" :placeholder="search.tip">
                    <!-- <span class="warn-msg">{{ search.tip }}</span> -->
                    <button class="search-button" :class="{ 'only-search': !search.status }" @click="searchText">搜索</button>
                    <button class="search-button" v-show="search.status" @click="clean">清除</button>
                </div>
                <div class="area clearfix">
                    <v-dropdown :list="area.prov.data" :tip="area.prov.tip" @select="selectArea" class="dropdown-lib"></v-dropdown>
                    <v-dropdown :list="area.city.data" :tip="area.city.tip" @select="selectArea" class="dropdown-lib"></v-dropdown>
                    <v-dropdown :list="area.county.data" :tip="area.county.tip" @select="selectArea" class="dropdown-lib"></v-dropdown>
                    <v-dropdown :list="area.event.data" :tip="area.event.tip" @select="selectEvent" class="dropdown-lib"></v-dropdown>
    <!--                 <v-select :list="area.prov.data" :tip="area.prov.tip" @select="selectArea"></v-select>
                    <v-select :list="area.city.data" :tip="area.city.tip" @select="selectArea"></v-select>
                    <v-select :list="area.county.data" :tip="area.county.tip" @select="selectArea"></v-select>
                    <v-select :list="area.event.data" :tip="area.event.tip" @select="selectEvent"></v-select> -->
                </div>
                <div class="files">
                    <table>
                        <thead v-if="([ 'plan', 'case' ].includes(last.type))"><tr><td>标题</td><td>类别</td><td>行政区划</td></tr></thead>
                        <thead v-else-if="(last.type === 'law')" class="law"><tr><td>标题</td><td>行政区划</td></tr></thead>
                        <thead v-else-if="(last.type === 'expert')" class="expert"><tr><td>名称</td><td>级别</td><td>职称类型</td><td>应急类型</td></tr></thead>
                        <tbody class="files-table">
                            <tr v-for="(item, index) of files" :key="index" v-if="(((page.curr - 1) * page.count <= index) && (index < (page.curr * page.count)))" @click="selectItem(item)">
                                <template v-if="(last.type !== 'expert')">
                                    <td :title="item.title">{{ item.title }}</td><td v-if="(last.type !== 'law')" :title="item.typeCN">{{ item.typeCN }}</td><td :title="item.codeCN">{{ item.codeCN }}</td>
                                </template>
                                <template v-else>
                                    <td :title="item.title">{{ item.title }}</td><td>{{ item.level }}</td><td :title="item.positionType">{{ item.positionType }}</td><td :title="item.typeCN">{{ item.typeCN }}</td>
                                </template>
                            </tr>
                        </tbody>
                    </table>
                    <ul class="page-control">
                        <li>第{{ page.curr }}页/共{{ page.sum }}页 {{ files.length }}条记录</li><li class="pageNext" @click="toPage('next')">下一页</li><li class="pagePre" @click="toPage('pre')">上一页</li>
                    </ul>
                </div>
            </div>

        </div>
        <div class="pdf" v-show="!!pdf.filePath" ref="pdf"> <!-- v-if更损耗性能，对于需要频繁切换的使用v-show -->
            <div class="title" :title="pdf.title" ref="pdf-drag">{{ pdf.title }}<a class="close" @click="closePDF()"></a></div>
            <div class="pdf-page" id="pdf_page">
                <!-- <div data-loader="circle" class="loading loading-default" v-show="pdf.status"></div> -->
                <iframe :src="pdf.filePath && '/static/pdf/web/viewer.html?filePath=' + pdf.filePath"></iframe>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import WinDrag from '../../utils/tools/WinDrag.js';
import Dropdown from '../Plugins/Dropdown';
import { BaseInfo as BI } from '../../utils/tools/BaseInfo.js'

export default {
    name: 'EmergencyLibrary',
    components: {
        'v-dropdown': Dropdown
    },
    data() {
        return {
            pdf: { title: null, filePath: null },
            librarys: {
                plan: { text: '预案库', type: 'plan', count: 0, status: false },
                case: { text: '案例库', type: 'case', count: 0, status: false },
                law: { text: '法规库', type: 'law', count: 0, status: false },
                expert: { text: '专家库', type: 'expert', count: 0, status: false },
                good: { text: '救援物资库', type: 'good', count: 0, status: false },
                team: { text: '救援队伍库', type: 'team', count: 0, status: false }
            },
            files: [],
            area: {
                prov: { data: [{ text: '广东省', code: 44 }], tip: '广东省' },
                city: { data: [], tip: '选择市' },
                county: { data: [], tip: '选择县' },
                event: {
                    data: [
                        { text: '全部类型', value: '11000,12000,14000,19000,13000' },
                        { text: '自然灾害事件', value: '11000' },
                        { text: '事故灾难事件', value: '12000' },
                        { text: '公共卫生事件', value: '13000' },
                        { text: '社会安全事件', value: '14000' },
                        { text: '其它', value: '19000' }
                    ],
                    tip: '事件类型'
                }
            },
            page: { curr: 1, count: 10, sum: 1 },
            last: '',
            param: {
                code: 44,
                event: '11000,12000,14000,19000,13000', // 默认全部类型
                text: ''
            },
            search: {
                text: '',
                tip: '请输入标题关键字',
                status: false
            },
            administratorCode: '44'
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            areaCode: state => state.sys.code,
            updateFlag: state => state.sys.updateFlag,
            areaName: state => state.sys.areaName,
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    watch: {
        updateFlag(val) {
            this.param.code = this.areaCode;
            this.getAllcount();
            this.selectArea({ code: 44, text: '广东省' }, this.areaCode.length === 2 ? null : true);
        },
        areaCode(val) {
            // const len = val.length
            this.param.code = val + ''
            this.getAllcount();
            this.selectArea({ code: 44, text: '广东省' }, this.areaCode.length === 2 ? null : true);
            // if (len === 2) {
            //     this.selectArea({ text: '广东省', code: 44 })
            // } else if (len === 4) {
            //     console.log(this.area.city.data);
            //     const i = this.area.city.data.findIndex(ele => {
            //         return (ele.code === (val + ''))
            //     })
            //     if (i !== -1) this.selectArea(this.area.city.data[i])
            // } else {
            //     const i = this.area.county.data.findIndex(ele => {
            //         return (ele.code === (val + ''))
            //     })
            //     console.log(i);
            //     if (i !== -1) this.selectArea(this.area.county.data[i])
            // }
        },
        bigScreen(bool) {
            this.select(this.last);
            // this.page.count = bool ? 10 : 6;
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.urls = {
                findNameByAreaCode: sysconfig.TESTPATH + '/atwill/listAdministrativeName',
                count: sysconfig.TESTPATH + '/library/listLibraryCount',
                planList: sysconfig.TESTPATH + '/library/listPlanLibrary',
                caseList: sysconfig.TESTPATH + '/library/listCaseLibrary',
                lawList: sysconfig.TESTPATH + '/library/listLawLibrary',
                expertList: sysconfig.TESTPATH + '/library/listExpertLibrary'
            };
            this.param.code = `${this.areaCode}`;
            this.pois = {
                good: Object.keys(BI.poiTypes.pois.goods).map(item => 'pois_goods_' + item),
                team: Object.keys(BI.poiTypes.pois.power).map(item => 'pois_power_' + item)
            };
            this.getAllcount()
        },

        /**
         * 返回所有库条数
         */
        getAllcount() {
            const materialTypes = 'EMERGENCY_CIVIL,EMERGENCY_THREE,EMERGENCY_WATER,SJZX_EMERGENCY_POLICE,SJZX_EMERGENCY_HOMELAND,EMERGENCY_FORESTRY,SJZX_EMERGENCY_ENVIRONMENTAL,EMERGENCY_MSA,SJZX_EMERGENCY_SAFETY,SJZX_EMERGENCY_ELECTRIC';
            const teamTypes = 'SJZX_RESCUE_ELECTRIC,RESCUE_COMM,RESCUE_MEDICAL,SJZX_RESCUE_TRAFFIC,RESCUE_VILLAGE,SJZX_RESCUE_SEA,SJZX_RESCUE_FIRE';
            const eventTypes = '11000,12000,14000,19000,13000';
            utils.GET(this.urls.count, { code: this.param.code, materialTypes, teamTypes, eventTypes, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') }).then(json => {
                let count = json.data
                this.librarys.plan.count = count['countPlan'];
                this.librarys.case.count = count['countCase'];
                this.librarys.law.count = count['countLaw'];
                this.librarys.expert.count = count['countExpert'];
                this.librarys.good.count = count['countMaterials'];
                this.librarys.team.count = count['countTeam'];
            });
        },
        /**
         * 数据分页
         * @param {string} type 上、下一页
         */
        toPage(type) {
            let page = this.page.curr;
            page = type === 'next' ? page + 1 : page - 1;
            page = page <= 0 ? 1 : page;
            page = page >= this.page.sum ? this.page.sum : page;
            this.page.curr = page;
        },

        /**
         * 根据区域编码动态赋值
         * @param {array} data 区域信息
         * @param {string} item 父区域信息
         */
        setAreaData(data, item) {
            this.param.code = `${item.code}`;
            if (item.code.length === 2) {
                this.area.city = { data: data, tip: '选择市' };
                this.area.county = { data: [], tip: '选择县' };
                this.area.town = { data: [], tip: '选择镇' };
            } else if (item.code.length === 4) {
                this.area.county = { data: data, tip: '选择县' };
                this.area.city.tip = item.text;
            } else {
                this.area.county.tip = item.text;
            }
            this.select(this.last);
        },

        selectEvent(param) {
            this.param.event = `${param.value}`;
            this.select(this.last);
        },

        /**
         * 选择区域获取下一级区域信息
         * @param {string} item 区域信息
         * @param {Boolean} num 是否请求下一级
         */
        selectArea(item, num) {
            let t = {};
            utils.GET(this.urls.findNameByAreaCode, { code: item.code, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') }).then(json => {
                this.administratorCode = item.code;
                const len = json.data.code.length;
                t.code = json.data.code;
                if (len === 2) {
                    t.code = json.data.code;
                    t.codeCN = '选择市';
                } else if (len === 4) {
                    t.code = json.data.code;
                    t.codeCN = '选择县';
                }
                if (Object.keys(t).length) {
                    json.data.next.unshift(t);
                }
                this.formatCodeCN(json.data.next);
                this.setAreaData(json.data.next, { code: item.code + '', text: json.data.codeCN });
                if (!!num) {
                    if (this.areaCode.length === 6 && len !== 4) {
                        this.selectArea({code: this.areaCode.slice(0, 4)}, true);
                    } else {
                        this.selectArea({code: this.areaCode}, false);
                    }
                }
            });
        },
        formatCodeCN(data) {
            data.forEach(ele => {
                ele.text = ele.codeCN;
            });
        },
        /**
         * 选择某种类型
         * @param {object} item 类型对象
         */
        select(item) {
            let last = this.last.type;
            this.page.count = !this.bigScreen ? 10 : 6;
            if (this.librarys[last] && last !== item.type) this.librarys[last].status = false;
            if (['good', 'team'].includes(item.type)) {
                item.status = !item.status;
                if (['good', 'team'].includes(last)) {
                    if (last === item.type) {
                        if (item.status) {
                            this.updateParam(['baseInfo', { status: 'pois', poiStatus: item.status, poi: this.pois[last] }]);
                        } else {
                            this.updateParam(['baseInfo', { status: false, poiStatus: item.status, poi: this.pois[last] }]);
                        }
                    } else {
                        this.updateParam(['baseInfo', { status: 'pois', poiStatus: false, poi: this.pois[last] }]);
                        let call = setTimeout(() => {
                            this.updateParam(['baseInfo', { poiStatus: item.status, poi: this.pois[item.type] }]);
                            clearTimeout(call);
                        }, 500);
                    }
                } else {
                    this.updateParam(['baseInfo', { status: 'pois', poiStatus: item.status, poi: this.pois[item.type] }]);
                }
            } else {
                if (['good', 'team'].includes(last)) this.updateParam(['baseInfo', { poiStatus: false, poi: this.pois[last] }]);
                item.status = true;
                let param = { code: this.administratorCode, dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'), searchValue: this.param.text };
                param.libraryClassify = this.param.event;
                utils.GET(this.urls[item.type + 'List'], param).then(json => {
                    this.files = json.data.resp;
                    for (var i in this.files) {
                        if (this.files[i].level === '0') {
                            this.files[i].level = '地市';
                        } else if (this.files[i].level === '1') {
                            this.files[i].level = '省级';
                        }
                        if (this.files[i].positionType === '0') {
                            this.files[i].positionType = '应急管理专家';
                        } else if (this.files[i].positionType === '1') {
                            this.files[i].positionType = '专家组专家';
                        }
                    }
                    this.page.curr = 1;
                    this.page.sum = Math.ceil(this.files.length / this.page.count);
                });
            }
            this.last = item;
        },

        selectItem(item) {
            const host = window.location.host;
            let url = host.includes('localhost') ? '10.148.10.208' : host
            // url = '10.148.16.53'
            this.pdf.name = encodeURI(encodeURI(`http://${url}/topic/little/swfFilePath${item.link.replace('.swf', '.pdf')}`));
            this.pdf.title = item.title;
            this.initPDF(this.pdf.name);
        },

        /**
         * 搜索
         */
        searchText() {
            // this.search.tip = '';
            if (!!this.lazyTimer) {
                window.clearTimeout(this.lazyTimer);
                this.lazyTimer = null;
            }
            this.lazyTimer = window.setTimeout(() => {
                const text = this.search.text;
                if (!!text.trim()) {
                    this.param.text = `${text}`;
                    this.search.status = true;
                    this.select(this.last);
                }
            }, 800);
        },

        /**
         * 清空搜索
         */
        clean() {
            this.search = { text: '', status: false, tip: '请输入标题关键字' };
            this.param.text = ``;
            this.select(this.last);
        },

        initPDF(PDFPath) {
            this.pdf.filePath = PDFPath;
            window.PDF_FILE_PATH = PDFPath;
        },

        closePDF() {
            this.pdf = { filePath: null, title: null };
        }
    },
    mounted() {
        WinDrag.init(this.$refs['pdf-drag'], this.$refs['pdf'], lmap.map);
        this.initConstData();
        this.select(this.librarys.plan);
        this.selectArea({ code: 44, text: '广东省' }, this.areaCode.length === 2 ? null : this.areaCode);
    },
    destroyed() {
        this.updateParam(['baseInfo', { status: false, poiStatus: false, poi: this.pois['good'].concat(this.pois['team']) }]);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.emergency-library {
    position: absolute;
    top: @top-normal;
    right: -6px;
    z-index: @panel-index;
    background: #fff;
    box-shadow: @shadow;
    width: 420px;
    .librarys {
        ul li {
            width: 30%;
            padding: 0 6px;
            text-align: left;
            display: inline-block;
            box-sizing: border-box;
            line-height: 26px;
            height: 26px;

            &:hover, &.select {
                color: @select-font-color;
            }
            & > span {
                margin-left: 2px;
                color: red;
            }
        }
    }
    .library-files {
        border-top: 2px solid rgba(221, 221, 221, 1);
        margin-bottom: 2px;

        .search-hd {
            height: 32px;
            background-color: @title-color;
            padding: 2px;
            position: relative;

            &:before {
                content: '';
                display: inline-block;
                height: 30px;
                width: 25px;
                position: absolute;
                left: 8px;
                z-index: 1;
                background: url(data:image/png;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wCEAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHB8fHx8fHx8fHx8BBwcHDQwNGBAQGBoVERUaHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fH//AABEIABAAEAMBEQACEQEDEQH/xABYAAADAQAAAAAAAAAAAAAAAAAAAwUIAQEAAAAAAAAAAAAAAAAAAAAAEAACAwEAAQUAAAAAAAAAAAABAhEDBAASMWGBIgURAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANK48lG6gatQNr2klVJMIJgKoHA/AXrv0ZSxeukoa2YyQrifEn2jgDgvrdjl0GmtyWasoHUE+pWYjgnMdn5Ow2WFtGTQw83j7Bvjg//Z) 0 8px no-repeat;
            }
            .search-bg {
                width: 330px;
                height: 32px;
                background-color: #fff;
                position: absolute;
                left: 2px;
                top: 2px;
            }
            .search-input {
                width: 77.8%;
                height: 32px;
                line-height: 32px;
                text-indent: 20px;
                border: 0;
                float: left;
                color: @font-color;
                position: relative;
                background: 0;
                margin-left: 10px;
                list-style-type: none;
                -webkit-text-size-adjust: none;
                outline: none;
            }
            .warn-msg {
                display: inline-block;
                padding: 2px 0;
                color: #999;
                position: absolute;
                left: 30px;
                top: 8px;
                height: 16px;
            }
            .search-button {
                height: 32px;
                line-height: 32px;
                border: 0;
                color: @font-color;
                background: 0 0;
                outline: 0;
                cursor: pointer;
                text-align: center;
                padding: 1px 4px;
                &.only-search {
                    width: 68px;
                }
            }
        }
        .files {
            .files-table {
                position: relative;
                overflow-y: hidden;
            }
            table {
                border-collapse: collapse;
                text-indent: 6px;
                text-align: left;

                tr {
                    display: table-row;
                    height: 22px;
                    line-height: 22px;

                    td {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        border-right: 1px solid #e0eaf5;
                        padding: 2px;

                        &:nth-child(1) {
                            width: 220px;
                            float: left;
                        }
                        &:nth-child(2) {
                            width: 70px;
                            float: left;
                        }
                        &:nth-child(3) {
                            width: 114px;
                        }
                    }
                }

                thead {
                    display: table-header-group;
                    tr {
                        height: 26px;
                        border-bottom: 1px solid #e0eaf5;
                        // line-height: 26px;w
                    }
                    &.law,
                    &.law + tbody {
                        td:nth-child(2) {
                            width: 190px;
                            float: left;
                        }
                    }
                    &.expert,
                    &.expert + tbody {
                        td:nth-child(1) {
                            width: 100px;
                        }
                        td:nth-child(2) {
                            width: 100px;
                        }
                        td:nth-child(3) {
                            width: 100px;
                        }
                        td:nth-child(4) {
                            width: 100px;
                        }
                    }
                }

                tbody {
                    display: table-row-group;
                    height: 270px;

                    tr {
                        border-bottom: 1px solid #e0eaf5;
                    }
                }
            }
        }
    }
    .page-control {
        text-align: left;
        margin-left: 4px;
        height: 24px;
        line-height: 24px;
        li {
            display: inline-block;
            &.pageNext {
                float: right;
                margin-left: 10px;
                cursor: pointer;
                margin-right: 5px;
            }
            &.pagePre {
                float: right;
                cursor: pointer;
            }
        }
    }

}

.pdf {
    position: fixed;
    top: calc(~'50% - 300px');
    left: calc(~'50% - 310px');
    // transform: translate(-50%, -50%);
    z-index: @pop-index;
    background: #fff;
    box-shadow: @shadow;
    width: 620px;
    .pdf-page {
        iframe {
            border: none;
            width: 100%;
            height: 600px;
        }
        position: relative;
        .loading:after {
            position: absolute;
            top: 45%;
            left: 45%;
            transform: translate(-50%, -50%);
            display: inline-block;
            width: 48px;
            height: 48px;
        }
        .page {
            margin: 10px 0;
            box-shadow: @shadow;
        }
    }
}

.big {
    .emergency-library {
        top: @top-big;
        width: 600px;

        .librarys {
            ul {
                li {
                    height: 26px;
                    line-height: 26px;
                }
            }
        }

        .search-hd {
            height: 50px;
            line-height: 50px;
            .search-bg {
                width: 490px;
                height: 50px;
            }
            .search-input {
                width: 80%;
                height: 50px;
                line-height: 50px;
                font-size: 17px;
            }
            &::before {
                top: 10px;
            }

            .only-search {
                font-size: @font-big;
            }
        }

        .library-files {
            .files {
                table {
                    text-indent: 6px;
                    tr {
                        height: 40px;
                        line-height: 40px;

                        td {
                            &:nth-child(1) {
                                width: 240px;
                                float: left;
                            }
                            &:nth-child(2) {
                                width: 150px;
                                float: left;
                            }
                            &:nth-child(3) {
                                width: 190px;
                            }
                        }
                    }

                    thead {
                        &.law,
                        &.law + tbody {
                            td:nth-child(1) {
                                width: 348px;
                                float: left;
                            }
                            td:nth-child(2) {
                                width: 240px;
                                float: left;
                            }
                        }
                        &.expert,
                        &.expert + tbody {
                            td:nth-child(1) {
                                width: 145px;
                            }
                            td:nth-child(2) {
                                width: 145px;
                            }
                            td:nth-child(3) {
                                width: 145px;
                            }
                            td:nth-child(4) {
                                width: 145px;
                            }
                        }
                    }

                    tbody {
                        height: 270px;
                    }
                }
            }
        }

        .page-control {
            height: 40px;
            line-height: 40px;
        }
    }
}
</style>
