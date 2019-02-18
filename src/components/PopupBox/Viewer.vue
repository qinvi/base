<template>
    <div class="viewContainer">
        <div id="viewAnimation" class="viewAnimation" :style="opacityStyle" @click.stop="carryDataAndStatus()">
            <div class='leftView'>
                <img src="../../assets/img/common/view.png" alt="">
            </div>
            <div class="rightView">
                <span>气象信息员张三</span>
                <span>{{ roadName }}</span>
            </div>
        </div>
        <div class="viewer" v-show="showVideo" ref="poi-video" :style="computedStyle">
            <a class="close" @click="close()"></a>
            <div class="title nullBg" ref="poi-title">
                <label for="">现场直播</label>
            </div>
            <video id="video" autoplay width="480px" height="480px" poster=""></video>
            <img v-show="noVideo" src="../../assets/img/toolsbar/no-video.png" alt="">
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Viewer as Vr } from './Call.js';
import kurentoUtils from 'kurento-utils';
export default {
    data() {
        return {
            opacityStyle: 'opacity: 0',
            disabledStatus: {
                viewer: true,
                stop: false
            },
            lonlat: null,
            roadName: '',
            showVideo: false,
            noVideo: false // 没有视频流
        }
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            type: state => state.normalPoiDetail.type,
            selectStatus: state => state.normalPoiDetail.status,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            clearTimer: state => state.clickCallback.clearTimer,
            removeSelectPoint: state => state.selectPoint.remove,
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        }),
        computedStyle() {
            if (this.type === 'liveVideo') return 'right: 0px; top: 0px; left: unset'; // right: 0px; top: 0px;'
        }
    },
    watch: {
        lonlat() {
            if (this.type === 'liveVideo') this.updateParam([ 'selectPoint', { lonlat: this.lonlat, type: 'monitor&liveVideo' } ]); // 高亮poi
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        initConstData() {
            let _this = this;
            this.updateParam(['clickCallback', { liveVideoCallback: this.carryDataAndStatus }]);
            this.iconLayer = lmap.layer.init(lmap.map, 'point');
            this.urls = {
                roadName: sysconfig.TESTPATH + '/atwill/getRoadName'
            };
            this.ws = new WebSocket('ws://10.148.83.68:8082/call'); // 10.148.83.131:8082
            this.ws.onopen = () => {
                Vr.LCB.queryOnliveStatus(_this.sendMessage);
            }
            this.webRtcPeer = null;
            this.video = document.getElementById('video');
            this.WebSocketCall();
            this.timer = { delayTimer: null, overlayTimer: null, wsTimer: null };
            this.overlay = null;
            this.lastDom = document.getElementById('viewAnimation');
            this.video.addEventListener('play', () => {
                _this.noVideo = false;
            });
        },

        close() {
            this.showVideo = false;
            this.removeSelectPoint('monitor', 'liveVideo');
        },

        /**
         * websocket监听回调
         */
        WebSocketCall() {
            const _this = this;
            this.ws.onmessage = function(message) { // 根据通信所处的不同阶段进行不同操作
                let parsedMessage = JSON.parse(message.data);
                switch (parsedMessage.id) {
                    case 'presenterResponse': // 直播成功callback
                        break;
                    case 'viewerResponse': // 接收成功callback
                        _this.viewerResponse(parsedMessage);
                        break;
                    case 'changeScreen': // 切换摄像头监听
                        _this.stop();
                        _this.viewer();
                        break;
                    case 'iceCandidate': // 后台处理
                        _this.webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                            if (error) return console.error('Error adding candidate: ' + error);
                        });
                        break;
                    case 'stopCommunication':
                        _this.stop();
                        break;
                    case 'onliveR':
                        this.WebSocketOn = Vr.LCB.gotOnliveStatus(parsedMessage.onlive);
                        break;
                    case 'location':
                        if (parsedMessage.onlive) {
                            // _this.lonlat = [parsedMessage.lon, parsedMessage.lat];
                            _this.lonlat = [113.3439156866, 23.1618959189];
                            _this.renderImage();
                        }
                        // Vr.LCB.gotPostion(parsedMessage.lon, parsedMessage.lat, parsedMessage.accuracy);
                        break;
                }
            }
        },

        /**
         * 渲染overlay、也适用多个overlay
         */
        renderOverlay(lonlat) {
            // if (!!this.overlay) return;
            utils.GET(this.urls.roadName, { code: this.code, lonlat: lonlat.join(' '), dateTime: TU(this.sysTime).format('YYYY-MM-DD HH:mm:ss') }).then((json) => {
                // this.roadName = (!!Object.keys(json.data)[0]) ? json.data.fullAddress : '未知';
                this.roadName = '广东省广州市天河区东莞庄路';
                if (!!this.overlay) {
                    this.opacityStyle = 'opacity: 0';
                    lmap.map.removeOverlay(this.overlay);
                    this.overlay = null;
                }
                this.overlay = lmap.draw.getOverlay({
                    transform: true,
                    lonlat,
                    element: this.lastDom,
                    offset: [35, -62]
                });
                lmap.map.addOverlay(this.overlay);
                utils.clearTimer(this.timer.overlayTimer);
                this.timer.overlayTimer = window.setTimeout(() => {
                    this.opacityStyle = 'opacity: 1';
                }, 1000);
            });
        },

        /**
         * 绘图
         */
        renderImage() {
            if (!!this.iconLayer) lmap.icon.clear(this.iconLayer);
            utils.clearTimer(this.timer.delayTimer);
            this.timer.delayTimer = window.setTimeout(() => {
                const zoom = lmap.util.getZoom(lmap.view);
                let poiSize = (zoom > 8) ? 16 : (zoom <= 6) ? 12 : 14;
                const style = {
                    circle: {
                        radius: poiSize / 2,
                        fill: {
                            color: 'rgba(255, 165, 0, 1)'
                        },
                        stroke: {
                            color: 'rgba(0, 0, 0, 1)',
                            width: 1
                        }
                    }
                };
                if (!!this.lonlat) {
                    lmap.icon.add(this.iconLayer, style, this.lonlat, { type: 'liveVideo' });
                    this.renderOverlay(this.lonlat);
                }
            }, 50)
        },

        /**
         * 点击函数
         */
        click(e) {
            const clickIndex = this.getClickIndex();
            let feature = lmap.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
                return feature;
            });
            if (feature && feature.get('type') === 'liveVideo') {
                this.clickPlugin('liveVideoCallback', this.lonlat, clickIndex); // 触发poi点击插件
            }
        },

        carryDataAndStatus(lonlat) {
            WD.init(this.$refs['poi-title'], this.$refs['poi-video'], lmap.map);
            this.clearTimer();
            this.showVideo = true;
            this.stop();
            this.viewer(false);
            this.updateParam([ 'selectPoint', { lonlat: this.lonlat, type: 'monitor&liveVideo' } ]); // 高亮poi
        },

        /**
         * websocket监听调用
         */
        viewerResponse(message) { // 接收回调
            if (message.response !== 'accepted') {
                // let errorMsg = message.message ? message.message : 'Unknow error';
                // console.info('Call not accepted for the following reason: ' + errorMsg);
                this.dispose();
            } else {
                this.webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
                    if (error) return console.error(error);
                });
            }
        },

        /**
         * 按钮触发视频接收端
         */
        viewer(b = true) { // 接收
            if (!this.webRtcPeer) {
                let options = {
                    remoteVideo: this.video,
                    onicecandidate: this.onIceCandidate
                }
                const _this = this;
                this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
                        function(error) {
                            if (error) return console.error(error);
                            if (!!this.generateOffer) {
                                this.generateOffer(_this.onOfferViewer);
                            }
                        });
                this.changeDisabledStatus(true);
            }
        },
        onIceCandidate(candidate) {
            // console.log('Local candidate' + JSON.stringify(candidate));

            let message = {
                id: 'onIceCandidate',
                candidate: candidate
            };
            this.sendMessage(message);
        },
        onOfferViewer(error, offerSdp) {
            if (error) return console.error('Error generating the offer');
            console.info('Invoking SDP offer callback function');
            let message = {
                id: 'viewer',
                sdpOffer: offerSdp
            }
            this.sendMessage(message);
        },

        /**
         * 修改disabledStatus状态
         * @param {boolean}
         */
        changeDisabledStatus(b) {
            this.disabledStatus = {
                viewer: b,
                stop: !b
            }
        },

        /**
         * 停止通信
         */
        stop() {
            let message = {
                id: 'stop'
            }
            this.noVideo = true;
            this.sendMessage(message);
            this.dispose();
        },

        /**
         * 关闭webRtcPeer、websocket监听回调后都调用
         */
        dispose() {
            if (this.webRtcPeer) {
                this.webRtcPeer.dispose();
                this.webRtcPeer = null;
            }
            this.changeDisabledStatus(false);
        },

        /**
         * websocket通过webRtcPeer返回信息
         */
        sendMessage(message) {
            this.waitingConnection(() => {
                let jsonMessage = JSON.stringify(message);
                // console.log('Senging message: ' + jsonMessage);
                this.ws.send(jsonMessage);
            }, 1000);
        },

        waitingConnection(callback, interval) {
            if (this.ws.readyState === 1) callback();
            else {
                let _this = this;
                this.timer.wsTimer = window.setTimeout(() => {
                    _this.waitingConnection(callback, interval);
                }, interval);
            }
        }
    },
    mounted() {
        this.initConstData();
        this.viewer();
        lmap.map.on('singleclick', this.click);
    },
    destroyed() {
        this.close();
        // this.ws.close();
        this.stop();
        lmap.map.removeOverlay(this.overlay);
        lmap.map.un('singleclick', this.click);
        lmap.icon.clear(this.iconLayer);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.viewAnimation {
    background: #fff;
    cursor: pointer;
    // width: 100px;
    height: 27px;
    line-height: 20px;
    padding: 5px;
    left: 50%;
    margin-left: -64px;
    text-align: center;
    border: 4px solid #fff;
    border-radius: 5px;
    opacity: 0.1;
    box-shadow: @shadow;
    -webkit-transition: opacity 0.5s ease-in-out;
       -moz-transition: opacity 0.5s ease-in-out;
        -ms-transition: opacity 0.5s ease-in-out;
         -o-transition: opacity 0.5s ease-in-out;
            transition: opacity 0.5s ease-in-out;
    &:after {
        content: '';
        position: absolute;
        bottom: -15px;
        top: 45px;
        left: -34px;
        margin-left: -9px;
        width: 0;
        height: 0;
        border: 7px solid #fff;
        border-bottom-color: transparent;
        border-left-color: transparent;
        border-right-color: transparent;
    }
    &:after {
        bottom: -14px;
        margin-left: -10px;
        clear: both;
    }
    .leftView, .rightView {
        display: inline-block;
    }
    .leftView {
        position: absolute;
        width: 19%;
        vertical-align: top;
        &:after {
            content: '';
            position: absolute;
            bottom: -15px;
            top: 37px;
            left: 20px;
            margin-left: -9px;
            width: 0;
            height: 0;
            border: 7px solid rgba(0, 0, 0, 0.27);
            border-bottom-color: transparent;
            border-left-color: transparent;
            border-right-color: transparent;
        }        
    }
    .rightView {
        height: 100%;
        margin-left: 40px;
        margin-top: -4px;
        vertical-align: top;
        span {
            display: block;
        }
        span:nth-child(1) { text-align: left; }
    }
}   
.viewContainer {
    .viewer {
        position: absolute;
        width: 398px; // 530px;
        height: 350px;
        top: 0px;
        right: 0px;
        background: #fff;
        box-shadow: @shadow;
        z-index: @pop-index;
        video {
            width: 100%;
            height: 93%;
            object-fit: fill
        }
        img {
            position: absolute;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            margin: auto;            
        }
    }
}
.big {
    .viewAnimation {
        height: 30px;
    }
    .viewAnimation {
        .leftView {
            left: -70px;
            &:after {
                top: 40px;
                left: 37px;
            }
        }
        &:after {
            top: 48px;
        }    
    }
}
</style>
