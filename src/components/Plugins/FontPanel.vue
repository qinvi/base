<template>
    <div class="font-panel">
        <span class="font" @click="setPanelStatus()"></span>
        <div class="font-color" :style="{ background : fontColor }" @click="setPanelStatus()"></div>
        <div class="panel" v-show="status">
            <v-color-panel @touch="selectColor"></v-color-panel>
            <input class="font-size-input" type="text" v-model="fontSize"/>
            <div class="font-select">
                <v-dropdown :list="fontItems" :tip="fontItems[0].text" class="dropdown-font" @select="setFont"></v-dropdown>
                <!-- <v-select @select="setFont" :tip="fontItems[0].text" :list="fontItems"></v-select> -->
            </div>
            <div class="site-name">
                <!-- <input id="site-name-checkbox" class="site-checkbox checkbox-btn" type="checkbox" v-model="siteNameStatus" />
                <label for="site-name-checkbox">站点名称</label> -->
                <a :class="[ 'btn', { select: siteNameStatus } ]" @click="showName()">站点名称</a>
            </div>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import ColorPanel from '../Plugins/ColorPanel';
import Dropdown from '../Plugins/Dropdown';

export default {
    components: {
        'v-color-panel': ColorPanel,
        'v-dropdown': Dropdown
    },

    computed: {
        ...mapState({
            siteNameStatus: state => state.decideServe.siteNameStatus,
            status: state => state.decideServe.status,
            font: state => state.decideServe.font
        })
    },

    data() {
        return {
            fontItems: [
                { text: '黑体', value: '黑体' },
                { text: '宋体', value: '宋体' }
            ],
            fontColor: '#000000',
            fontSize: '12'
        };
    },

    watch: {
        fontSize(size) {
            if (!!size) {
                if (this.timeOut) clearTimeout(this.timeOut);
                this.timeOut = setTimeout(() => {
                    const font = Object.assign({}, this.font);
                    font.size = size + '';
                    this.updateParam([ 'decideServe', { font } ]);
                }, 1000);
            }
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        selectColor(item) {
            if (Object.keys(item) === 0) return;
            const { color } = item;
            const font = Object.assign({}, this.font);
            font.color = color;
            this.fontColor = color;
            this.updateParam([ 'decideServe', { font } ]);
        },

        setPanelStatus() {
            this.updateParam([ 'decideServe', { status: true } ]);
        },

        setFont(item) {
            const { value } = item;
            const font = Object.assign({}, this.font);
            font.style = value;
            this.updateParam([ 'decideServe', { font } ]);
        },

        showName() {
            this.updateParam([ 'decideServe', { siteNameStatus: !this.siteNameStatus } ]);
        }
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

.font-panel {
    position: relative;
    float: left;

    .panel {
        float: left;
    }

    .font-color {
        width: 30px;
        height: 30px;
        float: left;
        cursor: pointer;
    }

    .font-size-input {
        float: left;
        border: 1px solid #dadada;
        width: 20px;
        margin: 0px 3px 0;
        height: 26px;
    }

    .font {
        float: left;
        width: 30px;
        height: 30px;
        background: url('../../assets/img/common/A.png') no-repeat center center;
    }

    .font-select {
        float: left;
        // width: 45px;
        height: 30px;
        line-height: 30px;
        margin: 0px 3px 0;
    }

    .div-select cite {
        height: 30px;
        line-height: 30px;
    }

    .site-name {
        float: left;
        // margin-left: 6px;
        background: #fff;
        a {
            float: left;
            color: @font-color;
        }
        .site-checkbox + label {
            height: 28px;
            line-height: 28px;
            margin-left: 5px;
        }
        .btn {
            height: 28px;
            line-height: 28px;
        }
        .select {
            background: @select-font-color;
            color: #fff;
        }
    }
}

.big {
    .font-panel {
        .font {
            width: 36px;
            .height(36px);
        }

        .font-color {
            width: 36px;
            .height(36px);
        }

        .font-size-input {
            width: 36px;
            height: 36px;
            box-sizing: border-box;
            font-size: 20px;
            text-align: center;
        }

        .site-name {
            .btn {
                box-sizing: border-box;
                .height-big();
            }
        }
    }
}
</style>
