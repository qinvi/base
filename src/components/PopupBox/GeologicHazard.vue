<template>
    <div class="geologic-hazard" ref="poi-box">
        <a class="close" @click="close()"></a>
        <div class="title" ref="poi-title">地质灾害风险隐患点：{{ item.address }}</div>
        <div class="panel-left popIcon">
            <ul>
                <li class="li-before dpop">
                    <label>人员伤亡</label>
                    <span>{{ item.dpop }}死{{ item.hpop }}伤</span>
                </li>
                <li class="li-before epop">
                    <label>影响群众</label>
                    <span>{{ item.epop }}人</span>
                </li>
                <li class="li-before loss">
                    <label>经济损失</label>
                    <span>{{ item.loss }}(万元)</span>
                </li>
                <li class="li-before level">
                    <label>灾害等级</label>
                    <span>{{ item.level }}</span>
                </li>
                <li :title="item.address ">行政区域：{{ item.address }}</li>
                <li :title="item.principal ">责任人：{{ item.principal }}</li>
                <li :title="item.tele ">电话：{{ item.tele }}</li>
                <li :title="item.areaCode  + '-' + item.id ">事件编号：{{ item.areaCode + '-' + item.id }}</li>
                <li :title="pubTime">调查时间：{{ pubTime }}</li>
                <li :title="item.lon + ', ' + item.lat">经纬度：{{ item.lon }}, {{ item.lat }}</li>
                <li :title="item.detail ">防治对策：{{ item.detail }}</li>
            </ul>
        </div>
        <div class="panel-right">
            <div v-show="noPhoto" class="noPhoto">
                <img :src="item.picList[0]" alt="暂无图片" class="noPhoto">
            </div>
            <div v-show="!noPhoto" class="hasPhoto">
                <div class="swiper-container gallery-top-geologic" id="geologicGallery">
                    <div class="swiper-wrapper" v-if="galleryShow">
                        <div class="swiper-slide" v-for="(item, key) of item.picList" :key="key" @click="galleryImage(item)" :style="{ backgroundImage: `url(${item})` }"></div>
                    </div>
                    <div class="swiper-button-next swiper-button-next-geologic swiper-button-white"></div>
                    <div class="swiper-button-prev swiper-button-prev-geologic swiper-button-white"></div>
                </div>
                <div class="swiper-container gallery-thumbs-geologic">
                    <div id="geologicLoaded" class="swiper-wrapper" v-if="galleryShow">
                        <div class="swiper-slide swiper-slide-small" v-for="(item, key) of item.picList" :key="key" :style="{ backgroundImage: `url(${item})` }"></div>
                    </div>
                    <div class="swiper-button-next swiper-button-next-geologic swiper-button-white"></div>
                    <div class="swiper-button-prev swiper-button-prev-geologic swiper-button-white"></div>
                </div>

                <!-- <swiper :options="swiperOptionTop" class="gallery-top" ref="swiperTop">
                    <swiper-slide v-for="(item, key) of item.picList" :key="key" :style="{ backgroundImage: `url(${item})` }"></swiper-slide>
                    <div class="swiper-button-next swiper-button-white" slot="button-next"></div>
                    <div class="swiper-button-prev swiper-button-white" slot="button-prev"></div>
                </swiper>
                <swiper :options="swiperOptionThumbs" class="gallery-thumbs" ref="swiperThumbs">
                    <swiper-slide v-for="(item, key) of item.picList" :key="key" :style="{ backgroundImage: `url(${item})` }"></swiper-slide>
                    <div class="swiper-button-next swiper-button-white" slot="button-next"></div>
                    <div class="swiper-button-prev swiper-button-white" slot="button-prev"></div>
                </swiper> -->
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
// import { swiper, swiperSlide } from 'vue-awesome-swiper';
import SWIPER from 'swiper/dist/js/swiper.js';
import ImagesLoaded from 'imagesloaded';
import 'swiper/dist/css/swiper.css';
import WinDrag from '../../utils/tools/WinDrag.js';

