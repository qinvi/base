<template>
	<div class="qxj-rain-list" >
		<a class="close" @click="close()"></a>
	    <table cellpadding="0" cellspacing="0">
	        <thead>
	            <tr>
                    <td>序号</td>
                    <td v-for="(value, key) in title">{{ value }}</td>
                </tr>
	        </thead>
	        <tbody v-show="lazyItems[0]">
	            <tr v-for="(item,index) in lazyItems" v-if="(index >= startPage && index < endPage) && lazyLoad">
                    <td>{{index + 1}}</td>
                    <td v-for="(value,key) in title" :title="key === 'site' ? item[key]['title'] : item[key]">{{ key === 'site' ? item[key]['title'] : item[key] }}</td>
                </tr>
	        </tbody>
	    </table>
        <v-data-loading :loadStatus="loading" :noDataStatus="!lazyItems[0]" :noDataStyle="noDataStyle"></v-data-loading>
	    <div class="sitepage">
	    	<span>{{startPage / 20 + 1}}页/共{{countPage}}页</span>
	    	<span>共{{itemsLen}}条数据</span>
            <a v-for="(value, key) in pageBtn" class="btn hover" @click="setRainPage(key)">{{ value }}</a>
	        <!-- <div class="loading" v-show="loading"></div> -->
	    </div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import DataLoading from '../Plugins/DataLoading';

export default {
    components: {
        'v-data-loading': DataLoading
    },
    data() {
        return {
            noDataStyle: {
                'text-align': 'center',
                'height': '500px',
                'line-height': '500px',
                'width': '100%',
                'font-size': '15px'
            },
            // 表格标题
            title: {no: '站点', site: '名称', rain1hour: '过去1小时', rain3hour: '过去3小时', rain6hour: '过去6小时', rain12hour: '过去12小时', rain24hour: '过去24小时', rain4feature1hour: '未来1小时', rain4feature2hour: '未来2小时', rain4feature3hour: '未来3小时', rain4feature1day: '未来1天', rain4feature3day: '未来3天'},
            // 分页按钮
            pageBtn: {start: '首页', prev: '上页', next: '下页', end: '尾页'},
            // 开始页面
            startPage: 0,
            // 每页数据量
            singlePaneCount: 0,
            // 结束页面
            endPage: 20,
            // 总页数
            countPage: 0,
            // 数据长度
            itemsLen: 0,
            // 缓存动态
            loading: true,
            // 降雨数据
            rainItems: [],
            // 延迟加载数据
            lazyItems: [],
            // 延迟状态
            lazyLoad: false,
            // 请求时间
            time: '',
            rainUrl: sysconfig.TESTPATH + '/realTimeMonitor/getSiteObsRain',
            featureUrl: sysconfig.TESTPATH + '/realTimeMonitor/getSiteFutureRain'
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
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 5);
            }
        })
    },
    watch: {
        sysMinTime() {
            this.initTime();
        },
        rainItems: {
            deep: true,
            handler(rainItems) {
                setTimeout(() => {
                    if (this.lazyLoad) {
                        this.$nextTick(() => {
                            this.lazyItems = rainItems;
                        })
                    }
                }, 1);
            }
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        initTime() {
            let wholeTime = new Date(TU(this.sysMinTime).format('YYYY-MM-DD HH:00:00'));
            this.time = TU(TU(wholeTime).split()).format('YYYY-MM-DD HH:mm:ss');
        },
        close() {
            this.$emit('close');
        },
        setRainPage(type) {
            let panel = document.getElementsByClassName('qxj-rain-list')[0];
            let panelHeight = panel.getBoundingClientRect().height;
            let lineHeight = panel.getElementsByTagName('tr')[0].getBoundingClientRect().height;
            let singlePaneCount = parseInt(panelHeight / lineHeight) - 2;
            let startPage = this.startPage;
            let endPage = this.endPage;
            let len = this.rainItems.length;
            // 多出的小数点不能四舍五入，应该向上取整。
            let countPage = Math.ceil(len / 20);
            this.countPage = countPage;
            this.itemsLen = len;
            this.singlePaneCount = singlePaneCount;
            if (type === 'next') {
                startPage += 20;
                endPage += 20;
                if (((len - endPage) % 20) >= 0 && ((len - endPage) % 20) < 1) endPage = len;
                if (startPage >= len) return;
            } else if (type === 'prev') {
                if (startPage <= 0) return;
                startPage -= 20;
                endPage -= 20;
            } else if (type === 'start') {
                startPage = 0;
                endPage = 20;
            } else if (type === 'end') {
                startPage = (countPage - 1) * 20;
                endPage = countPage * 20;
            }
            this.startPage = startPage;
            this.endPage = endPage;
            this.getFutureRainList();
        },
        getRainList() {
            this.loading = true;
            this.rainItems = [];
            this.isQxjRainPanel = true;
            utils.GET(this.rainUrl, {
                code: this.sysCode,
                dateTime: this.time
            }).then((json) => {
                let {data} = json;
                if (!data) return;
                let {map: dataMap} = data;
                this.rainItems = dataMap['rainlist'];
                this.setRainPage('start');
            });
        },
        getFutureRainList() {
            this.loading = true;
            let rainItems = this.rainItems;
            if (rainItems.length === 0) return;
            let [lonArray, latArray, numArray] = [[], [], []];
            for (let index = this.startPage; index < this.endPage; index++) {
                let items = rainItems[index];
                if (!items) break;
                let {lon, lat} = items.site;
                lonArray.push(lon);
                latArray.push(lat);
                numArray.push(index);
            }
            let that = this;
            this.lazyLoad = false;
            utils.GET(this.featureUrl, {
                code: that.sysCode,
                lon: lonArray.join(','),
                lat: latArray.join(','),
                num: numArray.join(','),
                dateTime: this.time
            }).then((json) => {
                let {data} = json;
                if (Object.keys(data) === 0) return;
                let {map: dataMap} = data;
                let sitesFuture = dataMap['sitesFuture'];
                for (let index in sitesFuture) {
                    let {rain1hour, rain2hour, rain3hour, rain1day, rain3day} = sitesFuture[index];
                    let obj = that.rainItems[index];
                    let newObj = Object.assign({}, obj, {
                        rain4feature1hour: rain1hour,
                        rain4feature2hour: rain2hour,
                        rain4feature3hour: rain3hour,
                        rain4feature1day: rain1day,
                        rain4feature3day: rain3day
                    });
                    that.rainItems.splice(index, 1, newObj);
                    this.lazyLoad = true;
                    this.loading = false;
                }
            })
        }
    },
    mounted() {
        this.initTime();
        this.getRainList()
        this.getFutureRainList()
    }
}
</script>

