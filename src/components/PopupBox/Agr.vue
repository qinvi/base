<template>
    <div class="agr" ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title"><label>{{ titem.siteName }}</label></div>
        <ul class="agr-list">
            <li v-for="(item, key) of titem.typeInfo" @click="select(item, key)" :class="{ select: item.status }" :key="key">
                <i :class="item.type"></i>
                <span>{{ typeMap[item.type] }}<em class="em-select"></em></span>
            </li>
        </ul>
        <div class="agr-content">
            <div class="agr-art">
                <p>{{ content }}</p>
            </div>
        </div>
        <div class="pic-swiper">
            <div class="swiper-container gallery-top-agr" id="agrGallery">
                <div class="swiper-wrapper" v-if="galleryShow">
                    <img class="swiper-slide" v-for="(item, key) of pics" :key="key" @click="galleryImage(item)" :src="item" @error="defaultImgFunc($event, key)"/>
                </div>
                <div class="swiper-button-next swiper-button-next-agr swiper-button-white"></div>
                <div class="swiper-button-prev swiper-button-prev-agr swiper-button-white"></div>
            </div>
            <div class="swiper-container gallery-thumbs-agr">
                <div id="agrLoaded" class="swiper-wrapper" v-if="galleryShow">
                    <img class="swiper-slide" v-for="(item, key) of pics" :key="key" :src="item" @error="defaultImgFunc($event, key)"/>
                </div>
                <div class="swiper-button-next swiper-button-next-agr swiper-button-white swiper-modifyTop"></div>
                <div class="swiper-button-prev swiper-button-prev-agr swiper-button-white swiper-modifyTop"></div>
            </div>

            <!-- <swiper :options="swiperOptionTop" class="gallery-top" ref="swiperTop">
                <swiper-slide v-for="(item, key) of pics" :key="key" :style="{ backgroundImage: `url(${item})` }"></swiper-slide>
                <div class="swiper-button-next swiper-button-white" slot="button-next"></div>
                <div class="swiper-button-prev swiper-button-white" slot="button-prev"></div>
            </swiper>

            <swiper :options="swiperOptionThumbs" class="gallery-thumbs" ref="swiperThumbs">
                <swiper-slide v-for="(item, key) of pics" :key="key" :style="{ backgroundImage: `url(${item})` }"></swiper-slide>
            </swiper> -->
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
// import { swiper, swiperSlide } from 'vue-awesome-swiper';
import SWIPER from 'swiper/dist/js/swiper.js';
import ImagesLoaded from 'imagesloaded';
import PS from 'perfect-scrollbar';

