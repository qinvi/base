<template>
    <div class="water-panel">
        <div class="water-interaction">
            <span class="setRight" @click="setPage(true)">&gt;&gt;</span>
            <span class="setRight" @click="setPage(false)">&lt;&lt;</span>
        </div>
        <div :class="['water-list', bigScreen?'bigWidth':'']">
            <table>
                <thead>
                    <tr>
                        <td v-for="value in title">{{ value }}</td>
                    </tr>
                </thead>
                <tbody id="water-tbody">
                    <tr v-for="(item, index) in waterItems" v-if="(index >= startPage && index < endPage)">
                        <td v-for="(value, key) in title">{{ key === 'site' ? item[key]['title'] : item[key]  }}</td>
                    </tr>
                </tbody>
            </table>
            <div class="nodata" v-if="!waterItems[0]">暂无数据</div>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapState } from 'vuex';
    import PS from 'perfect-scrollbar';
    import 'perfect-scrollbar/css/perfect-scrollbar.css';

    export default {
        data() {
            return {
                time: null,
                title: {no: '站点号', site: '站点名称', waterLevel: '水位'},
                waterItems: [],
                startPage: 0,
                endPage: 10,
                url: sysconfig.TESTPATH + '/realTimeMonitor/listSiteWaterCount'
            }
        },
        computed: {
            ...mapState({
                sysCode: state => {
                    let code = state.sys.code;
                    if (code.length < 6) code += '0000';
                    else if (code.length < 4) code += '00';
                    return code;
                },
                bigScreen: state => state.toolsBar.bigScreen
            })
        },
        watch: {
            sysCode() {
                this.getWaterList();
            }
        },
        methods: {
            ...mapActions(['updateParam']),
            initTime() {
                let wholeTime = new Date(TU(new Date()).format('YYYY-MM-DD HH:00:00'));
                this.time = TU(TU(wholeTime).split()).format('YYYY-MM-DD HH:mm:ss');
            },
            setPage(state) {
                let startPage = this.startPage;
                let endPage = this.endPage;
                let len = this.waterItems.length;
                if (state) {
                    startPage += 10;
                    endPage += 10;
                    if (((len - endPage) % 10) >= 0 && ((len - endPage) % 10) < 1) {
                        endPage = len;
                    }
                    if (startPage >= len) {
                        return;
                    }
                } else {
                    if (startPage <= 0) {
                        return;
                    }
                    startPage -= 10;
                    endPage -= 10;
                }
                this.startPage = startPage;
                this.endPage = endPage;
            },
            getWaterList() {
                let param = {
                    code: this.sysCode,
                    dateTime: this.time
                }
                utils.GET(this.url, param).then((json) => {
                    let {data} = json;
                    if (!data) return;
                    let {list} = data;
                    this.waterItems = list;
                });
            },
            newPsScroller() {
                 /* eslint-disable */
                new PS('#water-tbody');
            }
        },
        mounted() {
            this.initTime();
            this.getWaterList();
            this.newPsScroller();
        }
    }
</script>

<style lang='less'>
    @import "../../assets/css/common.less";

    .water-panel {
        position: relative;

    }
    .water-interaction {
        position: absolute;
        top:-20px;
        right: 0px;
    }
    .setRight {
        float: right;
        padding: 0 5px;
        cursor: pointer;
        margin-left: 5px;
        margin-bottom: 2px;
        text-align: center;
        border: 1px solid #ccc;
        height: 20px;
        line-height: 18px;
        -webkit-border-radius: 3px;
        -moz-border-radius: 3px;
        border-radius: 3px;
        background-color: @title-color;
    }
    .setRight:hover {
        color: @select-font-color;
    }

    .water-list {
        padding: 15px 0px 0px 0px;
        clear: both;
        width: 318px;
        &.bigWidth {
            width: 424px;
        }
        background: #fff;

        table {
            tbody {
                height: 260px;
            }
            tr {
                display:  flex;
            }
            td {
                flex: 1 0 0;
                width: 72px;
                border: 0;
                border-right: 1px solid #E5E8EC;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space:nowrap;
            }
            td:first-child {
                width: 74px
            }
        }
        .nodata {
            text-align: center;
            height: 200px;
            line-height: 200px;
            width: 100%;
            font-size: @font-normal;
        }
    }

    .big {
        table {
            tr {
                .height(@height-big);
                td {
                    // .height(@height-big);
                }
            }
            thead {
                tr {
                    td {}
                }
            }
            tbody {
                tr {
                    td {}
                }
            }
        }
    }
</style>
