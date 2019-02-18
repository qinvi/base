<template>
<div>
    <v-provideo v-if="isProvVideo" :proVideo="selectMonitor" :idx="idx" @close="close()"></v-provideo>
</div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import ProvVideo from '../PopupBox/ProvVideo'
export default {
    name: 'allvideo',
    components: {
        'v-provideo': ProvVideo
    },
    data() {
        return {
            selectMonitor: { text: '', isprov: true, type: '' },
            chanel: '',
            isProvVideo: false, // 是否是有资源的视频
            idx: ''
        }
    },
    computed: {
        ...mapState({
            normalType: state => state.normalPoiDetail.type,
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            types: state => 'VIDEO_TRAFFIC',
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            removeSelectPoint: state => state.selectPoint.remove,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        code(val) {
            this.render();
            this.updateClosedWMS();
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.layer = null;
            this.activeCode = '';
            this.updateParam(['clickCallback', { trafficCallback: this.carryDataAndStatus }]);
            this.ws = null; // websocket连接
            this.iconLayer = null;
            this.listsdk = {};  // 找到cam对应的通路
            this.alive = []; // 探测中心所有可以正常播放的视频的通路
            this.cam = {
                '韶关珠玑服务区': { id: '439fb3ac-8843-4300-ad7f-018ddd4df171', lon: 114.316072, lat: 25.16157, areaCode: '440282' },
                '湛江琼州海峡': { id: '9da38ecf-1d5b-47b1-a782-f63a3fbc1989', lon: 110.492522, lat: 20.357049, areaCode: '440825' },
                '云浮安塘服务区': { id: 'd220d0fb-6ff6-4d81-8ab7-38298d0b7979', lon: 112.191184, lat: 22.945567, areaCode: '445302' },
                '梅州蕉岭服务区': { id: 'd2442ab3-2bd7-4069-b4c9-37fed7c263b2', lon: 116.126403, lat: 24.304571, areaCode: '441402' },
                '惠东海龟保护区': { id: 'dcf197b1-32fb-4e07-9952-8941e19389ca', lon: 114.887, lat: 22.549, areaCode: '441302' },
                '汕头南澳岛': { id: '57953ff2-cf9f-421e-ad75-747d9a3983a2', lon: 117.106096, lat: 23.438683, areaCode: '440523' },
                '阳江海陵岛': { id: '691050ce-09d0-4dfd-b125-ab9bd0f98cca', lon: 111.919357, lat: 21.630286, areaCode: '441702' },
                '韶关云岩服务区': { id: '670045cf-fbd4-4145-89ad-c74854d5b2de', lon: 113.11654, lat: 25.090536, areaCode: '440281' },
                '佛冈': { id: 'a7edf3e1-9796-4ecc-922f-e3af3c1c409f', lon: 113.5198, lat: 23.8482, areaCode: '441821' },
                '清新': { id: '79a38236-1da9-4f07-90a2-a37a2cacfbef', lon: 112.9202, lat: 23.9385, areaCode: '441827' },
                '源潭': { id: '6609f9c4-470e-4d92-bf5c-14d5e1fd1a77', lon: 113.2228, lat: 23.6868, areaCode: '441802' },
                '英红': { id: 'da0762c0-6110-4148-bf78-5efafa71c5d9', lon: 113.4276, lat: 24.3774, areaCode: '441881' },
                '小三江': { id: '333438e6-c9d1-4424-8a10-93d9b5c5e036', lon: 112.1168, lat: 24.2804, areaCode: '441825' },
                '横石水': { id: 'bb9f0809-83f4-4b87-b354-2fe8ced66e47', lon: 113.7713, lat: 24.4107, areaCode: '441881' },
                '白沙': { id: '76bfc481-cba1-4704-bf4a-7249252f2712', lon: 112.2332, lat: 24.7077, areaCode: '441881' },
                // '南风坳': { id: '103d7df2-658a-434e-89e5-d89273435a91', lon: 112.2035, lat: 25.157, areaCode: '' },
                // '阳山北': { id: '024139f5-8e58-4d1f-8124-d130ed3467b3', lon: 112.4253, lat: 24.5821, areaCode: '' },
                '乐昌观测站': { id: 'dffe33f2-2f68-4f15-b410-f515f5ded8a8', lon: 113.246956, lat: 25.244442, areaCode: '440281' },
                '南雄观测站': { id: 'acd2d254-49b5-4038-a072-b1dbb50278ea', lon: 114.386583, lat: 25.189905, areaCode: '440282' },
                '始兴观测站': { id: 'c1ea8be7-a368-45ca-9b44-dc9dbe80e79f', lon: 114.115404, lat: 24.852706, areaCode: '440222' },
                '仁化观测站': { id: 'aa067e40-e087-4df3-aea1-00ad23b3595c', lon: 113.785474, lat: 25.148466, areaCode: '440224' },
                '新丰县气象局': { id: '61fb7a6c-c058-4f5d-88d4-7759e7d8cf30', lon: 114.206, lat: 24.06, areaCode: '440233' },
                '翁源观测站': { id: '4b482895-1e5f-422d-b1f0-20fa2d519443', lon: 114.1207, lat: 24.3459, areaCode: '440229' }
            }
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
            return {
                url: sysconfig.TESTPATH + '/realTimeMonitor/getVideoImage',
                params: {
                    dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss'),
                    code: this.code,
                    type: this.types
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
                    if (type) {
                        let cam = this.cam;
                        let alive = this.alive;
                        let tempVideo = json.data;
                        this.selectMonitor.type = 'monitor_trafficVideo';
                        this.selectMonitor.text = tempVideo.address;
                        let camobj = cam[tempVideo.address];
                        if (camobj && camobj.id) {
                            this.selectMonitor.text = tempVideo.address;
                            this.idx = alive.includes(camobj.ins) ? camobj.ins : '';
                            this.isprov = true;
                        }
                        this.selectMonitor = Object.assign({}, this.selectMonitor, {});
                        this.clickPlugin('trafficCallback', tempVideo, clickIndex); // 触发poi点击插件
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
            this.isProvVideo = true;
            this.activeCode = data.areaCode;
            this.updateParam([ 'selectPoint', { lonlat: [ data.lon, data.lat ], type: 'monitor&trafficVideo' } ]);
        },
        close() {
            this.isProvVideo = false;
            this.removeSelectPoint('monitor', 'trafficVideo');
        },
        createFeature() {
            let alive = this.alive;
            let features = [];
            for (let key in this.cam) {
                let value = this.cam[key];
                // 当状态为不能播放
                if (!alive.includes(value.ins) && value.areaCode.startsWith(this.code)) {
                    let feature = new ol.Feature(new ol.geom.Point(lmap.util.transform([value.lon, value.lat])));
                    features.push(feature);
                }
            }
            return features;
        },
        // 为不能播放的视频更换图标
        updateClosedWMS () {
            lmap.icon.clear(this.iconLayer);
            if (this.iconLayer) {
                lmap.icon.addFeatures(this.iconLayer, this.createFeature());
            } else {
                this.iconLayer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: this.createFeature()
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Icon(({
                            author: [0.5, 0.5],
                            size: [16, 16],
                            opacity: 1,
                            src: sysconfig.IP + '/topic/little/poi/provideo.png'
                        }))
                    })
                })
                this.iconLayer.setZIndex(lmap.util.getIndex('poitop'));
                lmap.map.addLayer(this.iconLayer);
            }
        },
        // 获取正常状态的通路
        checkAlive() {
            let arr = [];
            // 查询摄像机的状态
            var ws = new WebSocket('ws://10.148.17.201:8071/cmd-KeepAlive');
            this.ws = ws;
            ws.onmessage = (evt) => {
                var oj = JSON.parse(evt.data);
                if (oj.netstats) {
                    for (let i = 0, len = oj.netstats.length; i < len; i++) {
                        var ns = oj.netstats[i];
                        if (ns.ns === '2') {
                            arr.push(ns.ins);
                        }
                    }
                    this.alive = arr;
                    this.updateClosedWMS();
                }
            };
        },
        // 获取最新的视频及视频对应的通路
        getDevs() {
            fetch('http://10.148.17.201:8091/queryorg').then(function(response) {
                if (response.ok) return response.json();
            }).then((json) => {
                let data = json.cam;
                let cam = this.cam;
                for (let i = 0, len = data.length; i < len; i++) {
                    let obj = data[i];
                    for (let j in cam) {
                        if (obj.id === cam[j].id) {
                            cam[j].ins = obj.ins;
                        }
                    }
                }
                this.checkAlive();
            })
        }
    },
    mounted() {
        console.info('mounted', this.isProvVideo);
        this.initConstData();
        this.render();
        this.getDevs();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        if (this.ws) this.ws.close(); // 关闭websocket连接
        this.ws = null;
        lmap.icon.clear(this.iconLayer);
        lmap.layer.remove(lmap.map, this.iconLayer);
        lmap.map.un('singleclick', this.click);
        lmap.layer.remove(lmap.map, this.layer);
        this.close();
    }
}
</script>
