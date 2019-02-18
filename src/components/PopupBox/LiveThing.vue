<template>
    <div class="live-thing" ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title"><span>{{ detail.cityName }}市{{ detail.area}}{{ detail.location}}</span></div>
        <div class="panel-left popIcon">
            <ul>
                <li class="li-before dpop">
                    <label>天气类型</label>
                    <span>{{ detail.weatherType || '--'}}</span>
                </li>
                <li class="li-before epop">
                    <label>所在街道</label>
                    <span>{{ detail.location || '--'}}</span>
                </li>
                <li :title="detail.upTime ">上传时间：</li>
                <li :title="detail.upTime ">{{ detail.upTime }}</li>
                <li :title="detail.bDesc ">
                    <div id="liveDetail">
                        简要说明：{{ detail.bDesc }}
                    </div>
                </li>
            </ul>
        </div>
        <div class="panel-right">
            <div v-show=!noPhoto>
                <div class="swiper-container gallery-top-livething" id="livethingGallery">
                    <div class="swiper-wrapper" v-if="galleryShow">
                        <div class="swiper-slide" v-for="(imgurl, key) of detail.urls" :key="key" @click="galleryImage(imgurl)" :style="{ backgroundImage: `url(${imgurl})` }"></div>
                    </div>
                    <div class="swiper-button-next swiper-button-next-livething swiper-button-white"></div>
                    <div class="swiper-button-prev swiper-button-prev-livething swiper-button-white"></div>
                </div>
                <div class="swiper-container gallery-thumbs-livething">
                    <div id="livethingLoaded" class="swiper-wrapper" v-if="galleryShow">
                        <div class="swiper-slide" v-for="(imgurl, key) of detail.urls" :key="key" :style="{ backgroundImage: `url(${imgurl})` }"></div>
                    </div>
                    <div class="swiper-button-next swiper-button-next-livething swiper-button-white"></div>
                    <div class="swiper-button-prev swiper-button-prev-livething swiper-button-white"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import SWIPER from 'swiper/dist/js/swiper.js';
import ImagesLoaded from 'imagesloaded';
import PS from 'perfect-scrollbar';
import 'swiper/dist/css/swiper.css';

export default {
    name: 'LiveThing',
    props: ['detail'],
    data() {
        return {
            noPhoto: false,
            galleryShow: true,
            galleryTop: null,
            galleryThumbs: null
        };
    },
    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            clickPlugin: state => state.clickCallback.pluginCallback, // poi点击插件
            getClickIndex: state => state.clickCallback.getClickIndex // 获取click事件处理下标
        })
    },
    watch: {
        detail() {
            this.updatePs();
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.iconLayer = null;
            this.ps = null;
        },
        close() {
            this.$emit('close');
        },

        /**
         * 更新perfectscroll
         */
        updatePs() {
            if (this.ps) {
                this.$nextTick(() => {
                    this.ps.update();
                })
            } else {
                this.ps = new PS('#liveDetail', {
                    minScrollbarLength: 40
                });
            }
        },

        /**
         * 放大图片
         */
        galleryImage(imgurl) {
            this.updateParam(['imgGallery', { image: imgurl, type: 'livething' }]);
        },

        /**
         * new一个Swiper
         */
        newSwiper() {
            if (!!this.galleryTop) {
                this.galleryTop.destroy(true, true);
                this.galleryThumbs.destroy(true, true);
                this.galleryTop.update();
                this.galleryThumbs.update();
                this.galleryShow = false;
            }
            window.setTimeout(() => {
                this.galleryShow = true;
                this.$nextTick(() => {
                    this.galleryTop = new SWIPER('.gallery-top-livething', {
                        init: true,
                        spaceBetween: 10,
                        speed: 1300,
                        autoplay: {
                            delay: 2500,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.swiper-button-next-livething',
                            prevEl: '.swiper-button-prev-livething'
                        }
                    });
                    this.galleryThumbs = new SWIPER('.gallery-thumbs-livething', {
                        init: true,
                        spaceBetween: 10,
                        centeredSlides: true,
                        slidesOffsetBefore: -153,
                        slidesPerView: 'auto',
                        touchRatio: 0.2,
                        slideToClickedSlide: true,
                        navigation: {
                            nextEl: '.swiper-button-next-livething',
                            prevEl: '.swiper-button-prev-livething'
                        }
                    });
                    this.galleryTop.controller.control = this.galleryThumbs;
                    this.galleryThumbs.controller.control = this.galleryTop;
                });
            }, 0);
        }
    },
    mounted() {
        this.initConstData();
        WD.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        ImagesLoaded('#livethingLoaded').on('done', () => {
            this.newSwiper();
        });
        this.updatePs();
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WD.zIndex + 1
            WD.zIndex += 1
        }
    },
    destroyed() {
        this.close();
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.live-thing {
    width: 620px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    right: 0;
    top: 0px;
    background: #fff;
    -moz-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    -webkit-box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, .3);
}

.panel-left {
    float: left;
    width: 159px;
    height: auto;
    overflow: hidden;
    margin-left: 5px;
}

.popIcon ul {
    width: 100%;
}

.popIcon ul li {
    line-height: 26px;
    width: 100%;
    overflow: hidden;
    #liveDetail {
        position: relative;
        max-height: 237px;
    }
}

.popIcon ul li.li-before {
    width: 50%;
    text-align: center;
    margin: 8px 0px 10px 0px;
    line-height: 22px;
    float: left;
}

.popIcon ul li.li-before:before {
    content: "";
    display: block;
    height: 40px;
}

.popIcon ul li.dpop:before {
    background: url('../../assets/img/dis/10.png') no-repeat center 8px;
}

.popIcon ul li.epop:before {
    background: url('../../assets/img/dis/09.png') no-repeat center 8px;
}

.popIcon ul li label {
    display: block;
}

.popIcon ul li span {
    display: block;
    color: @select-font-color;
    font-weight: 700;
}

.panel-right {
    position: relative;
    float: right;
    width: 455px;
    height: 400px;
    .noPhoto {
        position: absolute;
        width: 99%;
        height: 99%;
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
        margin: auto;
    }
}

.swiper-wrapper {
    height: 320px;
}

.swiper-slide {
    background-size: cover;
    background-position: center;
}

.gallery-top-livething {
    height: 80%!important;
    width: 100%;

    .swiper-button-white {
        width: 45px;
        height: 30px;
    }
}

.gallery-thumbs-livething {
    height: 20%!important;
    box-sizing: border-box;
    padding: 5px 0;
    .swiper-button-white {
        width: 30px;
        height: 20px;
        top: 30px;
    }
    .swiper-wrapper {
        position: relative;
        right: 30px;
        height: 62px;
        margin-top: 3.5px;
    }
}

.gallery-thumbs-livething .swiper-slide {
    width: 25%;
    height: 100%;
    opacity: 0.4;
}

.gallery-thumbs-livething .swiper-slide-active {
    opacity: 1;
}

/*big*/
.big .geologic-hazard {
    width: 800px;
    .panel-left {
        width: 256px;
        ul li {
            line-height: 34px;
        }
    }
    .popIcon ul li span {
        font-size: @font-big;
    }
    .panel-right {
        width: 520px;
    }
    .img-null img {
        width: 520px;
        height: 475px;
    }
}

.big .live-thing {
    width: 700px;

}

.big .panel-left {
    width: 215px;
}

.big .panel-right {
    padding: 5px;
}

.big .popIcon ul li label {
    margin: 5px 0px;
}

.big .popIcon ul li span {
    margin: 5px 0px;
}
</style>
