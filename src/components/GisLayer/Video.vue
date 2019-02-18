<template>
<div>
    <v-provideo v-if="showProVideo" :proVideo="selectMonitor" :idx="''" @close="close"></v-provideo>
    <v-poivideo v-if="showPoiVideo" :poiVideo="selectNormal" @close="close"></v-poivideo>
</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import ProvVideo from '../PopupBox/ProvVideo'
import PoiVideo from '../PopupBox/PoiVideo'
export default {
    name: 'allvideo',
    components: {
        'v-provideo': ProvVideo,
        'v-poivideo': PoiVideo
    },
    data() {
        return {
            text: '',
            selectNormal: { text: '', type: '', chanel: '' },
            selectMonitor: { text: '', type: '', isprov: 'false' },
            isPoiVideo: false, // 是否是展示基础数据弹窗样式的视频，林火视频，公安视频， poi弹窗形式
            showPoiVideo: false,
            showProVideo: false,
            selectNormalType: '',
            isProvVideo: false // 是否是水库视频、公共视频，视频不能播放样式
        }
    },
    computed: {
        ...mapState({
            normalType: state => state.normalPoiDetail.type,
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            types: state => state.video.types,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            removeSelectPoint: state => state.selectPoint.remove,
            clearTimer: state => state.clickCallback.clearTimer,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        normalType(val) {
            if (val) this.showPoiVideo = (val === 'video');
        },
        code(val) {
            this.render();
            const t = Object.keys(this.activeCode);
            let s;
            t.forEach(ele => {
                if (!this.activeCode[ele].includes(val)) {
                    s = ele.split('_');
                    this.removeSelectPoint(s[0], s[1]);
                    if (s[0] === 'normal') this.showPoiVideo = false;
                    else this.showProVideo = false;
                    delete this.activeCode[ele];
                }
            });
        },
        types() {
            this.close();
            this.render();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.layer = null;
            this.selectVideo = []; // 当前高亮的视频类型
            this.updateParam(['clickCallback', { videoCallback: this.carryDataAndStatus }]);
            this.activeCode = {};
        },
        render() {
            const param = this.getParam();
            if (!!this.layer) {
                lmap.image.updateWMS(this.layer, param, '');
            } else {
                this.layer = lmap.image.WMS(lmap.map, param, 'poi', '');
            }
        },
        getParam() {
            let types = this.types

            if (this.types.includes('VIDEO_TRAFFIC')) {
                const typeArray = types.split(',').filter(item => item !== 'VIDEO_TRAFFIC')
                types = typeArray.join(',')
                this.updateParam(['realWeather', { status: true }])
            } else {
                this.updateParam(['realWeather', { status: false }])
            }

            return {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getVideoImage',
                params: {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    code: this.code,
                    type: types
                }
            }
        },
        click(e) {
            const clickIndex = this.getClickIndex();
            const zoom = lmap.util.getZoom(lmap.view);
            const [ lon, lat ] = lmap.ctrl.getLonLat(e);
            const { dateTime, code, type } = this.getParam().params;
            const param = { dateTime, code, lon, lat, zoom, type };
            let url = sysconfig.TESTPATH + '/realTimeMonitor/getVideoInfo';
            utils.GET(url, param).then((json) => {
                if (json.hasOwnProperty('data')) {
                    // 模拟基础信息的返回数据组装
                    let type = json.data.type;
                    if (['VIDEO_FORESTRY', 'VIDEO_POLICE'].includes(type)) {  // 林火视频，公安视频
                        this.selectNormal.text = json.data.name;
                        this.selectNormal.chanel = json.data.passageway === 'null' ? '' : json.data.passageway;
                        this.clickPlugin('videoCallback', json.data, clickIndex);
                        this.isPoiVideo = true;
                    } else if (type) {
                        let tempVideo = json.data;
                        this.isProvVideo = true;
                        this.selectMonitor.text = tempVideo.address || tempVideo.name;
                        this.clickPlugin('videoCallback', tempVideo, clickIndex); // 触发poi点击插件
                    }
                }
            });
        },
        /**
         * poi详情与高亮状态传送
         * @param {object} data 详情请求数据
         */
        carryDataAndStatus(data) {
            this.clearTimer();
            const type = data.type.split('_').join('');
            this.selectVideo.push(data.type);
            if (this.isPoiVideo) {
                this.selectNormal.type = 'normal&' + type;
                this.selectNormal = Object.assign({}, this.selectNormal, {});
                this.showPoiVideo = true;
                this.activeCode[`normal_${type}`] = data.areaCode;
                this.updateParam(['normalPoiDetail', {data: '', type: 'video'}]);
                this.isPoiVideo = false;
                this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: `normal&${type}` } ]);
            } else if (this.isProvVideo) {
                this.activeCode[`monitor_${type}`] = data.areaCode;
                this.selectMonitor.type = 'monitor&' + type;
                this.selectMonitor = Object.assign({}, this.selectMonitor, {});
                this.showProVideo = true;
                this.isProvVideo = false;
                this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: `monitor&${type}` } ]);
            }
        },

        /**
         * 窗口关闭
         * @param {string} object 子组件返回类型
         */
        close(object) { // 两种弹窗类型
            let t1, t2, b;
            const t = this.callbackActiveType();
            let s = this.selectVideo.filter((v) => {
                if (this.types.includes(v)) {
                    return v;
                } else {
                    if (!v) return;
                    t1 = (v === 'VIDEO_FORESTRY' || v === 'VIDEO_POLICE') ? 'normal' : 'monitor';
                    t2 = v.split('_').join('');
                    if (t1 === 'normal') {
                        b = (t.normal === t2);
                        this.showPoiVideo = false;
                        if (b) this.removeSelectPoint('normal', t2); // 关闭选中框
                    } else {
                        this.showProVideo = false;
                        this.removeSelectPoint('monitor', t2);
                    }
                }
            });
            this.selectVideo = s;
            if (!!object) { // 关闭按钮关闭
                const o = object.type.split('&');
                if (o[0].includes('normal')) {
                    b = (t.normal === o[1]);
                    this.showPoiVideo = false;
                    if (b) this.removeSelectPoint('normal', o[1]);
                } else {
                    this.showProVideo = false;
                    this.removeSelectPoint('monitor', o[1]);
                }
            }
        }
    },
    mounted() {
        this.initConstData();
        this.render();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.layer);
        this.close();
        this.updateParam(['realWeather', { status: false }])
    }
}
</script>
