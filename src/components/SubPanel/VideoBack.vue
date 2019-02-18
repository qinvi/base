<template>
    <div class="video-back" ref="video-panel">
        <a class="close" @click="close"></a>
        <div class="title" ref="video-title">视频回传</div>
        <div>
            <div v-if="last.type === '4G'" class="no-video">视频服务器暂时没有接入该视频源</div>
            <video v-else :src="url" controls="controls" autoplay>浏览器不支持播放</video>
        </div>
        <div class="video-type">
            <ul class="clearfix video-list">
                <li v-for="(item, index) of videos" :key="index" :class="{ selected: item.status }" @click="select(item)">{{ item.text }}</li>
                <li>
                     <div class="UAV clearfix" v-if="last.type === 'UAV'">
                        <label>视频选择：</label>
                        <v-dropdown :list="UAV.data" :tip="UAV.tip" class="dropdown-video-back" @select="getUAV"></v-dropdown>
                        <!-- <v-select :list="UAV.data" :tip="UAV.tip" @select="getUAV"></v-select> -->
                    </div>
                </li>
            </ul>

        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
// import Select from '../Plugins/Select.vue';
import Dropdown from '../Plugins/Dropdown';

export default {
    name: 'VideoBack',
    components: {
        'v-dropdown': Dropdown
        // 'v-select': Select
    },
    data() {
        return {
            videos: [
                { text: '4G直播', type: '4G', status: false },
                { text: '3/4G视频', type: '3G', status: false },
                { text: '无人机', type: 'UAV', status: false },
                { text: '新闻', type: 'NEWS', status: false }
            ],
            UAV: {
                data: [
                    { value: 1, text: '天河区东莞庄路1月9日' },
                    { value: 2, text: '天河区东莞庄路1月7日' },
                    { value: 3, text: '2015航拍湛江台风灾情' }
                ],
                tip: '天河区东莞庄路1月9日'
            },
            last: {},
            url: null
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime
        })
    },
    watch: {
        sysTime() {

        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.mapping = {
                '3G': 'http://10.148.16.53/video/2015TFZJ3G4G.mp4',
                'NEWS': 'http://10.148.16.53/video/2015ZJDH.mp4'
            };
            this.UAVData = {
                1: {
                    lon: '113.344',
                    lat: '23.165',
                    url: 'http://10.148.16.53/video/wrj/DJI_0001.mp4',
                    areacode: '440106',
                    text: '天河区东莞庄路1月9日'
                },
                2: {
                    lon: '113.344',
                    lat: '23.165',
                    url: 'http://10.148.16.53/video/wrj/DJI_0199.mp4',
                    areacode: '440106',
                    text: '天河区东莞庄路1月7日'
                },
                3: {
                    lon: '110.182',
                    lat: '21.25',
                    url: 'http://10.148.16.53/video/wrj/2015HPZJTFZJ.mp4',
                    areacode: '440106',
                    text: '2015航拍湛江台风灾情'
                }
            };
            this.layer = lmap.layer.init(lmap.map);
            this.style = {
                isIcon: true,
                icon: {
                    src: 'http://10.148.16.53/topic/little/toolbar/uav.png',
                    anchor: [0.5, 0.5],
                    size: [16, 16]
                }
            }
        },

        /**
         * 关闭
         */
        close() {
            this.updateParam([ 'toolsBar', { video: false } ]);
        },

        /**
         * 选择视频类型
         */
        select(item) {
            if (!!this.last) this.last.status = false;
            item.status = true;
            this.last = item;

            if (item.type === 'UAV') {
                this.getUAV({ value: 1 });
            } else {
                this.url = this.mapping[item.type];
                lmap.icon.clear(this.layer);
            }
        },

        getUAV(param) {
            const video = this.UAVData[param.value];
            this.url = video.url;
            const { lon, lat } = video;
            lmap.icon.clear(this.layer);
            lmap.icon.add(this.layer, this.style, [ lon, lat ])
        }
    },

    mounted() {
        this.initConstData();
        this.select(this.videos[0]);
        WD.init(this.$refs['video-title'], this.$refs['video-panel'], lmap.map);
    },

    destroyed() {
        lmap.layer.remove(lmap.map, this.layer);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.video-back {
    position: fixed;
    top: @top-normal;
    right: 0px;
    width: 700px;
    height: 448px;
    z-index: @pop-index;
    background: #fff;
    box-shadow: @shadow;
    video {
        width: 700px;
        height: 394px;
    }
    .video-type {
        width: 100%;
        position: absolute;
        bottom: 0;
        background-color: @title-color;
        ul {
            float: left;
            padding: 4px 0;
            li {
                float: left;
                .height();
                padding: 0 10px;
                border-right: 1px solid rgba(187, 187, 187, 0.3);
                &.selected {
                    color: @select-font-color;
                }
                &:nth-last-child(1) {
                    padding: 0px 6px;
                }
            }
        }
        .UAV {
            // display: inline-block;
            label {
                .height();
                float: left;
            }
            form {
                float: none;
            }
        }
    }
    .no-video {
        background: url('../../assets/img/toolsbar/no-video.png') no-repeat center 20%;
        line-height: 430px;
    }
}

.big {
    .video-back {
        top: @top-big;
        height: 540px;
        width: 800px;

        video {
            width: 800px;
            height: 460px;
        }

        .video-type {
            ul {
                li {
                    padding: 0 14px;
                    .height(@height-big);
                }
            }
            .UAV {
                label {
                    .height-big();
                }

                .div-select {
                    width: 200px;
                }
            }
        }
    }
}
</style>
