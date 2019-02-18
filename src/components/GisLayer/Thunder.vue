<template>
    <div>
        <div class="thunderInfo" v-if="winStat == true" :style="getPathPosition">
           <div class="title">闪电产品详细信息</div>
            <div class="InfoPanle">
                <ul>
                    <li><label>位</label>置：<a><span>{{thunderData.lon + '，' + thunderData.lat}}</span></a></li>
                    <li><label>时</label>间：<a><span>{{thunderData.datetime}}</span></a></li>
                    <li>电流强度：<a><span>{{thunderData.peakcurrent}}</span></a></li>
                </ul>
            </div>
       </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    name: 'Thunder',
    data() {
        return {
            winStat: '',
            thunderData: '',
            pix: ''
        }
    },
    computed: {
        ...mapState({
            sysMinTime: state => {
                return TU().matchMin(state.time.sysMinTime, state.time.min, 6);
            },
            loadFunc: state => state.time.loadFunc,
            code: state => state.sys.code,
            areaName: state => state.sys.areaName,
            bigScreen: state => state.toolsBar.bigScreen
        }),
        // 改变雷电信息窗口位置
        getPathPosition() {
            let obj = {};
            let pix = this.pix;
            obj['left'] = this.bigScreen ? pix[0] + 8 + 'px' : pix[0] + 8 + 'px';
            obj['top'] = this.bigScreen ? pix[1] - 188 + 'px' : pix[1] - 145 + 'px';
            return obj;
        }
    },
    watch: {
        sysMinTime() {
            this.render();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.layer = null;
            this.param = {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getThunderImage'
            }
            lmap.map.on('pointermove', this.moveEvt);
        },
        render() {
            const param = Object.assign({}, this.param);
            param.params = { dateTime: TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss'), code: this.code };
            if (!!this.layer) {
                lmap.image.updateWMS(this.layer, param, '');
            } else {
                this.layer = lmap.image.WMS(lmap.map, param, 'active', '');
                this.layer.getSource().on('imageloadend', this.load);
                this.layer.getSource().on('imageloaderror', this.load);
            }
        },
        load() {
            this.loadFunc('thunder');
        },
        moveEvt: function(evt) {
            if (this.winStat) this.winStat = false;
            this.pix = evt.pixel;
            // console.log(lmap.controler.getEvtLonLat(evt));
            let zoom = Math.ceil(lmap.map.getView().getZoom()) + '';
            let timestr = TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss');
            let lonlat = lmap.ctrl.getLonLat(evt);
            let url = sysconfig.TESTPATH + '/realTimeMonitor/getThunderData';
            let params = {
                lon: lonlat[0],
                lat: lonlat[1],
                dateTime: timestr,
                zoom: zoom,
                code: 44
            }
            if (this.timer) window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                utils.get(url, params).then((bd) => {
                    // console.log($.isEmptyObject(json.data));
                    if (!utils.isEmptyObject(bd.data)) {
                        this.thunderData = bd.data.thunderData[0];
                        this.winStat = true;
                    } else {
                        this.winStat = false;
                    }
                });
            }, 80)
        }
    },
    mounted() {
        this.initConstData();
    },
    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
        lmap.map.un('moveend', this.render);
        lmap.view.un('change:resolution', this.render);
        lmap.map.un('pointermove', this.moveEvt);
    }
}
</script>
<style lang="less" scoped>
@import "../../assets/css/common.less";
.thunderInfo {
	position: absolute;
	right: 0px;
	top: 0px;
	z-index: 9999;
	background-color: #fff;
	-webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
	-moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
	box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    &::before {
        content: '';
        display: block;
        position: absolute;
        bottom: -64px;
        left: -11px;
        width: 0;
        height: 0;
        border-width: 36px 13px 0;
        border-style: solid;
        border-color: #fff transparent transparent;
        margin: 40px auto;
        transform: rotate(30deg);
        z-index: -1;
    }
}
div.thunderInfo {
	width: 280px;

	.InfoPanle {
		height: auto;
		margin: 3px;
		overflow: hidden;
		padding: 0 2px;
		max-height: 400px;
		overflow-y: auto;
		li {
			width: 100%;
			height: 30px;
			line-height: 30px;
			padding-left: 3px;
			float: left;
			text-align: left;
			border-bottom: 1px solid #f2f2f2;

			label {
				margin-right: 25px;
            }
            a {
                display: inline-block;
                text-align: center;
                width: 74%;
                color: #414e61;
            }
		}
		li.two {
			width: 48%;
			border-left: 1px solid #f2f2f2;
		}
	}
}
.big {
    div.thunderInfo {
        width: 415px;
        li {
            height: 40px;
            line-height: 40px;
            label {
				margin-right: 40px;
            }
        }
    }
}
</style>