export default {
    name: 'PopupBoxGeologicHazard',
    // props: [ 'data' ],
    // components: { swiper, 'swiper-slide': swiperSlide },
    data() {
        return {
            item: {},
            swiperOptionTop: {
                spaceBetween: 5,
                loop: true,
                loopedSlides: 5,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            },
            swiperOptionThumbs: {
                spaceBetween: 5,
                slidesPerView: 'auto',
                loop: true,
                loopedSlides: 5,
                slideToClickedSlide: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                }
            },
            IP: sysconfig.TESTIP,
            galleryTop: null,
            galleryThumbs: null,
            galleryShow: true,
            noPhoto: false
        };
    },
    computed: {
        ...mapState({
            ndata: state => {
                return state.geologicHazard.data || {};
            },
            data: state => state.normalPoiDetail.data,
            type: state => state.normalPoiDetail.type,
            removeSelectPoint: state => state.selectPoint.remove,
            callbackActiveType: state => state.selectPoint.callbackActiveType,
            galleryType: state => state.imgGallery.type
        }),
        pubTime () {
            const time = this.item.ctTime;
            if (!time) {
                return '未知';
            } else {
                const template = (time.indexOf('--') !== -1) ? 'YYYY年' : 'YYYY年MM月DD日';
                return TU(time).format(template);
            }
        }
    },
    watch: {
        data() {
            this.item = {};
            this.item = Object.assign({}, this.ndata, this.data.data);
            if (!this.item.picList.length) {
                this.noPhoto = true;
                this.item.picList = [this.IP + '/topic/little/necImage/now-inform-0.png'];
            } else this.noPhoto = false;
            ImagesLoaded('#geologicLoaded').on('done', () => {
                this.newSwiper();
            });
            // if (!this.item.picList.length) {
            //     this.item.picList = [this.IP + '/topic/little/necImage/now-inform-0.png'];
            //     this.swiperOptionTop.loop = false;
            //     this.swiperOptionThumbs.loop = false;
            // } else {
            //     this.swiperOptionTop.loop = true;
            //     this.swiperOptionThumbs.loop = true;
            // }
        },
        ndata() {
            this.item = Object.assign({}, this.ndata, this.data.data);
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        close() {
            // this.$emit('close');
            const t = this.callbackActiveType();
            if (t.normal === 'geologicHazard') this.removeSelectPoint('normal', 'geologicHazard');
            this.updateParam(['normalPoiDetail', {type: ''}]);
        },

        /**
         * 放大图片
         */
        galleryImage(item) {
            this.updateParam(['imgGallery', { image: item, type: 'geologic' }]);
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
                    this.galleryTop = new SWIPER('.gallery-top-geologic', {
                        init: true,
                        spaceBetween: 10,
                        speed: 1300,
                        autoplay: {
                            delay: 2500,
                            disableOnInteraction: false
                        },
                        navigation: {
                            nextEl: '.swiper-button-next-geologic',
                            prevEl: '.swiper-button-prev-geologic'
                        }
                    });
                    this.galleryThumbs = new SWIPER('.gallery-thumbs-geologic', {
                        init: true,
                        spaceBetween: 10,
                        centeredSlides: true,
                        slidesOffsetBefore: -153,
                        slidesPerView: 'auto',
                        touchRatio: 0.2,
                        slideToClickedSlide: true,
                        navigation: {
                            nextEl: '.swiper-button-next-geologic',
                            prevEl: '.swiper-button-prev-geologic'
                        }
                    });
                    this.galleryTop.controller.control = this.galleryThumbs;
                    this.galleryThumbs.controller.control = this.galleryTop;
                });
            }, 0);
        }
    },
    created() {
        this.item = Object.assign({}, this.ndata, this.data.data);
        if (!this.item.picList.length) {
            this.noPhoto = true;
            this.item.picList = [this.IP + '/topic/little/necImage/now-inform-0.png'];
        } else this.noPhoto = false;
        // this.item = Object.assign({}, this.ndata, this.data.data);
        // if (!this.item.picList.length) {
        //     this.item.picList = [this.IP + '/topic/little/necImage/now-inform-0.png'];
        //     this.swiperOptionTop.loop = false;
        //     this.swiperOptionThumbs.loop = false;
        // }
        // this.swiperOptionTop.loopedSlides = this.item.picList.length;
        // this.swiperOptionThumbs.loopedSlides = this.item.picList.length;
    },
    mounted() {
        WinDrag.init(this.$refs['poi-title'], this.$refs['poi-box'], lmap.map);
        ImagesLoaded('#geologicLoaded').on('done', () => {
            this.newSwiper();
        });
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
        if (this.galleryType === 'geologic') this.updateParam(['imgGallery', { image: null, type: '' }]);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.geologic-hazard {
    width: 700px;
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

.title {
    padding-right: 3em;
}

.panel-left {
    float: left;
    /*width: 159px;*/
    width: 180px;
    height: auto;
    overflow: hidden;
    margin-left: 10px;
}

.popIcon ul {
    width: 100%;
}

.popIcon ul li {
    line-height: 26px;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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
    background: url('../../assets/img/dis/04.png') no-repeat center 8px;
}

.popIcon ul li.epop:before {
    background: url('../../assets/img/dis/03.png') no-repeat center 8px;
}

.popIcon ul li.loss:before {
    background: url('../../assets/img/dis/01.png') no-repeat center 8px;
}

.popIcon ul li.level:before {
    background: url('../../assets/img/dis/02.png') no-repeat center 8px;
}

.popIcon ul li label {
    display: block;
}

.popIcon ul li span {
    display: block;
    color: @select-font-color;
    font-size: 14px;
    font-weight: 700;
}

.panel-right {
    position: relative;
    float: right;
    width: 490px;
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
    .hasPhoto {
        height: 100%;
    }
}

/*.swiper-wrapper {
    height: 350px;
}*/

.swiper-slide {
    background-size: cover;
    background-position: center;
}
/*.swiper-slide-small {
    margin-right: 5px !important;
}*/

.gallery-top-geologic {
    height: 80%!important;
    width: 100%;

    .swiper-button-white {
        width: 30px;
        height: 20px;
    }
}

.gallery-thumbs-geologic {
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

.gallery-thumbs-geologic .swiper-slide {
    width: 25%;
    height: 100%;
    opacity: 0.4;
}

.gallery-thumbs-geologic .swiper-slide-active {
    opacity: 1;
    border: 1px solid #f00;
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
        height: 475px;

        .hasPhoto {
            #geologicGallery {
                .swiper-wrapper {
                    height: 370px;
                }
            }

            #geologicLoaded {
                height: 80px;
            }

            .gallery-thumbs-geologic {
                .swiper-button-white {
                    top: 40px;
                }
                .swiper-wrapper {
                    right: 40px;
                }
            }
        }
    }
    .img-null img {
        width: 520px;
        height: 475px;
    }
}
</style>
