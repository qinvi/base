<template>
    <div class="imgSwiper">
        <div v-if="ImgSrc.length">
            <div class="swipeBigger">
                <label class="prepic" @click="toPage(0)"></label>
                <label class="nextpic" @click="toPage(1)"></label>
                <ul :id="'child' + animateName">
                    <li v-for="item in ImgSrc">
                        <img :src="item" alt="">
                    </li>
                </ul>
            </div>
            <div class="swipeSmaller">
                <ul>
                    <li v-for="item in ImgSrc">
                        <img :src="item" alt="">
                    </li>
                </ul>
            </div>
        </div>
        <div v-else>
            11
        </div>
    </div>
</template>
<script>
    export default {
        name: 'ImgSwipe',
        props: [ 'ImgSrc', 'stayTime', 'animateName' ],
        data() {
            return {
                slideImgs: [
                    'http://10.148.16.56//agricultural//201711//59288//B//V59288_201711B2.jpg',
                    'http://10.148.16.56//agricultural//201711//59288//B//V59288_201711B1.jpg'
                ],
                index: 0 // 当前图片列表下标
            }
        },
        watch: {
            ImgSrc() {
                this.initSlide();
            }
        },
        methods: {

            /**
             * 初始化不需要setter的变量
             */
            initConstData() {
                this.timer = null;
                this.preSheet = null; // 父sheet
            },

            /**
             * 上一张/下一张
             *
             * @param {number} i 0:上一张；1：下一张
             */
            toPage(i) {
                this.preNext = true;
                // console.info(this.index);
                if (i) { // 下一张
                    this.index = (this.index + 1) % this.ImgSrc.length;
                } else { // 上一张
                    this.index = (this.index - 1) < 0 ? (this.ImgSrc.length - 1) : (this.index - 1);
                }
                if (!!this.timer) window.clearTimeout(this.timer)
                this.timer = window.setTimeout(() => {
                    this.slideStyle(this.index);
                }, 1000);
            },

            initSlide() {
                this.$nextTick(() => {
                    let w1 = document.getElementsByClassName('imgSwiper')[0].offsetWidth;
                    let w = w1 * this.ImgSrc.length;
                    document.getElementById('child' + this.animateName).style.width = w + 'px';
                    this.trendsOffset = [new Array(this.ImgSrc.length - 1)];
                    for (let i = 0; i < this.ImgSrc.length; i++) {
                        this.trendsOffset[i] = -i * w1 + 'px';
                    }
                    this.slideStyle(0); // 计算走马灯偏移的left值
                });
            },

            /**
             * 监听幻灯片动画完成情况
             */
            slideChunk() {
                document.getElementById('child' + this.animateName).addEventListener('webkitAnimationEnd', () => {
                    this.$nextTick(() => {
                        document.getElementById('child' + this.animateName).style.left = this.trendsOffset[this.index];
                        this.index = (this.index + 1) % this.ImgSrc.length;
                        // console.info('--------------' + this.index);
                        this.slideStyle(this.index);
                    });
                });
            },

            /**
             * 计算lamplist的width
             *
             * @param {number} animateNum 动画编号
             */
            slideStyle(animateNum) {
                let rule, cssRule;
                let ss = document.sheet || document.styleSheets;
                let parentSheet, index, animateName;
                if (this.animateNamePre) { // 获取上个动画的cssRule、保持一个动画cssRule完成走马灯动画
                    for (let i = 0, len = ss.length; i < len; ++i) {
                        for (let x = 0; x < ss[i].cssRules.length; ++x) {
                            rule = ss[i].cssRules[x];
                            if (rule.name === this.animateNamePre && rule.type === CSSRule.KEYFRAMES_RULE) {
                                parentSheet = ss[i];
                                index = x;
                                cssRule = rule;
                                this.preSheet = i;
                            }
                        }
                    }
                }
                let token = window.WebKitCSSKeyframesRule ? '-webkit-' : '';
                if (!parentSheet) {
                    let style = document.createElement('style');
                    document.head.appendChild(style);
                    parentSheet = style.sheet;
                    index = 0;
                }
                this.animateNamePre = animateName = this.animateName + '' + animateNum;
                this.clearAnimate(parentSheet, index);
                parentSheet.insertRule('@' + token + 'keyframes ' + animateName + ' {}', index);
                cssRule = parentSheet.cssRules[index];
                (cssRule.insertRule || cssRule.appendRule).call(cssRule, '0% {}');
                (cssRule.insertRule || cssRule.appendRule).call(cssRule, '100% {}');
                cssRule.cssRules[0].style.left = document.getElementById('child' + this.animateName).style.left;
                cssRule.cssRules[1].style.left = this.trendsOffset[animateNum];
                let div = document.getElementById('child' + this.animateName);
                let stayTime = this.preNext ? 0 : this.stayTime;
                this.preNext = false;
                div.style.animation = div.style.WebkitAnimation = animateName + ' ' + '1s linear ' + stayTime + 's 1'; // infinite
            },

            /**
             * 清除当前动画
             *
             * @param {object} parentSheet 父styleSheet
             * @param {number} index 当前动画在cssStyleSheet的位置
             */
            clearAnimate(parentSheet, index) {
                if (!!parentSheet && parentSheet.cssRules.length) {
                    if (parentSheet.deleteRule) {
                        parentSheet.deleteRule(index);
                    } else if (parentSheet.removeRule) {
                        parentSheet.removeRule(index);
                    }
                }
            }
        },
        mounted() {
            this.slideChunk();
            this.initSlide();
        },
        destroyed() {
            this.ImgSrc = [];
        }
    }
</script>

<style lang='less' scoped>
.imgSwiper {
    .swipeBigger, .swipeSmaller {
        position: relative;
        width: 98%;
        overflow: hidden;
        margin-left: 1%;
        li {
            float: left;
        }
        ul {
            position: relative;
            // overflow: hidden;
        }
    }
    .swipeSmaller {
        ul {
            height: 63px;
        }
        li {
            height: 60px;
            margin: 0 5px 0 5px;
            img {
                width: 70px;
            }
        }
    }
    .swipeBigger {
        height: 330px;
        ul, li, img {
            height: 100%;
        }
        li {
            width: 427px;
        }
        .prepic, .nextpic {
            position: absolute;
            top: 50%;
            margin-top: -13px;
            height: 26px;
            width: 26px;
            cursor: pointer;
            z-index: @panel-index;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 100%;
            transition: box-shadow 0.3s;
        }
        .nextpic {
            right: 5px;
        }
        .prepic {
            left: 5px;
        }
        .nextpic:before {
            content: "\FF1E";
        }
        .prepic:before {
            content: "\FF1C";
        }
        .prepic:before, .nextpic:before{
            position: absolute;
            display: inline-block;
            top: 0;
            left: 0;
            width: 26px;
            height: 26px;
            line-height: 26px;
            text-align: center;
            color: #fff;
            border-radius: 100%;
        }
        .prepic:hover, .nextpic:hover {
            background: rgba(0, 0, 0, 0.8);
            box-shadow: 0 0px 15px 0 #ffffff;
        }
    }
}
</style>
