<template>
    <div class="region">
        <label @mouseover.stop.prevent="showPanel(true, $event)" @mouseout.stop.prevent="showPanel(false, $event)" @click="selectRegion(last)">{{ last.areaName }}</label>
        <div class="county-list left">
            <ul><li v-for="(item, key) in countyItems" :key="key" @click="selectRegion(item)">{{ newCountyName(item.areaName) }}</li></ul>
        </div>

        <div class="city-panel" :style="{ display : cityStatus ? 'block' : 'none' }" @mouseover.stop.prevent="showPanel(true, $event)" @mouseout.stop.prevent="showPanel(false, $event)">
            <ul><li v-for="(item, key) in cityItems" :key="key" @click="selectRegion(item)">{{ item.areaName }}</li></ul>
        </div>

        <div class="town-list" v-if="townStatus" @mouseover.stop.prevent="showPanel(true, $event)" @mouseout.stop.prevent="showPanel(false, $event)">
            <ul><li v-for="(item, key) of townItems" :key="key" @click="selectRegion(item)">{{ item.areaName }}</li></ul>
        </div>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

export default {

    data() {
        return {
            dataTest: null,
            user: { code: '', areaName: '' },
            last: { code: '', areaName: '' },
            cityItems: [],
            countyItems: [],
            townItems: [],
            cityStatus: false,
            townStatus: false,
            prov: { code: '44', areaName: '广东省', lon: 113.30765, lat: 23.422825 }
        }
    },

    computed: {
        ...mapState({
            cover: state => state.cover,
            code: state => state.sys.code,
            updateFlag: state => state.sys.updateFlag,
            region: state => state.userSetting.region
        })
    },

    watch: {
        cover(status) {
            this.drawBoundary(this.code, status, 'json', false);
        },
        region(data) {
            this.settingRegion(data);
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        /**
         * 区域名字截取"区、县、市、镇"
         * @param {string} name 区域名字
         * @returns 截取后的新区域名字
         */
        newCountyName(name) {
            let uniqueArr = ['城区', '梅县'];
            if (uniqueArr.includes(name)) {
                return name;
            }
            return name.replace('区', '').replace('县', '').replace('市', '').replace('镇', '');
        },

        /**
         * 根据用户信息展示边界
         */
        settingRegion(region) {
            this.last = region;
            this.user = region;
            this.getRegion(this.user);
            this.drawBoundary(region.code, false, 'json');
        },

        /**
         * 切换区域
         * @param {object} param 登录用户信息
         */
        getRegion(param) {
            let regionType;
            let isProv = false;
            switch (param.code.length) {
                case 2:
                    regionType = 'city';
                    isProv = true;
                    break;
                case 4:
                    regionType = 'county';
                    break;
                case 6:
                    regionType = 'town';
                    break;
                default:
                    regionType = 'prov';
            }
            let baseUrl = sysconfig.TESTPATH + '/basedata/listAreaName';
            utils.GET(baseUrl, { 'code': param.code, 'type': regionType }).then((json) => {
                json = json.data.areaNameList;
                let data;
                if (isProv) {
                    data = [this.prov].concat(json);
                } else if (param.code === '4401') {
                    let sortRegions = [];
                    let regionsObj = {};
                    let sotrArr = ['440104', '440113', '440106', '440103', '440105', '440111', '440112', '440114', '440115', '440183', '440184'];
                    json.forEach((region, index) => {
                        regionsObj[region.code] = region;
                    });
                    sotrArr.forEach((code) => {
                        sortRegions.push(regionsObj[code]);
                    });
                    data = sortRegions;
                } else {
                    data = json;
                }
                this[ regionType + 'Items' ] = data;
                this.cityStatus = false;
            });
        },

        /**
         * 鼠标移上显示、隐藏面板
         * @param {boolean} status 判断状态
         */
        showPanel(status) {
            if (!!this.timer) window.clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                if (this.last.code.length < 5) {
                    this.cityStatus = status;
                } else {
                    this.townStatus = status;
                }
            }, 50);
        },

        /**
         * 选择区域
         * @param {object} item 区域信息
         */
        selectRegion(item) {
            if (item.code === this.code) {
                // 重复点击当前区域,会重置应急库的筛选项
                console.log('click');
                this.updateParam(['sys', { updateFlag: !this.updateFlag }]);
            }
            this.updateParam(['sys', { code: item.code, areaName: item.areaName }]);
            this.updateParam([ 'normalPoiDetail', { type: '' } ]);
            if (this.user.code.length === 6) {
                if (item.code.length > 6) {
                    this.drawTownBoundary(item.code, item.areaName);
                } else if (!!this.townLayer) {
                    lmap.map.removeLayer(this.townLayer);
                    this.townLayer = null;
                }
            } else {
                if (item.code.length < 5) {
                    this.last = item;
                    if (item.code === '44') {
                        this.countyItems = [];
                        this.cityStatus = false;
                    } else {
                        this.getRegion(item);
                    }
                }
                this.drawBoundary(item.code, false, 'json');
            }
        },

        /**
         * 渲染区县边界
         * @param {string} code 区域编码
         * @param {string} name 区域名称
         */
        drawTownBoundary(code, name) {
            let map = lmap.map;

            if (!!this.townLayer) {
                map.removeLayer(this.townLayer);
                this.townLayer = null;
            }

            let layer = lmap.layer.init(map, 'basic');
            let url = sysconfig.TESTIP + '/topic/little/mapjson/' + code + '.json';
            let source = new ol.source.Vector({
                format: new ol.format.TopoJSON({ defaultProjection: sysconfig.SOURCE_PROJECTION }),
                projection: sysconfig.SYSTEM_PROJECTION,
                url: url
            });
            let style = {
                fill: { color: 'rgba(0, 205, 205, 0.5)' },
                stroke: { color: 'rgba(0, 0, 0, 0.75)', width: 1.5 },
                text: {
                    text: name,
                    size: '16px',
                    fill: { color: 'rgba(255, 255, 255, 1)' },
                    stroke: { color: 'rgba(0, 0, 0, 0.75)', width: 3.5 }
                }
            };
            let styles = [];
            styles.push(lmap.style.getStyle(style));
            layer.setSource(source);
            layer.setStyle(styles);
            this.townLayer = layer;
        },

        /**
         * 渲染省市边界
         * @param {string} code 区域编码
         * @param {boolean} isCover 是否遮罩
         * @param {string} type 读取JSON方式
         */
        drawBoundary(code, isCover, type, setLocation = true) {
            let map = lmap.map;

            if (!!this.layer) {
                map.removeLayer(this.layer);
                this.layer = null;
            }

            let style = {
                'gd': {
                    cover: {
                        stroke: { color: 'rgba(136, 168, 212, 1)', width: 3 },
                        fill: { color: 'rgba(100, 100, 100, 0.3)' }
                    },
                    uncover: { stroke: { color: 'rgba(136, 168, 212, 1)', width: 2.25 } }
                },
                'default': {
                    cover: {
                        stroke: { color: 'rgba(182, 213, 249, 1)', width: 3 },
                        fill: { color: 'rgba(100, 100, 100, 0.3)' }
                    },
                    uncover: { stroke: { color: 'rgba(182, 213, 249, 1)', width: 4 } },
                    border: { stroke: { color: 'rgba(46, 46, 46, 1)', width: 2.25 } }
                }
            }

            let styles = [];
            let curStyle;
            if (code === '44') {
                curStyle = isCover ? style.gd.cover : style.gd.uncover;
                styles.push(lmap.style.getStyle(curStyle));
            } else {
                let curStyle = isCover ? style.default.cover : style.default.uncover;
                styles.push(lmap.style.getStyle(curStyle));
                styles.push(lmap.style.getStyle(style.default.border));
            }

            let format = {
                'json': new ol.format.TopoJSON({ defaultDataProjection: sysconfig.SOURCE_PROJECTION }),
                'wkt': new ol.format.WKT()
            };

            let url = sysconfig.TESTIP + '/topic/little/mapjson/' + (isCover ? 'out/' : '') + code + '.' + type;
            let formatRead = format[type];
            let source;
            if (type === 'json') {
                source = new ol.source.Vector({
                    format: formatRead,
                    projection: sysconfig.SYSTEM_PROJECTION,
                    url: url
                });
            } else if (type === 'wkt') {
                utils.GET(url).then((wktStr) => {
                    if (!!wktStr) {
                        let feature = formatRead.readFeature(wktStr);
                        feature.getGeometry().transform(sysconfig.SOURCE_PROJECTION, sysconfig.SYSTEM_PROJECTION);
                        source = new ol.source.Vector({ features: [feature] });
                    }
                });
            }

            let layer = lmap.layer.init(map, 'basic');
            layer.setSource(source);
            layer.setStyle(styles);
            this.layer = layer;

            if (setLocation) {
                if (code !== '44' && !isCover) {
                    extendToLayer(layer);
                } else if (code === '44') {
                    let view = map.getView();
                    view.setCenter(lmap.util.transform(lmap.config.prov_center));
                    view.setZoom(8);
                    lmap.config.center = lmap.config.prov_center;
                    lmap.config.zoom = 8;
                }
            }

            /**
             * 把地图放大到边界可视范围内
             * @param {object} layer 图层
             */
            function extendToLayer(layer) {
                layer.addEventListener('change', function (event) {
                    let promise = new Promise(function (resolve, reject) {
                        resolve(map.getView().fit(layer.getSource().getExtent(), (map.getSize())));
                    });
                    promise.then(function (status) {
                        let center = map.getView().getCenter();
                        let zoom = map.getView().getZoom();
                        lmap.config.center = lmap.util.transform(center, true);
                        lmap.config.zoom = zoom;
                    });
                });
            }
        }
    },
    mounted() {
        this.settingRegion(this.region);
    }
}
</script>

