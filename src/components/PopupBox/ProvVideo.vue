<template>
	<div class="video-panel" ref="prov-video">
		<div class="title">{{proVideo.text}}</div>
		<a class="close" @click="close()"></a>
        <div class="tips">
            <div v-if="!proVideo.isprov" class="novideo"><span>视频服务器暂时没有接入该视频源</span></div>
            <div v-if="!idx && proVideo.isprov" class="novideo"><span>视频服务器暂时无法提供此摄像头的视频服务</span></div>
            <div v-if="idx && !isPlaying && !timeout" class="loading-video"><span>视频加载中...</span></div>
            <div v-if="idx && !isPlaying && timeout" class="novideo"><span>视频服务加载超时，请稍后再试</span></div>
        </div>
        <video id="vd" controls autoplay v-show="idx"></video>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import liveVideo from '@/utils/video-sdk/liveVideoCtrl';
import webSocket from '@/utils/video-sdk/webSocketMse';

export default {
    name: 'PopupBoxVideo',
    props: ['proVideo', 'idx'],
    data() {
        return {
            isNotMse: null,
            timeout: false,
            isPlaying: false
        };
    },
    computed: {
        ...mapState({
            code: state => state.sys.code,
            activeCode: state => state.selectPoint.areaCode
        })
    },
    watch: {
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        },
        idx: function() {
            this.playOrStop();
        }
    },
    methods: {
        playOrStop() {
            this.isPlaying = false;
            if (!!this.idx) {
                this.playVideo(this.idx);
            } else {
                this.mediaSdkStop(this.videolb);
            }
        },

        playVideo: function(idx) {
            this.mediaSdkPlay(this.videolb, idx);
            this.timeout = false;
            this.call = setTimeout(() => {
                this.timeout = true;
                clearTimeout(this.call);
            }, 15000);
        },

        mediaSdkPlay: function(videolb, idx) {
            var videoServerPort = '8071';
            var videoCMDPort = '8091';
            var hostIp = '10.148.17.201';
            if (this.isNotMse == null) {
                if (navigator.appVersion.indexOf('Chrome/4') >= 0) {
                    this.isNotMse = true;
                } else {
                    this.isNotMse = false;
                }
            }
            if (this.isNotMse) {
                liveVideo.lvPlay(videolb, 'http://' + hostIp + ':' + videoCMDPort + '/' + idx + '.mp4', (status) => {
                    this.isPlaying = status;
                    clearTimeout(this.call);
                    this.timeout = false;
                });
            } else {
                webSocket.msePlay(videolb, 'ws://' + hostIp + ':' + videoServerPort + '/' + idx + '.mp4', (status) => {
                    this.isPlaying = status;
                    clearTimeout(this.call);
                    this.timeout = false;
                });
            }
        },

        mediaSdkStop: function(videoLabel) {
            if (this.isNotMse) {
                liveVideo.liveStopVideo(videoLabel);
            } else {
                webSocket.StopVideo(videoLabel);
            }
        },

        close() {
            this.$emit('close', {type: this.proVideo.type});
        }
    },
    mounted: function() {
        WD.init(this.$refs['prov-video'], this.$refs['prov-video'], lmap.map);
        this.videolb = document.getElementById('vd');
        this.playOrStop();
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WD.zIndex + 1
            WD.zIndex += 1
        }
    },
    destroyed() {
        this.mediaSdkStop(this.videolb);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.video-panel {
    height: auto;
    position: absolute;
    right: 0;
    width: 700px;
    z-index: @pop-index;
    top: 0px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: @shadow;
}

#vd {
    width: 700px;
    height: auto;
}

.tips {
    position: absolute;
    top: 26px;
    // background: #fff;
    height: 400px;
    z-index: @pop-index;
    width: 700px;
    text-align: center;
    font-size: 14px;
    color: #414141;
}

.novideo {
    height: 400px;
    background: #fff url('../../assets/img/toolsbar/no-video.png') no-repeat center 31%;
    line-height: 400px;
    span {
        line-height: 457px;
    }
}

.loading-video {
    font-size: 18px;
    span {
        line-height: 370px;
    }
    // top: 50%;
    // transform: translateY(-50%);
}
.big {
    .tips {
        top: 36px;
    }
}
</style>