<style lang='less' scoped>
@import '../../assets/css/common.less';

.qxj-rain-list {
    position: absolute;
    right: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    background: #fff;
    z-index: @pop-index + 99;

    .nodata {
        text-align: center;
        height: 500px;
        line-height: 500px;
        width: 100%;
        font-size: 15px;
    }

    table {
        width: 100%;
        height: 100%;
        background: #fff;
        table-layout: fixed;

        thead {
            background: @title-color;
            display: table-header-group !important;
            table-layout: fixed;
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

            tr:hover {
                background: @title-color;
                cursor: pointer;
            }
        }
        tr {
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
        td:nth-child(1),
        td:nth-child(2) {
            width: 5%
        }
        td:nth-child(3) {
            width: 20%
        }
        td:nth-child(4),
        td:nth-child(5),
        td:nth-child(6),
        td:nth-child(7),
        td:nth-child(8),
        td:nth-child(9),
        td:nth-child(10),
        td:nth-child(11),
        td:nth-child(12),
        td:nth-child(13) {
            width: 7%
        }
    }
}

.sitepage {
    position: absolute;
    height: 30px;
    line-height: 30px;
    left: 10px;
    bottom: 0px;
    margin-top: 5px;
    span {
        margin-right: 2px;
    }
    .btn {
        margin-right: 4px;
    }
}

.loading {
    display: inline-block;
    background: url("../../assets/img/common/loading.gif") no-repeat;
    width: 16px;
    height: 16px;
    margin-top: 2px;
}

/*big*/
// .big .qxj-rain-list table td {
//     height: 32px;
//     line-height: 32px;
// }
.big {
    .qxj-rain-list {
        table {
            tr {
                .height(@height-big);
                td {
                    font-size: 16px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    &:nth-child(1) {
                            width: 4%;
                    }
                    &:nth-child(3) {
                        padding: 0 4px;
                        box-sizing: border-box;
                        width: 10%;
                    }
                    &:nth-child(4),
                    &:nth-child(5),
                    &:nth-child(6),
                    &:nth-child(7),
                    &:nth-child(8),
                    &:nth-child(9),
                    &:nth-child(10),
                    &:nth-child(11),
                    &:nth-child(12),
                    &:nth-child(13) {
                        width: 6%
                    }
                }
            }
            thead {
                tr {
                    font-size: 18px;

                    td {
                    }
                }
            }
        }

        .sitepage {
            bottom: 4px;
            .height(@height-big);
            span,
            .btn {
                .height(@height-big);
                box-sizing: border-box;
            }
            .btn {
                padding: 0 14px;
            }
        }
    }
}
</style>