<style scoped lang='less'>
@import '../../assets/css/common.less';

li:hover {
    color: @select-font-color;
}

.region {
    label {
        cursor: pointer;
        color: #DFDFDF;
        margin-left: 5px;
        display: inline-block;
        width: auto;
        height: 100%;
    }

    .city-panel {
        position: absolute;
        z-index: @panel-index + 1;
        left: 0;
        background-color: #fff;
        width: 335px;
        height: auto;
        box-shadow: @shadow;

        ul {
            width: 100%;
            height: auto;

            li {
                float: left;
                height: 25px;
                line-height: 25px;
                width: 45px;
                text-align: center;
                margin-right: 10px;
                list-style: none;
                cursor: pointer;
            }
        }
    }

    .county-list {
        width: 600px;
        height: 30px;
        ul li {
            float: left;
            margin-right: 8px;
            color: #ddd;
        }
    }
    .left {
        left: 50px;
        position: absolute;
        top: 0px;
        height: 30px;
        line-height: 30px;
    }

    .town-list {
        position: absolute;
        top: 30px;
        left: 0px;
        width: 420px;
        background-color: #fff;
        border: 1px solid #ccc;
        z-index: @panel-index + 1;
        height: auto;
        box-shadow: @shadow;
        li {
            float: left;
            min-width: 80px;
            text-align: left;
            margin-left: 3px;
        }
    }
}

.big .region {
    height: 45px;
    line-height: 45px;
    .city-panel {
        width: 468px;
        ul li {
            height: 38px;
            line-height: 38px;
            width: 68px;
        }
    }
    .left {
        left: 80px;
        height: 45px;
        line-height: 45px;
    }
}
</style>
