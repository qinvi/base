<template>
	<div>
		<div class="highway-poiPop normal panelhover" ref="road-win">
			<div v-if="status">
				<div class="title" ref="road-title">
					<span>拥堵路段实时播报{{ curentDataTime }}</span>
					<a class="close" @click="status = false"></a>
				</div>
                <template v-if="hasDataStatus">
					<table class="highwayTable" cellspacing="0" cellpadding="0">
						<thead>
							<tr>
								<td>路段名称</td>
								<td>起始出入口</td>
								<td>结束出入口</td>
								<td>平均速度（km/h）</td>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(it, index) in list" :key="index" v-if="index >= minindex && index < maxindex" :class="{ selected: it.status }" @click="showRoad(it)">
								<td>{{ it.roadName }}</td>
								<td>{{ it.startStation }}</td>
								<td>{{ it.endStation }}</td>
								<td>{{ it.speed }}({{ it.level }})</td>
							</tr>
						</tbody>
					</table>
					<div>
						<ul class="page-bar">
							<li class="firstli">第{{ page.tp }}页/共{{ maxpage }}页  共{{ list.length }}条记录</li>
							<li @click="prevPage()"><a :class="setButtonClass(0)">上一页</a></li>
							<li v-for="(index, i) in indexs" :key="i"  :class="{ active: page.tp == index }">
								<a @click="btnClick(index)">{{ index === 0 ? "..." : index }}</a>
							</li>
							<li @click="nextPage()"><a :class="setButtonClass(1)">下一页</a></li>
						</ul>
					</div>
				</template>
				<template v-else>
					<div :class="['nodata', {'crowd': isCrowded}]">
                        <div v-if="isCrowded">全省高速公路暂无拥堵路段</div>
                        <div v-else>路况信息暂无数据</div>
					</div>
				</template>
			</div>
		</div>
		<div class="highway-poiPop normal panelhover" ref="event-win">
			<div v-if="eventStatus" class="popTab">
				<a class="close" @click="closeEvent()"></a>
				<div class="title nullbg" ref="event-title">
					<label>{{ eventData.eventBrief }}</label>
				</div>
				<div class="popTab popTaBorder">
					<div class="title">基本信息</div>
					<div class="popTab-box">
						<ul>
							<li> 道路名称：{{ eventData.roadName }}</li>
							<li> 道路等级：{{ eventData.roadType2CN }}</li>
							<li> 开始时间：{{ eventData.startTime }}</li>
							<li> 结束时间：{{ eventData.endTime }}</li>
							<li> 事件类型：<img :src="IP + '/topic/little/highway/' + eventData.incidentType + '.png'" />{{ eventData.incidentType2CN }} - {{ eventData.eventType2CN }}</li>
							<li></li>
							<li>内容：{{ eventData.eventToverView }}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    data() {
        return {
            list: [],
            curentDataTime: '',
            status: false,
            page: { showc: 10, tp: 1, tollPage: 0 },
            hasDataStatus: false,
            eventData: null,
            eventStatus: false,
            isCrowded: true // 标志是没有数据还是没有拥堵路段
        };
    },
    watch: {
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) {
                this.closeEvent();
            }
        },
        status() {
            this.$nextTick(() => {
                WD.init(this.$refs['road-title'], this.$refs['road-win'], lmap.map);
                WD.init(this.$refs['event-title'], this.$refs['event-win'], lmap.map);
            });
        },
        dateTime: function() {
            if (this.iconLayer) {
                lmap.icon.clear(this.iconLayer);
            }
            if (this.endLayer) {
                lmap.icon.clear(this.endLayer);
            }
            this.initHighway();
            this.closeEvent();
        }
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            dateTime: state => TU(state.time.sysTime).format('YYYY-MM-DD HH:00:00'),
            removeSelectPoint: state => state.selectPoint.remove
        }),
        minindex() {
            return (this.page.tp - 1) * this.page.showc;
        },
        maxindex() {
            return this.page.tp * this.page.showc;
        },
        maxpage() {
            let mod = this.list.length % this.page.showc;
            let page = parseInt(this.list.length / this.page.showc);
            if (mod !== 0) page += 1;
            this.page.tollPage = page;
            return page;
        },
        indexs() {
            let page = this.page.tollPage;
            let cur = this.page.tp;
            let left = 1;
            let right = this.list.length;
            let ar = [];
            if (page >= 5) {
                if (cur > 3 && cur < page - 1) {
                    left = cur - 2;
                    right = cur + 1;
                } else {
                    if (cur <= 3) {
                        left = 1;
                        right = 4;
                    } else {
                        right = page;
                        left = page - 3;
                    }
                }
                while (left <= right) {
                    ar.push(left);
                    left++;
                }
            } else {
                while (left <= page) {
                    ar.push(left);
                    left++;
                }
            }
            if (ar[0] > 1) {
                ar[0] = 0;
            }
            if (ar[ar.length - 1] < page) {
                ar[ar.length - 1] = 0;
            }
            return ar;
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        initConstData() {
            this.isAutoPage = true; // 请求拥堵路段回来时是否需要自动跳页
            this.iconLayer = lmap.layer.init(lmap.map, 'poi');
            this.pageTimmer = null;
            this.highwayLayer = null;
            this.IP = sysconfig.IP;
            this.activeCode = '';
        },
        initHighway() {
            var param = {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getHighwayImage',
                params: {
                    code: '44',
                    LAYERS: 'highway',
                    dateTime: this.dateTime,
                    random: Math.random()
                }
            };
            if (this.highwayLayer) {
                this.isAutoPage = true;
                this.page = { showc: 10, tp: 1, tollPage: 0 };
                lmap.image.updateWMS(this.highwayLayer, param, 'draw');
            } else {
                this.highwayLayer = lmap.image.WMS(lmap.map, param, 'draw', '');
            }
            this.getHighwayInfo();
        },
        getHighwayInfo() {
            utils.GET(sysconfig.TESTPATH + '/realTimeMonitor/getHighwayInfo', { dateTime: this.dateTime }).then(json => {
                if (json.status === 0 && !utils.isEmptyObject(json.data)) {
                    var dateTime = json.data.dateTime;
                    if (!!dateTime) {
                        this.curentDataTime = `(${dateTime})`;
                    } else {
                        this.curentDataTime = '';
                    }
                    this.updateParam([ 'tip', { poi: { status: true, name: '交通实时路况', ename: 'TRAFFIC CONGESTION DETECTION', time: TU(dateTime).format('YYYY年MM月DD日HH时mm分') } } ]);
                    var list = json.data.dataList;
                    list.map(function(road) {
                        road.status = false;
                        return road;
                    });
                    this.list = list;

                    this.status = true;
                    if (this.list.length > 0) {
                        this.hasDataStatus = true;
                        if (this.isAutoPage) setTimeout(this.autoPage, 1000);
                    } else {
                        this.hasDataStatus = false;
                        let tempStatus = json.data.dataStatus;
                        this.isCrowded = tempStatus !== 'noData';
                        clearTimeout(this.pageTimmer);
                    }
                }
            });
        },
        btnClick(data) {
            if (data < 1) {
                if (this.indexs[0] === 0) {
                    this.btnClick(1)
                } else {
                    this.btnClick(this.page.tollPage)
                }
                return
            }
            this.autoPage();
            if (data !== this.page.tp) {
                this.page.tp = data;
            } else {
                // this.page.tp = data - 1;
            }
        },
        nextPage() {
            this.autoPage();
            if (this.page.tp >= this.page.tollPage) return;
            this.btnClick(this.page.tp + 1);
        },
        prevPage() {
            if (this.page.tp <= 1) {
                return;
            } else if (this.page.tollPage === this.page.tp) {
                this.btnClick(this.page.tp - 1);
            } else {
                this.autoPage();
                this.btnClick(this.page.tp - 1);
            }
        },
        setButtonClass(isNextButton) {
            if (isNextButton) {
                return this.page.tp >= this.page.tollPage ? 'page-button-disabled' : '';
            } else {
                return this.page.tp <= 1 ? 'page-button-disabled' : '';
            }
        },
        autoPage() {
            this.isAutoPage = true;
            if (this.pageTimmer != null) {
                clearTimeout(this.pageTimmer);
            }
            let cur = this.page.tp;
            if (cur === this.page.tollPage) {
                this.page.tp = 0;
            }
            this.pageTimmer = setTimeout(this.nextPage, 5 * 1000);
        },
        clickEvt(e) {
            const [lon, lat] = lmap.ctrl.getLonLat(e);
            let zoom = lmap.util.getZoom(lmap.view);
            utils.GET(`${sysconfig.TESTPATH}/realTimeMonitor/getHighwayEventDetail`, { dateTime: this.dateTime, lon: lon, lat: lat, zoom: zoom }).then(json => {
                if (!utils.isEmptyObject(json.data)) {
                    let obj = json.data;
                    this.eventData = obj;
                    this.eventStatus = true;
                    this.activeCode = obj.areaCode;
                    this.updateParam(['selectPoint', { lonlat: [obj.lon, obj.lat], type: 'monitor&highway' }]); // 高亮poi
                    this.$nextTick(() => {
                        WD.init(this.$refs['event-title'], this.$refs['event-win'], lmap.map);
                    });
                }
            });
        },
        closeEvent() {
            this.eventStatus = false;
            this.removeSelectPoint('monitor', 'highway');
        },
        showRoad(obj) {
            if (!!this.lastRoad) this.lastRoad.status = false;
            obj.status = true;
            this.isAutoPage = false;
            if (this.pageTimmer != null) {
                this.pageTimmer = clearTimeout(this.pageTimmer);
            }
            let tempLonLat = obj.centerLonLat;
            if (!!tempLonLat) {
                let startLonLat = obj.startLonLat.split(' ');
                let endLonLat = obj.endLonLat.split(' ');
                lmap.icon.clear(this.iconLayer);
                this.dot(this.iconLayer, parseFloat(startLonLat[0]), parseFloat(startLonLat[1]), obj.startStation, 'start');
                this.dot(this.iconLayer, parseFloat(endLonLat[0]), parseFloat(endLonLat[1]), obj.endStation, 'end');

                let lonlat = tempLonLat.split(' ');
                lmap.ctrl.panTo(lmap.map, [parseFloat(lonlat[0]), parseFloat(lonlat[1])], 12);
            }
            this.lastRoad = obj;
        },
        dot(layer, lon, lat, address, type) {
            const style = {
                isIcon: true,
                icon: {
                    src: sysconfig.TESTIP + '/topic/little/toolbar/' + type + '.png',
                    size: [28, 40]
                },
                text: {
                    text: address,
                    size: '12px',
                    offsetY: 30,
                    offsetX: 0,
                    fill: {
                        color: 'blue',
                        width: 1
                    },
                    stroke: {
                        color: '#fff',
                        width: 3
                    }
                }
            };
            lmap.icon.add(layer, style, [lon, lat]);
        }
    },
    mounted() {
        this.initConstData();
        this.initHighway();
        lmap.map.on('singleclick', this.clickEvt);
    },
    destroyed() {
        this.list = null;
        if (this.highwayLayer != null) {
            lmap.map.removeLayer(this.highwayLayer);
        }
        lmap.map.un('singleclick', this.clickEvt);
        if (this.pageTimmer != null) {
            clearTimeout(this.pageTimmer);
            this.pageTimmer = null;
        }
        lmap.icon.clear(this.iconLayer);
        this.iconLayer = null;
        this.isAutoPage = false;
        this.closeEvent();
    }
};
</script>