import 'perfect-scrollbar/css/perfect-scrollbar.css';
import 'swiper/dist/css/swiper.css';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    name: 'PopupBoxAgr',
    props: [ 'data' ],
    // components: { swiper, 'swiper-slide': swiperSlide },
    data() {
        return {
            typeMap: { F: '水果', V: '蔬菜', R: '水稻', P: '花生', T: '黄烟', o: '其它', O: '其它' },
            content: null,
            pics: null,
            titem: {},
            swiperOptionTop: {
                spaceBetween: 5,
                loop: true,
                loopedSlides: 5, // looped slides should be the same
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            },
            swiperOptionThumbs: {
                spaceBetween: 5,
                slidesPerView: 'auto',
                loop: true,
                loopedSlides: 5, // looped slides should be the same
                slideToClickedSlide: true
            },
            galleryShow: true,
            galleryTop: null,
            galleryThumbs: null
        };
    },
    computed: {
        ...mapState({
            ndata: state => {
                return state.ship.data || {};
            },
            bigScreen: state => state.toolsBar.bigScreen
        })
    },
    watch: {
        data() {
            this.init();
        },
        ndata() {
            this.init();
        },
        bigScreen() {
            this.init();
            this.select(this.lastImg.item, this.lastImg.index)
        }
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        initConstData() {
            this.last = null;
            this.lastImg = { item: null, index: -1 }
        },
        defaultImgFunc(e, key) {
            e.target.src = sysconfig.TESTIP + '/topic/little/necImage/now-inform-0.png'
            this.pics[key] = sysconfig.TESTIP + '/topic/little/necImage/now-inform-0.png'
            this.pics = Object.assign([], this.pics)
        },
        close() {
            this.$emit('close');
        },
        init() {
            this.titem = Object.assign({}, this.ndata, this.data);
            this.select(this.titem.typeInfo[0], 0);
        },
        select(item, index) {
            this.lastImg = { item, index }
            const data = this.titem.typeInfo[index].typeList[0];
            this.content = data.content;
            this.pics = data.picList;
            /* eslint-disable no-new */
            new PS('.agr-art');
            ImagesLoaded('#agrLoaded').on('done', (e) => {
                this.newSwiper();
            });
            if (!item.status) {
                if (!!this.last) this.last.status = false;
                item.status = true;
            }
            this.last = item;
        },

        /**
         * 放大图片
         */
        galleryImage(item) {
            this.updateParam(['imgGallery', { image: item, type: 'agr' }]);
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
                    this.galleryTop = new SWIPER('.gallery-top-agr', {
                        init: true,
                        spaceBetween: 10,
                        speed: 1300,
                        autoplay: {
                            delay: 2500,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.swiper-button-next-agr',
                            prevEl: '.swiper-button-prev-agr'
                        }
                    });
                    this.galleryThumbs = new SWIPER('.gallery-thumbs-agr', {
                        init: true,
                        spaceBetween: 10,
                        centeredSlides: true,
                        slidesOffsetBefore: this.bigScreen ? -215 : -152, // -152 215
                        slidesPerView: 'auto',
                        touchRatio: 0.2,
                        slideToClickedSlide: true,
                        navigation: {
                            nextEl: '.swiper-button-next-agr',
                            prevEl: '.swiper-button-prev-agr'
                        }
                    });
                    this.galleryTop.controller.control = this.galleryThumbs;
                    this.galleryThumbs.controller.control = this.galleryTop;
                });
            }, 0);
        }
    },
    created() {
        this.titem = Object.assign({}, this.ndata, this.data);
        this.swiperOptionTop.loopedSlides = this.titem.typeInfo[0].typeList[0].picList.length;
        this.swiperOptionThumbs.loopedSlides = this.titem.typeInfo[0].typeList[0].picList.length;
    },
    mounted() {
        WinDrag.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        this.initConstData()
        this.init();
        // this.$nextTick(() => {
        //     const swiperTop = this.$refs.swiperTop.swiper;
        //     const swiperThumbs = this.$refs.swiperThumbs.swiper;
        //     swiperTop.controller.control = swiperThumbs;
        //     swiperThumbs.controller.control = swiperTop;
        // })
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WinDrag.zIndex + 1
            WinDrag.zIndex += 1
        }
    },
    destroyed() {
        if (this.galleryType === 'agr') this.updateParam(['imgGallery', { image: null, type: '' }]);
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.agr {
    width: 427px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: @shadow;
}

.agr-content {
    margin: 3px;
    height: auto;
    overflow: hidden;
}

.agr-list {
    height: 20px;
    margin: 10px 5px;
}

.agr-list li {
    float: left;
    width: 16.6%;
    height: 20px;
    line-height: 20px;
    text-align: left;
    cursor: pointer;
}

.agr-list li i {
    background: url('../../assets/img/common/nongqing.png') no-repeat;
    display: inline-block;
    display: -moz-inline-stack;
    zoom: 1;
    *display: inline;
    width: 20px;
    height: 20px;
    float: left;
    margin-right: 2px;
}

.agr-list li i.F {
    background-position: -88px 0 !important;
}

.agr-list li i.V {
    background-position: -118px 0 !important;
}

.agr-list li i.R {
    background-position: -3px 0 !important;
}

.agr-list li i.P {
    background-position: -63px 0 !important;
}

.agr-list li i.T {
    background-position: -34px 0 !important;
}

.agr-list li i.o {
    background-position: -144px 2px !important;
}

.agr-list li i.O {
    background-position: -144px 2px !important;
}

.agr-list li span {
    position: relative;
    cursor: pointer;
}

.agr-list li span label {
    cursor: pointer;
}

.agr-list li:hover {
    color: @select-font-color;
}

.agr-list li.select {
    color: @select-font-color;
}

.agr-list li.select em {
    display: block;
    position: absolute;
    top: -3px;
    right: -14px;
    text-align: center;
}

.agr-list li:hover i.F,
.agr-list li.select i.F {
    background-position: -88px -22px !important;
}

.agr-list li:hover i.V,
.agr-list li.select i.V {
    background-position: -118px -22px !important;
}

.agr-list li:hover i.R,
.agr-list li.select i.R {
    background-position: -3px -22px !important;
}

.agr-list li:hover i.P,
.agr-list li.select i.P {
    background-position: -63px -22px !important;
}

.agr-list li:hover i.T,
.agr-list li.select i.T {
    background-position: -34px -22px !important;
}

.agr-list li:hover i.o,
.agr-list li.select i.o {
    background-position: -144px -22px !important;
}

.agr-list li:hover i.O,
.agr-list li.select i.O {
    background-position: -144px -22px !important;
}

.agr-art {
    position: relative;
    padding-right: 2px;
    height: auto;
    clear: both;
    max-height: 124px;
    height: auto;
    overflow-y: auto;
    margin-bottom: 5px;
}

.agr-art p {
    width: 100%;
    text-indent: 2em;
    line-height: 22px;
}

.pic-swiper {
    float: right;
    width: 100%;
    height: 360px;
}

.swiper-wrapper {
    height: 100%;
}

.swiper-slide {
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
}

.gallery-top-agr {
    height: 80%!important;
    width: 100%;
}

.gallery-thumbs-agr {
    height: 20%!important;
    box-sizing: border-box;
    padding: 5px 0;
    .swiper-wrapper {
        // height: 62px;
    }
    .swiper-modifyTop {
        top: 38%;
    }
}

.gallery-thumbs-agr .swiper-slide {
    width: 25%;
    height: 100%;
    opacity: 0.4;
}

.gallery-thumbs-agr .swiper-slide-active {
    opacity: 1;
}
.gallery-top-agr .swiper-button-white ,.gallery-thumbs-agr .swiper-button-white{
    width:30px;
    height: 20px;
}
.big .agr {
    width: 600px;
    .agr-list {
        height: 24px;
    }
    .agr-art {
        max-height: 166px;
    }
    .agr-art p {
        line-height: 30px;
    }
    .pic-swiper {
        height: 506px;
    }
}
</style>
