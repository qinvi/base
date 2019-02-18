<template>
    <div class="poiPop" ref="poi-video">
        <a class="close" @click="close()"></a>
        <div class="title nullBg" ref="poi-title" :title="poiVideo.text">
            <label>{{ poiVideo.text || '' }}</label>
        </div>
        <div class="popTab">
            <div class="title">基本信息</div>
            <div class="popTab-box">
                <div>
                    <ul>
                        <li :title="poiVideo.chanel">通道：{{poiVideo.chanel || '--'}}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
    name: 'PoiVideo',
    props: ['poiVideo'],
    computed: {
        ...mapState({
            code: state => state.sys.code,
            activeCode: state => state.selectPoint.areaCode
        })
    },
    watch: {
        code(val) {
            if (this.activeCode && !this.activeCode.includes(val)) this.close();
        }
    },
    methods: {
        close() {
            this.$emit('close', {'type': this.poiVideo.type})
        }
    },
    mounted() {
        WD.init(this.$refs['poi-video'], this.$refs['poi-video'], lmap.map);
    },
    updated: function () {
        const zIndex = this.$el.style.zIndex

        if (zIndex !== '') {
            this.$el.style.zIndex = WD.zIndex + 1
            WD.zIndex += 1
        }
    }
}
</script>
<style scoped lang='less'>
@import "../../assets/css/common.less";
.poiPop {
    width: 427px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    right: 0;
    top: 0px;
    background: #fff;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
    transition: box-shadow 0.3s;
    .nullBg {
        background: #fff;
    }
    .title {
        cursor: move;
        .height();
        text-align: left;
        padding-left: 5px;
        padding-right: 23px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .popTab {
        border: 1px solid #ccc;
        margin: 3px;
        height: auto;
        overflow: hidden;
        .title {
            cursor: auto;
        }
        .popTab-box {
            width: 100%;
            ul {
                width: 98%;
                margin: auto;
                margin-top: 3px;
                margin-bottom: 3px;
                min-height: 30px;
                max-height: 300px;
                overflow-y: auto;
            }
            li {
                // height: 22px;
                line-height: 22px;
                width: 49%;
                margin-right: 1%;
                text-align: left;
                float: left;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
    }
}

.big {
    .poiPop {
        .title {
            .height(@height-big);
        }

        .popTab {
            .popTab-box {
                ul {
                    li {
                        line-height: @height-big;
                    }
                }
            }
        }
    }
}
</style>