<style scoped="scoped" lang='less'>
@import '../../assets/css/common.less';

.highway-poiPop {
    width: 483px;
    height: auto;
    position: absolute;
    z-index: @panel-index;
    right: 0;
    top: 0px;
    background: #fff;
    -moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
}

.nullbg {
    background: none;
}
.highwayTable {
    width: 100%;
    height: auto;
    overflow: hidden;
    margin-bottom: -1px;
    table-layout: automatic;
    background: #fff;
    border-top: 1px solid #d8dde6;
    tr {
        display: table-row-group;
        &:nth-child(2n) {
            background: #fff;
        }
    }
    thead {
        display: table-header-group;
        background: #fff;
        td {
            font-weight: bold;
        }
    }
    tbody {
        display: table-row-group;
        overflow-y: scroll;
        overflow-x: hidden;
        height: 134px;
        width: 100%;
        border-bottom: 1px solid #e5e8ec;
        tr:hover {
            background: @bg;
            cursor: pointer;
        }

        tr.selected {
            background: @bg;
        }
    }
    td {
        border: 0;
        height: 22px;
        line-height: 22px;
        text-align: center;
        width: 110px;
        vertical-align: middle;
        border-bottom: 1px solid #e5e8ec;
        border-right: 1px solid #e5e8ec;
    }
    td:nth-child(4) {
        width: 148px;
    }
}

