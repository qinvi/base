<template>
    <div>
        <div :class="[ 'target-duty', { 'fullScreen': fullScreen, 'bigScreen': bigScreen } ]" ref="target-table-panel">
            <div class="title" ref="target-table-title">
                <span>POI责任人列表</span>
                <a class="close" @click="close()"></a>
            </div>
            <ul class="target-div tab-ul" ref="tabul-panel">
                <li v-for="(item, key) in tablist" :key="key">
                    <span :class="{ 'selected': curTab === item.value }" @click="selectTab(item.value)" :title="item.name">{{ item.name }}</span>
                </li>
            </ul>
            <div class="target-div content">
                <table :style="ulwidth" v-if="tableData.pois.length > 0">
                    <thead>
                        <tr>
                            <th v-for="(value, key) in tableData.title" :key="key" :title="value">{{ value }}</th>
                        </tr>
                    </thead>
                    <tbody :style="listHeight">
                        <tr v-for="(item, key) in tableData.pois" :key="key">
                            <td v-for="(value, key) in item" :key="key" :title="value">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
                <!-- <ul class="thead" :style="ulwidth">
                    <li>
                        <span v-for="(value, key) in tableData.title" :key="key" :title="value">{{ value }}</span>
                    </li>
                </ul>
                <ul class="tbody" v-if="tableData.pois.length > 0" :style="ulwidth">
                    <li v-for="(item, key) in tableData.pois" :key="key">
                        <span v-for="(value, key) in item" :key="key" :title="value">{{ value }}</span>
                    </li>
                </ul> -->
                <label v-else class="tip">无数据！</label>
            </div>
            <div class="target-div footer" ref="footer-panel">
                <div class="feature">
                    <span class="btn" @click="toFullScreen()">{{ fullScreen ? '返回' : '全屏' }}</span>
                    <span class="btn" @click="exportExcel()">导出</span>
                </div>
                <div class="page-helper" v-if="page">
                    <span class="page-text" v-if="page.pageText">当前显示第{{ page.pageText.start + 1 }}-{{ page.pageText.end }}条，共{{ page.total }}条</span>
                    <span class="page-text" v-else> 当前无数据记录！，共0条</span>
                    <span class="page-start btn" @click="selectPage(1)">首页</span>
                    <span class="page-pre btn" @click="selectPage(page.curPage - 1)">上一页</span>
                    <span class="page-list">
                        <span v-for="(index, key) in page.showPage" :key="key" @click="selectPage(index)" :class="{'selected': index === page.curPage}">[ {{ index }} ]</span>
                    </span>
                    <span class="page-next btn" @click="selectPage(page.curPage + 1)">下一页</span>
                    <span class="page-end btn" @click="selectPage(99999)">末页</span>
                </div>
            </div>
            <form method="POST" id="duty-forms" target="duty-forms" v-show="false" >
                <input type="hidden" :name="key" :value="item" v-for="(item, key, i) of inputForm" :key="i">
            </form>
            <iframe name='duty-forms' v-show="false"></iframe>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'targetTable',
    props: ['data'],
    components: {},
    data() {
        return {
            curTab: '',
            fullScreen: false,
            tableData: { title: {}, pois: [] },
            inputForm: {},
            page: { total: 0, p: 10, curPage: 1, pageText: null, showPage: [] },
            height: 0
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            pois: state => state.userSetting.pois,
            poiEnameMapping: state => state.userSetting.poiEnameMapping,
            code: state => state.sys.code,
            sysMinTime: state => state.time.sysMinTime,
            bigScreen: state => state.toolsBar.bigScreen,
            holder: state => state.hideAll.holder
        }),
        tablist() {
            let tablist = [];
            let head = '';
            this.data.typeSet.forEach(ele => {
                head = ele.includes('EMERGENCY') ? '应急物资_' : ele.includes('RESCUE') ? '救援力量_' : '';
                let name = this.poiEnameMapping[ele] ? (head + this.poiEnameMapping[ele].Name) : '--';
                tablist.push({ name: name, value: ele });
            });
            if (tablist.length > 0) this.curTab = tablist[0].value;
            return tablist;
        },
        ulwidth() {
            let width = Object.keys(this.tableData.title).length * 110 + 1;
            return 'width:' + width + 'px';
        },
        listHeight() {
            if (this.fullScreen) {
                // 计算列表高度
                this.$nextTick(() => {
                    this.panelHeight = this.$refs['target-table-panel'].offsetHeight;
                    this.tabulHeight = this.$refs['tabul-panel'].offsetHeight;
                    this.footerHeight = this.$refs['footer-panel'].offsetHeight;
                    this.titleHeight = this.$refs['target-table-title'].offsetHeight;
                    console.log(this.panelHeight);
                    this.height = this.panelHeight - this.tabulHeight - this.footerHeight - this.titleHeight - 76;
                })
                return 'height:' + this.height + 'px';
            } else {
                return 'height:auto';
            }
        }
    },
    watch: {
        curTab(val) {
            Object.assign(this.page, { total: this.data.totalNumMap[val], curPage: 1 });
            this.selectPage();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),

        initConstData() {
        },

        /**
         * @description 请求获取数据
         */
        requestData() {
            this.height = 0;
            let tableData = { title: {}, pois: [] };
            let param = { poiTypes: this.curTab, listMark: this.data.listMark, page: this.page.curPage, pageNum: this.page.p };
            let url = sysconfig.TESTPATH + '/atwill/getContactsList';
            utils.post(url, param).then((json) => {
                if (json.data && json.data.result && json.data.result[this.curTab]) {
                    let poiList = json.data.result[this.curTab][0].poiList;
                    let titles = json.data.result[this.curTab][0].titles[0];
                    Object.keys(titles).forEach(ele => {
                        let val = titles[ele];
                        if (val !== 'poiId') {
                            tableData.title[ele] = val;
                        }
                    });
                    let titleIndex = Object.keys(tableData.title);
                    poiList.forEach(poi => {
                        let obj = {};
                        titleIndex.forEach(index => {
                            obj[index] = utils.isEmptyString(poi[index]) ? '--' : poi[index];
                        });
                        tableData.pois.push(obj);
                    });
                }
                this.tableData = tableData;
            });
        },

        /**
         * @description 全屏
         */
        toFullScreen() {
            this.fullScreen = !this.fullScreen;
            if (this.fullScreen) Object.assign(this.page, { curPage: 1, p: 25 });
            if (!this.fullScreen) Object.assign(this.page, { curPage: 1, p: 10 });
            this.selectPage();
        },

        /**
         * @description 翻页
         */
        selectPage (page) {
            let maxPage = Math.ceil(this.page.total / this.page.p);
            if (!page) page = this.page.curPage;
            if (page > maxPage) page = maxPage;
            if (page < 1) page = 1;
            this.page.curPage = page;
            this.page.pageText = this.getPageText(this.page.total, this.page.p, this.page.curPage);
            this.page.showPage = this.getShowPage(this.page.total, this.page.p, this.page.curPage);
            this.requestData();
        },

        /**
         * @description 获取当前页数据的起、终位置
         */
        getPageText(total, p, curPage) {
            if (total === 0) {
                return null;
            }
            let start = curPage * p - p;
            let end = curPage * p < total ? curPage * p : total;
            return { start: start, end: end };
        },

        /**
         * @description 获取展示的页码
         */
        getShowPage(total, p, curPage) {
            const MAX_SHOW = 3;
            let showPage = [];
            let allPage = Math.ceil(total / p);
            let cursor = 1;
            showPage.push(curPage);
            while (showPage.length < MAX_SHOW && cursor < MAX_SHOW) {
                let next = curPage + cursor;
                if (next <= allPage && showPage.length < MAX_SHOW) {
                    showPage.push(next);
                }
                let pre = curPage - cursor;
                if (pre > 0 && showPage.length < MAX_SHOW) {
                    showPage.push(pre);
                }
                cursor++;
            }
            showPage = showPage.sort((i, j) => {
                return (i - j);
            });
            return showPage;
        },

        /**
         * @description 导出
         */
        exportExcel() {
            const { signTime, sign } = utils.generateAuthInfo();
            let dateTime = TU(this.sysMinTime).format('YYYY-MM-DD+HH:mm:ss');
            let url = 'signTime=' + signTime + '&sign=' + sign + '&code=' + this.code + '&dateTime=' + dateTime +
                    '&mark=' + this.data.mark;
            document.getElementById('duty-forms').action = sysconfig.TESTPATH + '/atwill/exportPoiList';
            let s;
            url.split('&').forEach((ele) => {
                s = ele.split('=');
                this.inputForm[s[0]] = s[1];
            });
            this.inputForm = Object.assign({}, this.inputForm, {});
            this.$nextTick(() => {
                document.getElementById('duty-forms').submit();
            });
        },

        selectTab(tab) {
            this.curTab = tab;
        },

        close() {
            this.$emit('close');
        }
    },
    mounted() {
        this.$nextTick(() => {
            WD.init(this.$refs['target-table-title'], this.$refs['target-table-panel'], lmap.map);
        });
        this.initConstData();
    },
    destroyed() {
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.target-duty {
    position: fixed;
    width: 1000px;
    top: calc(~'50% - 208px');
    left: calc(~'50% - 500px');
    box-shadow: @shadow;
    background: #fff;
    z-index: @pop-index + 100;

    .target-div {
        display: flex;
        display: -webkit-flex;
        margin: 10px 10px;
    }

    .tab-ul {
        flex-flow: row wrap;
        justify-content: flex-start;
        li {
            flex: 0 12%;
            overflow: hidden;
            padding: 5px 0;
            text-align: center;
            span {
                display: inline-block;
                height: 15px;                
                border-right: 1px solid #c2c2c2;
                display: inline-block;
                box-sizing: border-box;
                line-height: 15px;
                width: 100%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                &.selected {
                    color: @select-font-color;
                }
            }
        }
    }

    .content {
        flex-flow: column nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        // max-height: 75%;
        table {

            // border: 1px solid #c2c2c2;
			width: 100%;
			border-collapse:collapse;
            thead {
                th {
                    // width: 100px
                    background: #ecf2fc;
                    height: 26px;
                    border: 1px solid #c2c2c2; 
                    // border-bottom: none;
                }
            }
            tbody {
                // height: 500px;
                overflow-y: auto;
            }
            td,th {
                box-sizing: border-box;
                // width: 100px;
               
                min-width: 110px;
                max-width: 110px;
                border: 1px solid #c2c2c2; 
                border-top: none;
                overflow:hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            tr {
                height: auto;
            }
        }
        .tbody {
            overflow-y: auto;
            // overflow-x: hidden;
            // width: 100%;
        }

        li {
            display: flex;
            display: -webkit-flex;
            justify-content: space-between;
            line-height: 16px;
            text-align: left;
            &:hover {
                background: @title-color;
                cursor: pointer;
            }
        }

        span {
            flex: 100%;
            overflow:hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            padding: 5px 0;
            min-width: 100px;
            max-width: 150px;
            border: 1px solid #c2c2c2;
        }

        .tip{
            color: red;
            height: 20px;
            text-align: center;
        }
    }

    .footer {
        width: calc(~'100% - 10px * 2');
        justify-content: space-between;
        .page-helper {
            .page-list span {
                cursor: pointer;
                &.selected {
                    color: @select-font-color;
                }
            }
        }
    }

    &.fullScreen {
        position: fixed;
        top: 30px!important;
        padding: 0;
        left: 0!important;
        width: calc(~'100%');
        height: calc(~'100% - 30px');
        z-index: @pop-index + 100;

        .content {
            // max-height: 80%;
        }
        .footer {
            // position: fixed;
            // bottom: 0px;
        }
    }

    &.bigScreen {
        width: 1200px;
        left: calc(~'50% - 600px');

        .content .tip{
            height: 30px;
        }
        &.fullScreen {
            top: 45px!important;
            padding: 0;
            left: 0!important;
            width: 100%!important;
            height: calc(~'100% - 45px');
        }
    }
}
.big {
    .target-duty .tab-ul li span{
        height: 26px;
        line-height: 26px;
    }
}



</style>
