<template>
    <div class="town-name">
        <ul class="clearfix">
            <li>字体大小<input type="text" class="font-text" v-model="fontSize"></li>
            <li>
                <input id="highlight" type="checkbox" class="checkbox" v-model="highlight">
                <label for="highlight">高亮显示</label>
            </li>
            <li>
                <input id="streetName" type="checkbox" class="checkbox" v-model="showStreet">
                <label for="streetName">显示街道名称</label>
            </li>
            <li><a class="btn hover" @click="exportTable">显示列表</a></li>
        </ul>
        <v-town-list v-if="exportList.status" :data="exportList.data" :type="type" :cacheId="cacheId" :street="showStreet" @close="exportList.status = false"></v-town-list>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { Model as MD } from '@/utils/tools/Model';
import TownList from '@/components/Plugins/TownList';

export default {
    name: 'TownName',
    props: [ 'type', 'cacheId', 'refresh' ],
    components: {
        'v-town-list': TownList
    },
    data() {
        return {
            fontSize: 14,
            highlight: true,
            showStreet: false,
            exportList: {
                status: false,
                data: []
            }
        };
    },
    computed: {
        ...mapState({
            param: state => state.model.param,
            pType: state => state.model.type
        })
    },
    watch: {
        cacheId() {
            if (this.exportList.status) this.exportTable();
        },
        param() {
            this.renderStatic();
        },
        highlight() {
            this.renderStatic();
        },
        showStreet() {
            this.renderStatic();
        },
        fontSize() {
            this.renderStatic();
        },
        refresh() {
            this.renderStatic();
        }
    },
    methods: {
        ...mapActions(['updateParam']),
        /**
         * 初始化默认参数
         */
        initConstData() {
            this.timer = null;
            this.isModel = this.type === 'model';
        },

        renderStatic() {
            utils.clearTimer(this.timer);
            this.timer = window.setTimeout(() => {
                const highlight = !!this.highlight;

                const showStreet = !!this.showStreet;

                const typeParam = this.isModel ? this.param : { cacheId: this.cacheId };

                const reqParam = Object.assign({}, typeParam, { fontSize: this.fontSize, highlight, showStreet, CRS: sysconfig.SYSTEM_PROJECTION });

                const imageParam = lmap.util.getImageParam(reqParam, lmap.map);

                const childUrl = this.isModel ? MD.url[this.pType].townName : '/atwill/getTownNameImage';

                const url = sysconfig.TESTPATH + childUrl + '?' + utils.serializeWithAuth(imageParam);

                const extent = lmap.util.getExtent(lmap.map);

                const param = { url, moving: true, extent };

                if (!!this.static) lmap.image.updateStatic(this.static, param, 'url');
                else this.static = lmap.image.Static(lmap.map, param, 'poi', 'url');
            }, 80);
        },

        removeStatic() {
            lmap.layer.remove(lmap.map, this.static);
        },

        exportTable() {
            const url = sysconfig.TESTPATH + (this.isModel ? MD.url[this.pType].townTable : '/atwill/getAtwillTownTable');
            const reqParam = this.isModel ? this.param : { cacheId: this.cacheId, code: this.param.code };
            const param = Object.assign({ showStreet: this.showStreet }, reqParam);
            utils.GET(url, param).then((json) => {
                this.exportList.data = json.data.townMap;
                this.exportList.status = true;
            });
        }
    },
    mounted() {
        this.initConstData();
        this.renderStatic();
        lmap.map.on('moveend', this.renderStatic);
        lmap.view.on('change:resolution', this.renderStatic);
    },
    destroyed() {
        lmap.map.un('moveend', this.renderStatic);
        lmap.view.un('change:resolution', this.renderStatic);
        this.removeStatic();
    }
};
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';
.town-name {
    top: 30px;
    right: -5px;
    z-index: @panel-index;
    background: #fff;
    padding: 4px 0;
    // box-shadow: @shadow;
    ul li {
        padding-right: 7px;
        float: left;
        height: @height;
        line-height: @height;
        margin-left: 5px;

        .font-text {
            width: 70px;
            padding-left: 5px;
            margin-left: 5px;
            display: inline-block;
            border: 1px solid #ccc;
            background: #fff;
            color: @font-color;
            border-radius: 3px;
            -webkit-border-radius: 3px;
            -ms-border-radius: 3px;
            -moz-border-radius: 3px;
            transition: box-shadow .2s;
            list-style-type: none;
            -webkit-text-size-adjust: none;
            outline: none;
            box-sizing: border-box;
            vertical-align: top;
        }
        .btn {
            box-sizing: border-box;
        }
    }
}

// .analysis {
//     .town-name {
//         .radio:checked + label::after {
//             top: 12px;
//         }
//     }
// }

.big {
    .town-name {
        padding: 8px 0;

        ul {
            li {
                height: @height-big;
                line-height: @height-big;

                .font-text,
                .btn {
                    height: @height-big;
                    line-height: @height-big;
                }
            }
        }
    }
}
</style>
