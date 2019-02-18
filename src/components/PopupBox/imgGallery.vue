<template>
    <div class="galleryImages">
        <span class="galleryClose" @click="cancel()">×</span>
        <div class="swiper-container imgGallery-top">
            <img class="swiper-slide" :src="image" alt="">
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
export default {
    data() {
        return {
            galleryTop: null
        }
    },
    computed: {
        ...mapState({
            image: state => state.imgGallery.image
        })
    },
    watch: {
    },
    methods: {
        ...mapActions([ 'updateParam' ]),
        cancel() {
            this.updateParam(['imgGallery', { image: null, type: '' }]);
        }
    },
    mounted() {
    }
}
</script>

<style lang="less" scoped>
@import '../../assets/css/common.less';
.galleryImages {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 9999;
    overflow: hidden;
    background: #000;
    background: rgba(0,0,0,.5);
    direction: ltr;
    -ms-touch-action: none;
    touch-action: none;
    left: 0px;
    top: 0px;
    right: 0px;
    bottom: 0px;
    .galleryClose {
        position: absolute;
        right: 19%;
        top: 79px;
        display: block;
        // background: red;
        width: 38px;
        height: 38px;
        font-size: 38px;
        text-align: center;
        line-height: 38px;
        color: #fff;
        cursor: pointer;
    }
    .swiper-container {
        width: 57%;
        height: 100%;
        margin: 0 auto;
        .swiper-slide {
            position: absolute;
            margin: auto!important;
            width: 100%!important;
            height: 67%;
            top: 0px;
            right: 0px;
            bottom: 0px;
            left: 0px;
            background-size: cover;
            background-position: center;
        }
    }
}
</style>
