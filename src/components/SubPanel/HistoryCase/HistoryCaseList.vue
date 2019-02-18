<template>
    <div class="case-list">
        <div class="key-word">
            <div class="search">
                <div class="search-box">
                    <i class="icon-toolsbar-globalSearch"></i>
                    <input type="text" class="search-input" placeholder="请输入案例名称" v-model="keyWord"/>
                </div>
                <div class="search-btn">
                    <div @click="casesLoad">搜索</div>
                    <div v-if="false" @click="caseNew">清除</div>
                </div>
            </div>
            <label class="btn confirm new" @click="caseNew">新建</label>
        </div>
        <div class="filter">
            <div class="year">
                <label>年份：</label>
                <v-dropdown :list="yearMap.list" :tip="yearMap.tip" class="dropdown-export-list" @select="yearSelect"></v-dropdown>
            </div>
            <div class="types">
                <label>类型：</label>
                <ul>
                    <li @click="selectType('all')">
                        <input type="checkbox" class="checkbox" id="caseTypeAll" value="all" v-model="types.status"/>
                        <label for="caseTypeAll">全选</label>
                    </li>
                    <li v-for="(item, index) of types.data" :key="index" @click="selectType('part', item)">
                        <input type="checkbox" class="checkbox" name="caseType" v-model="types.select" :value="item.value" :id="'caseType-' + item.value"/>
                        <label @click.stop :for="'caseType-' + item.value">{{ item.text }}</label>
                    </li>
                </ul>
            </div>
            <div class="list">
                <table slot="page-list" cellpadding="0" cellspacing="0">
                    <thead><tr><td>序号</td><td>案例名称</td><td>案例类型</td><td>开始时间</td><td>结束时间</td><td>操作</td></tr></thead>
                    <tbody>
                        <tr v-for="(item, index) of list" :key="index" v-if="(index >= page.start) && (index < page.end)" @click="caseLoad(item.id)">
                            <td>{{ index + 1 }}</td>
                            <td>{{ item.title }}</td>
                            <td>{{ item.type }}</td>
                            <td>{{ item.startTime }}</td>
                            <td>{{ item.endTime }}</td>
                            <td class="todo-btn">
                                <div :class="{ 'btn-disabled': isGuestUser }" @click.stop="caseModify(item.id)">修改</div>
                                <div :class="{ 'btn-disabled': isGdtUser }" @click.stop="caseConfirmDelete(item.id)">删除</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <v-page :page="page" @toPage="updatePage"></v-page>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import Dropdown from '@/components/Plugins/Dropdown'
import Page from '@/components/Plugins/Page'

