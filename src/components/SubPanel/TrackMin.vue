<template>
    <div class="track-min" ref="track-min-panel">
        <div class="title" ref="track-title">
            <span>发布信息追踪</span>
            <a class="close" @click="close"></a>
            <a class="big" @click="openTrack"></a>
        </div>
        <div class="line"></div>
        <div class="little">
            <template v-if="!complete">
                <div class="noData">
                    数据加载中...
                </div>
            </template>
            <template v-else>
                <ul class="clearfix">
                    <li>灾害：<label :title="item.eventType">{{ item.eventType }}</label></li>
                    <li>级别：<label :title="item.eventLevel">{{ item.eventLevel }}</label></li>
                    <li>渠道：<label :title="item.channel">{{ item.channel }}</label></li>
                    <li>正文：<label :title="item.msg">{{ item.msg }}</label></li>
                    <li>状态：<label class="focus" :title="item.status">{{ item.status }}</label></li>
                </ul>
            </template>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {
    name: 'TrackMin',
    data() {
        return {
            complete: false,
            item: {
                eventType: '',
                eventLevel: '',
                channel: '',
                msg: '',
                status: ''
            }
        };
    },
    computed: {
        ...mapState({
            id: status => status.trackMin.id
        })
    },
    watch: {
        bigScreen(bool) {
            this.getTracks();
        },
        id() {
            this.getTrack();
        }
    },
    methods: {
        ...mapActions(['updateParam']),

        openTrack() {
            this.updateParam([ 'toolsBar', { track: true } ]);
            this.close();
        },
        close() {
            this.updateParam([ 'trackMin', { status: false, id: null } ]);
        },
        getTrack() {
            const url = sysconfig.TESTPATH + '/track/listMessageTrack';
            const param = { page: 1, onePageNum: 1, msgId: this.id };
            this.complete = false
            utils.get(url, param).then((json) => {
                if (!!json.data.resp[0]) {
                    let resp = json.data.resp[0];
                    this.item.status = resp.msg;
                    resp.list.forEach(map => {
                        if (map.text === '灾害：') this.item.eventType = map.value;
                        if (map.text === '级别：') this.item.eventLevel = map.value;
                        if (map.text === '渠道：') this.item.channel = map.value;
                        if (map.text === '正文：') this.item.msg = map.value;
                    });
                    this.complete = true
                }
            });
        }
    },
    mounted() {
        this.getTrack();
        WD.init(this.$refs['track-min-title'], this.$refs['track-min-panel'], lmap.map);
    },
    destroyed() {
        this.close();
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.icon-chose:before {
    position: relative;
    top: 6px;
    left: 1px;
}

.track-min {

    position: fixed;
    bottom: 30px;
    left: 2px;
    width: 330px;
    height: auto;
    background-color: #fff;
    box-shadow: @shadow;
    z-index: @panel-index;

    .big {
        position: absolute;
        right: 16px;
        height: 20px;
        width: 20px;
        display: inline-block;
        zoom: 1;
        cursor: pointer;
        &::before {
            content: '';
            display: inline-block;
            position: relative;
            width: 8px;
            height: 8px;
            bottom: 2px;
            border: 1px solid #bbb;
        }
    }


    .little {
        width: 97%;
        margin: 4px;
        // height: 112px;
        border: 1px solid #ccc;
        float: left;
        .noData {
            width: 100%;
            height: 112px;
            text-align: center;
            line-height: 112px;            
        }
        ul li {
            float: left;
            width: 100%;
            margin: 3px;
            text-align: left;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
    }

    .line {
        height: 48px;
        background: url('../../assets/img/common/320.png') no-repeat center;

    }

    .focus {
        color: red;
    }
}

.big .track {
    width: 800px;
    .track-chose {
        .height-big();
    }
    .line {
        width: 775px;
        height: 96px;
        ul li {
            margin-top: 8px;
            a {
                margin-top: 4px;
                width: 110px;
                right: -52px;
            }
            &:first-child a {
                left: -56px;
            }
            &:nth-child(2) {
                width: 360px;
            }
        }
    }
    .track-content {
        .track-select {
            ul li {
                margin: -8px 4px;
            }
        }
    }
    .icon-chose:before {
        position: relative;
        top: 10px;
        left: 1px;
    }
    .control {
        .height-big();
    }
    .btn {
        box-sizing: border-box;
        .height-big();
    }
}
.big .track-min .close {
     height: 36px;
}
</style>