.page-bar {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.page-button-disabled {
    color: #ddd;
}

.page-bar li {
    list-style: none;
    display: inline-block;
}

.page-bar li:first-child > a {
    margin-left: 0px;
}

.page-bar a {
    border: 1px solid #ddd;
    text-decoration: none;
    position: relative;
    float: left;
    padding: 1px 5px;
    margin-left: 4px;
    margin-top: 6px;
    line-height: 1.42857143;
    color: #337ab7;
    cursor: pointer;
}

.page-bar a:hover {
    background-color: #eee;
}

.page-bar .active a {
    color: #fff;
    cursor: default;
    background-color: #337ab7;
    border-color: #337ab7;
}

.page-bar i {
    font-style: normal;
    color: #d44950;
    margin: 0px 4px;
    font-size: 12px;
}

.firstli {
    line-height: 20px;
    height: 20px;
    margin-left: 10px;
    margin-right: 120px;
    position: relative;
    bottom: 6px;
}

.nodata {
    height: auto;
    text-align: center;
    font-size: 16px;
    padding: 50px 0px;
    &:before {
        content: '';
        background: url('../../assets/img/highway/600.png');
        width: 137px;
        height: 104px;
        margin-left: 50%;
        transform: translate(-50%, -15%);
        display: block;
    }
}
.crowd:before {
    background: url('../../assets/img/highway/700.png');
}

.popTab-box {
    width: 100%;
    ul {
        width: 98%;
        margin: auto;
        margin-top: 3px;
        margin-bottom: 3px;
        min-height: 30px;
        max-height: 300px;
        overflow-y: auto;
    }
    ul li {
        height: 22px;
        line-height: 22px;
        width: 49%;
        margin-right: 1%;
        text-align: left;
        float: left;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    ul li img {
        margin-right: 5px;
    }
}

.big {
    .highway-poiPop {
        width: 700px;
        .highwayTable {
            tr {
                line-height: 36px;
                height: 36px;
                td {
                    line-height: 36px;
                    height: 36px;
                }
            }
            td:nth-child(1) {
                width: 200px;
            }
            td:nth-child(2) {
                width: 150px;
            }
            td:nth-child(3) {
                width: 150px;
            }
            td:nth-child(4) {
                width: 200px;
            }
        }
    }
}
</style>