export default {
    name: 'History-Cases',
    props: [ 'reload' ],
    components: { 'v-dropdown': Dropdown, 'v-page': Page },
    data() {
        return {
            types: {
                all: [ '11000', '12000', '14000', '19000', '13000' ],
                status: [ 'all' ],
                data: [
                    { text: '自然灾害事件', value: '11000' },
                    { text: '事故灾难事件', value: '12000' },
                    { text: '公共卫生事件', value: '13000' },
                    { text: '社会安全事件', value: '14000' },
                    { text: '其它', value: '19000' }
                ],
                select: [ ]
            },
            list: [],
            yearMap: {
                tip: '全部',
                list: [ ]
            },
            keyWord: '',
            page: {
                curr: 1,
                sum: 1,
                count: 10,
                start: 0,
                end: 10
            }
        };
    },

    computed: {
        ...mapState({
            code: state => state.sys.code,
            userId: state => state.userSetting.userId,
            userName: state => state.userSetting.userName,
            pendingPool: state => state.loadingIndicator.pendingPool
        }),
        isGuestUser: function () {
            return this.userName.includes('guest');
        },
        isGdtUser: function () {
            return this.userName !== 'gduser';
        }
    },
    watch: {
        code() {
            this.casesLoad();
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        initConstData() {
            this.param = { year: 'all', type: null };
            this.urls = {
                list: sysconfig.TESTPATH + '/historyCase/info',
                delete: sysconfig.TESTPATH + '/historyCase/delete'
            };
        },

        casesLoad() {
            const type = this.types.select.join(',');
            const value = { code: this.code, searchValue: this.keyWord, type, page: 1, onePageNum: 999 };
            let time = {};
            if (this.param.year !== 'all') {
                time = { startTime: this.param.year + '-01-01 00:00:00', endTime: this.param.year + '-12-31 23:59:59' };
            }
            const param = Object.assign(value, time);
            this.pendingPool.push({ id: 'history-case-list' });
            utils.get(this.urls.list, param).then((json) => {
                this.list = json.data.resp;
                const page = { curr: 1, num: 10, length: this.list.length };
                this.page = utils.calcPage(page);
                this.updateParam(['loadingIndicator', { sigCancel: 'history-case-list' }]);
            }).catch((ex) => {
                this.updateParam(['loadingIndicator', { sigCancel: 'history-case-list' }]);
            });
        },

        caseNew() {
            this.$emit('caseModel', { new: false, status: true, id: -1 });
        },

        caseLoad(id) {
            this.$emit('caseModel', { new: true, status: true, id });
        },

        caseModify(id) {
            if (this.isGuestUser) return
            this.$emit('caseModel', { new: false, status: true, id });
        },

        caseDelete(id) {
            const param = { code: this.code, id, userId: this.userId };
            utils.get(this.urls.delete, param).then((json) => {
                if (json.data.message === 'success') {
                    this.updateParam([ 'sysTip', { status: true, text: '删除成功！', type: 'success' } ]);
                    this.casesLoad();
                }
            })
        },

        caseConfirmDelete(id) {
            if (this.isGuestUser) return
            if (this.userName === 'gduser') {
                this.updateParam([ 'sysTip', { status: true, text: '是否确定删除？', type: 'confirm', call: confirm } ]);
            } else {
                this.updateParam([ 'sysTip', { status: true, text: '游客账号不能删除！', type: 'info' } ]);
            }
            const that = this;
            function confirm() {
                return that.caseDelete(id);
            }
        },

        yearInit() {
            const list = [{ text: '全部', value: 'all' }];
            const year = Number(TU().format('YYYY'));
            for (let i = 0; i < 8; i++) {
                list.push({ text: (year - i) + '年', value: year - i });
            }
            this.yearMap.list = list;
        },

        yearSelect(param) {
            this.param.year = param.value;
        },

        /**
         * 选中类型
         * @param {string} type 类型
         * @param {object} item 等级对象
         */
        selectType(type, item) {
            if (type === 'all') {
                const status = (this.types.status[0] !== 'all');
                if (status) {
                    this.types.select = [];
                }
                // this.types.select = status ? [...this.types.all] : [];
            } else if (type === 'part') {
                this.types.status = [];
                // const status = this.types.select.indexOf(item.value) !== -1;
                // if (status) {
                //     this.types.status.splice(0, 1);
                // } else {
                //     if (this.types.select.length !== 0 && (this.types.select.length + 1 === this.types.all.length)) {
                //         this.types.status.push('all');
                //     }
                // }
            }
        },

        updatePage(page) {
            this.page = page;
        }

    },

    mounted: function() {
        this.initConstData();
        this.casesLoad();
        this.yearInit();
    },

    destroyed: function() {

    }

};
</script>

<style scoped lang='less'>
@import '../../../assets/css/common.less';
.case-list {
    width: 700px;

    .key-word {
        position: relative;
        left: -6px;
        .search {
            display: inline-block;

            .search-box {
                display: inline-block;
                position: relative;

                margin: 10px;
                margin-right: 0;
                .search-input {
                    .height(30px);
                    width: 526px;
                    border: 2px solid @title-color;
                    text-indent: 30px;
                    &:focus {
                        outline: 2px solid @title-color;;
                        border: 2px solid @title-color;;
                    }
                }
                i {
                    position: absolute;
                    top: 6px;
                    left: 4px;
                    font-size: 24px;
                }
            }

            .search-btn {
                display: inline-block;
                position: relative;
                left: -4px;
                background-color: @title-color;
                div {
                    cursor: pointer;
                    display: inline-block;
                    width: 60px;
                    .height(36px);
                }
            }
        }

        .new {
            display: inline-block;
            .height(36px);
            width: 80px;
        }

    }

    .filter {
        .year {
            position: relative;
            left: 14px;
            label {
                float: left;
            }
        }
        .types {
            display: inline-block;
            label {
                display: inline-block;
            }
            ul {
                display: inline-block;
                li {
                    display: inline-block;
                    .checkbox:checked + label::after {
                        top: 9px;
                    }
                }
            }
        }
        .list {
            width: 100%;
            height: 100%;
            background: #fff;
            table-layout: fixed;
            margin-top: 10px;

            .todo-btn {
                div {
                    display: inline-block;
                    margin-right: 8px;
                }

                .btn-disabled {
                    color: #aaa;
                    cursor: not-allowed;
                }
            }

            table {

                thead {
                    display: table-header-group !important;
                    table-layout: fixed;
                }

                tbody {
                    max-height: 90%;
                    height: auto;
                    table-layout: fixed;
                    border-bottom: 1px solid #E5E8EC;
                    display: table-footer-group;

                    tr {
                        width: 100%;
                        border-bottom: 1px solid #e0eaf5;
                        cursor: pointer;
                        &:nth-child(2n) {
                            background: #ecf2fc;
                        }
                    }

                    tr:hover {
                        background: @title-color;
                        cursor: pointer;
                    }
                }

                tr {
                    .height();
                    display: table-row !important;
                }

                td {
                    border: 0;
                    height: 26px;
                    line-height: 26px;
                    text-align: center;
                    word-break: break-all;
                    border-bottom: 1px solid #E5E8EC;
                    border-right: 1px solid #E5E8EC;
                }

            }

            td:nth-child(1) {
                width: 5%
            }
            td:nth-child(2) {
                width: 25%
            }
            td:nth-child(3) {
                width: 15%
            }
            td:nth-child(4), td:nth-child(5) {
                width: 20%
            }

        }
    }

    table {
        color: @font-color;
        border-spacing: 0px;
        table-layout: fixed;
        text-align: center;
        width: 100%;

        thead {
            background: @title-color;
            display: table-header-group !important;
            table-layout: fixed;
            width: 100%;
            display: block;
            tr {
                display: block;
            }
        }

        tbody {
            overflow-y: scroll;
            overflow-x: hidden;
            max-height: 90%;
            height: auto;
            width: 100%;
            table-layout: fixed;
            border-bottom: 1px solid #E5E8EC;
            display: table-footer-group;

            position: relative;

            tr {
                width: 100%;
                border-bottom: 1px solid #e0eaf5;
                cursor: pointer;
                &:nth-child(2n) {
                    background: #ecf2fc;
                }
            }

            tr:hover {
                background: @title-color;
                cursor: pointer;
            }
        }

        tr {
            .height();
            display: table-row !important;
        }

        td {
            border: 0;
            height: 26px;
            line-height: 26px;
            text-align: center;
            word-break: break-all;
            border-bottom: 1px solid #E5E8EC;
            border-right: 1px solid #E5E8EC;
        }
    }
}

.big {
    .case-list {
        width: 1010px;
        .key-word {
            .search {
                .search-box {
                    i {
                        top: 14px;
                        left: 6px;
                    }
                    .search-input {
                        height: 39px;
                        line-height: 39px;
                        width: 800px;
                        font-size: 20px;
                    }
                }
                .search-btn {
                    left: -6px;
                }
            }
            .new {
                height: 45px;
                line-height: 42px;
            }
        }
        .filter {
            .types {
                .checkbox:checked + label::after {
                    top: 15px;
                }
            }
            .list {
                tr {
                    .height(36px);
                }
                td:nth-child(4), td:nth-child(5) {
                    width: 21%;
                }
            }
        }
    }
}

</style>
