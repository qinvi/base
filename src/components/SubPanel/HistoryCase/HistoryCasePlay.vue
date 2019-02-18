<template>
    <div>

        <!-- <v-timepicker v-if="option.status" :option="option" @cbtime="selectTime" @destroy="(option.status = false)"></v-timepicker> -->

        <div :class="[ 'case-render-panel', hcase.hide ? 'hide-panel' : '' ]">

            <div class="case-title">
                <label>电子案例库</label>
                <a class="close" href="#" @click="caseCancel"></a>
            </div>

            <div class="case-btns">
                <div v-if="hcase.new">
                    <label class="btn confirm" @click="caseSave()">保存</label>
                    <label class="btn" @click="nodePlay()">{{ hcase.play ? '暂停' : '预览' }}</label>
                </div>
                <div v-else>
                    <label class="btn confirm" :class="{ 'btn-disabled': isGuestUser }" @click="caseModify()">修改</label>
                    <label class="btn" @click="nodePlay()">{{ hcase.play ? '暂停' : '播放' }}</label>
                </div>
            </div>

            <div id="case-line" class="case-line">
                <ul>
                    <li v-for="(item, index) of cases" :key="index" :class="[ item.status ? 'selected' : '' ]">

                        <div :class="[ 'line', acrossDate(item, index) ? 'long' : '' ]"></div>

                        <div class="calendar" v-if="acrossDate(item, index)">
                            <div class="month">{{ formatTime(item.time, 'monthCN') }}</div>
                            <div class="date">{{ formatTime(item.time, 'date') }}</div>
                        </div>

                        <div class="node">

                            <div class="time" :id="'history-time-' + index" v-if="hcase.new">
                                {{ formatTime(item.time, 'hour') }}:<input type="text" maxlength="2" @keyup="setMin(item, $event)" :value="formatTime(item.time, 'min')" @blur="saveNodeTime(item, $event.target.value)" @focus="activeInput = $event.target"/>
                            </div>
                            <div class="time" v-else>{{ formatTime(item.time, 'time') }}</div>

                            <div :class="[ 'point', item.status ? 'selected' : '' ]"></div>
                            <div :class="[ 'thumbnail', item.status ? 'selected' : '' ]" @click.stop="nodeSelect(item)">
                                <div class="node-name-box">
                                    <div class="node-name">
                                        <i class="index"></i>
                                        <label :class="[ (index < 9) ? '' : 'left' ]">{{ index + 1 }}</label>
                                        <input type="text" v-model="item.text" placeholder="节点名称" v-if="hcase.new"/>
                                        <span v-else>{{ item.text }}</span>
                                    </div>
                                </div>
                                <img :src="item.src" />
                                <a href="#" class="close" v-if="!hcase.play && hcase.new && item.status " @click.stop="nodeDelete(item)"></a>
                            </div>
                        </div>

                    </li>

                    <li v-if="hcase.new" class="line-new" @click.stop="nodeNew(-1)">
                        <div class="line"></div>
                        <div class="node">
                            <div class="point"></div>
                            <div class="node-new">
                                <div class="node-name-box">
                                    <div class="node-name"><i class="index"></i><label>+</label><span>新建节点</span></div>
                                </div>
                            </div>
                        </div>
                    </li>

                    <li>
                        <div class="line bottom"></div>
                        <div class="node-hidden"></div>
                    </li>

                </ul>
            </div>

            <div :class="[ 'toggle-btn', hcase.hide ? 'right' : '' ]" @click="(hcase.hide = !hcase.hide)"></div>

        </div>

        <div class="case-tip">

            <div class="tip">

                <div class="text" v-if="hcase.new"><input type="text" placeholder="请输入案例名称" v-model="hcase.text"/></div>
                <div class="text" v-else><label>{{ hcase.text }}</label></div>

                <ul class="clearfix" v-if="hcase.new">
                    <li v-for="(item, index) of hcase.types" :key="index">
                        <input type="radio" class="radio" name="caseTypes" v-model="hcase.type" :value="item.value" :id="'caseType-' + item.value"/>
                        <label :for="'caseType-' + item.value">{{ item.text }}</label>
                    </li>
                </ul>
                <ul class="clearfix" v-else>
                    <li>{{ last.time }} {{ last.text }}</li>
                </ul>

            </div>

            <div class="econtrol" ref="history-ctrl-panel" v-show="hcase.new">
                <ul class="clearfix tools">
                    <li v-for="(name, key) in hcase.list" @click="selectHandle(key)" :key="key" :class="[ 'tool', 'icon-econtrol-' + key, { selected: key === hcase.last } ]" :title="name"></li>
                    <li class="drag tool" ref="history-ctrl-drag"></li>
                </ul>
                <v-snc @param="setSCParam"></v-snc>
            </div>

        </div>

    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import IScroll from 'iscroll';
import SNC from '@/components/Plugins/SizeNColorPanel';
// import Timepicker from '@/components/Plugins/Timepicker'

export default {
    name: 'History-Case-Play',
    props: [ 'model' ],
    components: { 'v-snc': SNC }, // , 'v-timepicker': Timepicker
    data() {
        return {
            // option: {},
            cases: [ ],
            last: { time: null, text: null },
            hcase: {
                hide: false,
                new: false,
                last: null,
                play: false,
                text: '',
                type: '11000',
                types: [
                    { text: '自然灾害事件', value: '11000' },
                    { text: '事故灾难事件', value: '12000' },
                    { text: '公共卫生事件', value: '13000' },
                    { text: '社会安全事件', value: '14000' },
                    { text: '其它', value: '19000' }
                ],
                list: { point: '标注', text: '文字', arrow: '箭头', polygon: '画任意面' }
            },
            activeInput: ''
        };
    },

    computed: {
        ...mapState({
            code: state => state.sys.code,
            userId: state => state.userSetting.userId,
            userName: state => state.userSetting.userName,
            mapType: state => state.mapType,
            sysMinTime: state => state.time.sysMinTime,
            pendingPool: state => state.loadingIndicator.pendingPool
        }),
        isGuestUser: function () {
            return this.userName.includes('guest')
        }
    },

    watch: {
        'hcase.hide'(hide) {
            this.updateParam([ 'historyCase', { hide } ]);
        },
        'hcase.new'(status) {
            if (!!this.modify) this.modify.setActive(status);
        }
    },

    methods: {
        ...mapActions(['updateParam']),

        /**         * 初始化默认参数
         */
        initConstData() {
            this.drawParam = lmap.layer.initDrawParam(lmap.map, 'draw');
            this.modify = lmap.draw.initModify(this.drawParam);
            this.modify.setActive(this.hcase.new);
            this.layer = this.drawParam.layer;
            this.layer.setZIndex(8);
            this.textInput = { feature: null, overlay: null };
            this.pointInfo = { feature: null, overlay: null };
            this.selected = {
                feature: null,
                layer: lmap.layer.init(lmap.map, 'draw'),
                color: { color: '#ED3F2B', class: 'tomato', code: '03' },
                size: { size: '12px', width: 1, code: 'M', scale: 0.5 }
            };
            this.timer = { click: 0, render: null };
            this.urls = {
                save: sysconfig.TESTPATH + '/historyCase/saveOrUpdate',
                detail: sysconfig.TESTPATH + '/historyCase/detail'
            }
            this.caseId = -1;
            this.last = {};
            this.saving = false;
            lmap.map.on('singleclick', this.clickMap);
            WD.init(this.$refs['history-ctrl-drag'], this.$refs['history-ctrl-panel'], lmap.map);
        },

        /**
         * 保存节点时间
         * @param {Object} item 保存的对象
         * @param {string} value 分钟值
         */
        saveNodeTime(item, value) {
            let min = Number(value);
            if (Number.isNaN(min) || (min < 0) || (min > 59)) {
                min = 0;
            }
            // const index = this.cases.indexOf(item);
            const time = item.time;
            const newTime = TU(time).setMin(min).format('YYYY-MM-DD HH:mm:ss');
            item.time = newTime;
        },

        // /**
        //  * 初始化时间组件
        //  * @param {object} item 时间节点
        //  * @param {number} index 数据下标
        //  */
        // initTimepicker(item, index) {
        //     let option = {
        //         status: true,
        //         id: 'history-time-' + index,
        //         type: index,
        //         top: 10,
        //         template: 'YYYY-MM-DD HH:mm:ss',
        //         date: TU(item.time).format('YYYY-MM-DD HH:mm:ss'),
        //         lock: { hour: true, min: false, sec: true }
        //     };
        //     this.option = option;
        // },

        setMin(item, $) {
            utils.clearTimer(this.setMinTimer);
            this.setMinTimer = window.setTimeout(() => {
                let min = Number($.target.value);
                if (Number.isNaN(min) || (min < 0) || (min > 59)) {
                    min = 0;
                    $.target.value = '00';
                }
                const index = this.cases.indexOf(item);

                const time = item.time;
                const newTime = TU(time).setMin(min).format('YYYY-MM-DD HH:mm:ss');
                item.time = newTime;

                this.cases.sort(this.nodeSort('time'));

                const newIndex = this.cases.indexOf(item);
                if (newIndex !== index) {
                    const prev = this.cases[newIndex - 1];
                    if (!!prev) {
                        this.cases[newIndex].feature = prev.feature;
                        this.nodeSelect(this.cases[newIndex], null, false);
                    }
                }
            }, 5000);
        },

        // /**
        //  * 格式化时间
        //  * @param {object} param 时间参数
        //  */
        // selectTime(param) {
        //     const index = param.type;
        //     const item = this.cases[index];
        //     item.time = param.date;
        //     this.cases.sort(this.nodeSort('time'));

        //     const newIndex = this.cases.indexOf(item);
        //     const prev = this.cases[newIndex - 1];
        //     if (!!prev) {
        //         this.cases[newIndex].feature = prev.feature;
        //         this.nodeSelect(this.cases[newIndex]);
        //     }

        //     // this.option.status = false;
        // },

        /**
         * 格式化时间
         * @param {date} time 事件类型
         * @param {string} type 格式类型
         */
        formatTime(time, type = 'time') {
            if (type === 'time') {
                return TU(time).format('HH:mm');
            } else if (type === 'hour') {
                return TU(time).format('HH');
            } else if (type === 'min') {
                return TU(time).format('mm');
            } else if (type === 'monthCN') {
                const month = Number(TU(time).format('MM'));
                return TU().timeCN(month);
            } else if (type === 'date') {
                return TU(time).format('DD');
            }
        },

        /**
         * 判断是否超过一天
         * @param {object} item 当前时间
         * @param {number} index 当前时间所属下标
         */
        acrossDate(item, index) {
            if (index === 0) {
                return true;
            } else {
                const prev = this.cases[index - 1];
                return TU(item.time).format('YYYYMMDD') - TU(prev.time).format('YYYYMMDD') > 0;
            }
        },

        /**
         * 导出当前地图图片
         * @param {object} map 地图对象
         * @param {object} item 节点对象
         */
        exportMap(map, item) {
            const source = document.getElementById('linkcm-map').children[0].children[0];
            const target = document.createElement('canvas');
            const width = target.width = 210;
            const height = target.height = 112;
            target.getContext('2d').drawImage(source, 0, 0, width, height);
            try {
                item.src = target.toDataURL('image/png');
            } catch (e) {
                console.error('保存缩略图出错!');
            }
            // map.once('postcompose', function (event) {
            //     const source = event.context.canvas;
            //     const target = document.createElement('canvas');
            //     const width = target.width = 210;
            //     const height = target.height = 112;
            //     target.getContext('2d').drawImage(source, 0, 0, width, height);
            //     try {
            //         item.src = target.toDataURL('image/png');
            //     } catch (e) {
            //         console.error('保存缩略图出错!');
            //     }
            // });
            // map.renderSync();
        },

        /**
         * 加载节点数据
         * @param {string} id 节点ID
         */
        caseLoad(id) {
            if (id !== -1) {
                this.pendingPool.push({ id: 'history-case-node' });
                utils.get(this.urls.detail, { id, code: this.code }).then((json) => {
                    this.hcase.text = json.data.title;
                    this.hcase.type = json.data.type;
                    this.cases = JSON.parse(json.data.nodeJson);
                    for (const caset of this.cases) {
                        caset.status = false;
                    }
                    if (!this.hcase.new) {
                        this.nodePlay();
                    }
                    this.updateParam(['loadingIndicator', { sigCancel: 'history-case-node' }]);
                }).catch((ex) => {
                    this.updateParam(['loadingIndicator', { sigCancel: 'history-case-node' }]);
                });
            }
        },

        /**
         * 时间排序
         * @param {object} property 字段类型
         */
        nodeSort(property) {
            return function(a, b) {
                const value1 = a[property];
                const value2 = b[property];
                return TU(value1).format('YYYYMMDDHHmmss') - TU(value2).format('YYYYMMDDHHmmss');
            }
        },

        /**
         * 新建节点
         */
        nodeNew() {
            // this.hcase.new = true;
            if (this.last) {
                this.nodeSave();
            }
            const item = {
                id: lmap.util.getUUID(),
                time: TU(this.sysMinTime).format('YYYY-MM-DD HH:mm:ss'),
                text: '',
                status: false,
                src: null,
                feature: null
            }
            this.cases.push(item);
            this.cases.sort(this.nodeSort('time'));

            const index = this.cases.indexOf(item);
            const prev = this.cases[index - 1];

            if (!!prev) {
                this.cases[index].feature = prev.feature;
            } else {
                if (this.cases.length > 1) {
                    lmap.icon.clear(this.layer)
                }
            }
            this.nodeSelect(this.cases[index], null, false);
            this.renderScroll();
        },

        /**
         * 选择节点
         * @param {object} item 节点对象
         * @param {string} type 调用类型
         * @param {boolean} status 是否需要保存
         */
        nodeSelect(item, type = 'click', status = true) {
            if (this.activeInput !== '') {
                this.activeInput.blur();
                this.cases.sort(this.nodeSort('time'));
                utils.clearTimer(this.setMinTimer);
            }
            if (type === 'click') {
                utils.clearTimer(this.timer.render);
                this.hcase.play = false;
            }
            if (!!this.last) {
                this.last.status = false;
                if (!this.hcase.play && status) {
                    this.nodeSave();
                }
            }
            item.status = true;
            this.last = item;
            if (!!item.feature) {
                this.featRestore(item.feature);
            }
            if (!!item.time) {
                this.updateParam([ 'time', { setTime: item.time } ]);
            }
        },

        /**
         * 保存节点
         */
        nodeSave() {
            this.last.feature = this.featToStr();
            this.exportMap(lmap.map, this.last);
            this.renderScroll();
        },

        /**
         * 删除节点
         * @param {object} item 节点对象
         */
        nodeDelete(item) {
            const index = this.cases.indexOf(item);
            this.cases.splice(index, 1);
            if (this.cases.length === 0) {
                lmap.icon.clear(this.layer);
                this.last = {}
                this.$emit('caseModel', { new: false, status: true, id: -1 })
            } else {
                this.nodeSelect(this.cases[this.cases.length - 1]);
            }
        },

        nodePlay() {
            const status = this.hcase.play = !this.hcase.play;
            if (status) this.nodeRender(0);
            else utils.clearTimer(this.timer.render);
        },

        /**
         * 播放节点
         * @param {number} index 节点下标
         */
        nodeRender(index) {
            utils.clearTimer(this.timer.render);
            if (!!this.cases[index]) {
                this.nodeSelect(this.cases[index], 'render');
                this.timer.render = window.setTimeout(() => {
                    return this.nodeRender(index + 1, 'render');
                }, 2000);
            } else {
                this.hcase.play = false;
            }
        },

        /**
         * 选择画笔
         * @param {string} type 画笔类型
         */
        selectHandle(type) {
            if (!!this.last) {
                this.hcase.last = this.hcase.last !== type ? type : null;
                this.initHandle(this.hcase.last);
            }
        },

        /**
         * 初始化画笔
         * @param {string} type 画笔类型
         */
        initHandle(type) {
            lmap.draw.cancel(lmap.map, this.drawHandle);
            this.textInputRemove();
            if (type) {
                const event = { end: e => this.endHandle(e.feature, type) };
                let featureInfo = {};
                if (type === 'text') {
                    featureInfo = { data: { tempText: true } };
                }
                this.drawHandle = lmap.draw.initHandle(this.drawParam, type, event, featureInfo, {});
            }
        },

        /**
         * 画笔结束回调函数
         * @param {object} feature 画笔的矢量对象
         * @param {string} type 画笔的类型
         */
        endHandle(feature, type) {
            this.hcase.last = null;
            lmap.draw.cancel(lmap.map, this.drawHandle);
            if (type === 'text') {
                this.textInputRemove();
                this.textInput.overlay = this.textInputInit(feature);
                this.textInput.feature = feature;
            }

            const id = 'line-' + new Date().getTime();
            const style = this.featStyle(type);
            feature.setStyle(lmap.style.getStyle(style));

            if (feature.get('type') === 'polyline') {
                const wkt = lmap.draw.getWKT(feature);
                const points = wkt.replace('LINESTRING(', '').replace(')', '').split(',');
                const features = [];
                for (const point of points) {
                    const feature = lmap.icon.add(this.layer, { circle: { radius: 4, fill: { color: lmap.draw.hexToRgba(this.selected.color.color, 0.5) } } }, point.split(' '));
                    features.push(feature);
                }
                this.lineMap[id] = features;
            }

            feature.set('id', id);
            feature.set('style', style);
            feature.set('type', type);
            feature.set('history', true);
            feature.set('size', JSON.stringify(this.selected.size));

            this.timer.click = new Date().getTime();
        },

        /**
         * 地图点击事件
         * @param {object} evt 点击事件返回对象
         */
        clickMap(evt) {
            if (this.hcase.new) {
                let feature = lmap.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                    return feature;
                });
                if (!!feature) {
                    if (feature.get('history')) {
                        const timer = new Date().getTime() - this.timer.click;
                        if (timer > 500) {
                            const extent = feature.getGeometry().getExtent();
                            lmap.icon.clear(this.selected.layer);
                            this.selected.feature = feature;
                            this.featSelect(extent, feature);
                        }
                    } else if (feature.get('boxClose')) {
                        this.featDelete(this.selected.feature);
                        lmap.icon.clear(this.selected.layer);
                        this.pointInfoPopupRemove();
                    }
                } else {
                    this.pointInfoPopupRemove();
                    lmap.icon.clear(this.selected.layer);
                }
            }
        },

        /**
         * 选中某个元素
         * @param {array} extent bbox边界
         * @param {object} feature 矢量对象
         */
        featSelect(extent, feature) {
            let [ left, bottom, right, top ] = extent;
            const type = feature.get('type');
            if ((type === 'arrow') || (type === 'polygon')) {
                left -= 5000;
                bottom -= 5000;
                right += 5000;
                top += 5000;
            }
            [ left, bottom, right, top ] = ol.proj.getTransform(sysconfig.SYSTEM_PROJECTION, sysconfig.SOURCE_PROJECTION)([ left, bottom, right, top ]);
            const bbox = `POLYGON((${left} ${bottom},${right} ${bottom},${right} ${top},${left} ${top},${left} ${bottom}))`;
            const style = {
                stroke: {
                    color: '#1A1A1A',
                    width: 1,
                    lineDash: [ 12, 12 ]
                }
            }

            let position = { scale: 0 };

            if ((type === 'point') || (type === 'text')) {
                position = JSON.parse(feature.get('size'));
            }

            const scale = {
                text: { x: 2.25, y: 1.75 },
                point: { x: 1.75, y: 3 },
                arrow: { x: 0, y: 0 },
                polygon: { x: 0, y: 0 }
            }

            const bboxFeat = lmap.polygon.addWKT(bbox)[0];
            bboxFeat.setStyle(lmap.style.getStyle(style));

            bboxFeat.set('type', 'box');
            this.selected.layer.getSource().addFeature(bboxFeat);

            const close = {
                isIcon: true,
                icon: {
                    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABf0lEQVR4AaRSBU6GMQz9cC70u8ZxdzgMMdzhCLjEg7tLDHc4AfZ5jNIVZ4IteUm3ta/yqokOdGWmPTT4avQG3xjiEnH7AmaPPjT6q5mP9pNjNPpKMOgaAd/gyqj3FUuJYLg0CR061SQ8jAZfO4vlCLHFnh+ScGCFfCLTG70F7OMfeNQb/LlEBrXx9K8zs692wD6cAb0lygfjG/uzL7e4mZJQOIOKr0H2/hQ4rgvW6QoSRN7/0LbOVtkf+kwKWveWag+NvkGuiqYQWIezz4FX22C0xQlYOb3hH/nwAvn7NDTOEaLW3qqxjhcJZOPbe9UcThihIR12cxiso3kiQpCNbypxdEZoqgnn3gmx1Z8QnkrJjuf5ltVVHgtFIQEutxgBrQgK8Fko/DNa42JRxGsz+f3a7E2I1waeNtOYFd3b3x6cB3kNV8IGBQVIDbrcFVCepnrWQ+TndvM2cg382G7WQvXii9YFLGYVAI39hUB8FYi/gzCY3W6x4HO7RTiuKgAAEvizSlo9B9EAAAAASUVORK5CYII=',
                    anchor: [0.5 - position.scale * scale[type].x, 3.5 + position.scale * scale[type].y],
                    size: [20, 20],
                    scale: 1
                }
            }
            lmap.icon.add(this.selected.layer, close, [ right, top ], { boxClose: true });

            if (feature.get('type') === 'point') {
                this.pointInfoPopupInit(feature);
            }

        },

        /**
         * 删除单个元素
         */
        featDelete() {
            if (!!this.selected.feature) {
                this.layer.getSource().removeFeature(this.selected.feature);
                this.selected.feature = null;
            }
        },

        /**
         * 根据矢量类型获取默认样式
         * @param {string} type 类型
         */
        featStyle(type) {
            let style;
            if (type === 'point' || type === 'text') {
                style = {
                    isIcon: true,
                    icon: {
                        anchor: [0.5, 1],
                        size: [46, 70],
                        src: `${sysconfig.TESTIP}/topic/little/econtrol/${this.selected.color.color.replace('#', '')}.png`,
                        scale: this.selected.size.scale
                    }
                };
            } else if (type === 'line' || type === 'polyline') {
                style = {
                    stroke: {
                        color: this.selected.color.color,
                        width: this.selected.size.width
                    }
                };
            } else {
                style = {
                    fill: { color: this.selected.color.color, opacity: 0.2 },
                    stroke: { color: '#27303F', width: this.selected.size.width }
                };
            }
            return style;
        },

        /**
         * 获取预案图层矢量数据
         */
        featToStr() {
            const features = this.layer.getSource().getFeatures();
            const objArr = [];
            for (const feature of features) {
                const wkt = lmap.draw.getWKT(feature);
                const obj = {
                    wkt,
                    history: true,
                    type: feature.get('type'),
                    style: feature.get('style'),
                    size: feature.get('size'),
                    'info-detail': feature.get('info-detail'),
                    'info-name': feature.get('info-name')
                };
                if (feature.get('dstyle')) {
                    obj.dstyle = feature.get('dstyle');
                }
                objArr.push(obj);
            }
            const mapObj = { type: 'map', zoom: lmap.util.getZoom(lmap.view), center: lmap.util.getCenter(lmap.view), mapType: this.mapType };
            objArr.push(mapObj);
            return JSON.stringify(objArr);
        },

        /**
         * 还原预案
         * @param {string} str 矢量元素字符串
         */
        featRestore(str) {
            const data = JSON.parse(str);
            const features = [];
            data.forEach(function(ele) {
                if (ele.type !== 'map') {
                    const feature = lmap.polygon.addWKT(ele.wkt)[0];
                    let styles = [ lmap.style.getStyle(ele.style) ];
                    const dstyle = ele.dstyle;
                    if (dstyle) {
                        feature.set('dstyle', dstyle);
                        styles.push(lmap.style.getStyle(dstyle));
                    }
                    feature.setStyle(styles);
                    feature.set('type', ele.type);
                    feature.set('size', ele.size);
                    feature.set('style', ele.style);
                    feature.set('history', ele.history);
                    feature.set('info-name', ele['info-name']);
                    feature.set('info-detail', ele['info-detail']);
                    features.push(feature);
                } else {
                    this.updateParam([ { mapType: ele.mapType } ]);
                    lmap.ctrl.panTo(lmap.map, lmap.util.transform(ele.center, true), ele.zoom);
                }
            }, this);
            lmap.draw.clear(this.layer);
            this.pointInfoPopupRemove();
            this.textInputRemove();
            this.layer.getSource().addFeatures(features);
        },

        /**
         * 初始化详情输入框
         * @param {object} feature 矢量对象
         */
        pointInfoPopupInit(feature) {
            this.pointInfoPopupRemove();

            const $div = document.createElement('div');
            $div.className = 'point-info-box';
            $div.innerHTML = `
                <ul>
                    <li><label>名称：</label><input type="text" id="info-name"></li>
                    <li><label>详情：</label><textarea id="info-detail" style="resize: none"></textarea></li>
                </ul>
            `;
            const popup = lmap.draw.getOverlay({
                element: $div,
                offset: [120, 90],
                positioning: 'bottom-center'
            });

            const coord = feature.getGeometry().getCoordinates();
            popup.setPosition(coord);

            lmap.map.addOverlay(popup);

            this.pointInfo = { overlay: popup, feature };
            this.pointInfoPopupRestore();
        },

        /**
         * 还原详情输入框
         */
        pointInfoPopupRestore() {
            if (!!this.pointInfo.feature) {
                const name = document.getElementById('info-name');
                name.value = this.pointInfo.feature.get('info-name') || '';
                const detail = document.getElementById('info-detail');
                detail.innerHTML = this.pointInfo.feature.get('info-detail') || '';
            }
        },

        /**
         * 删除详情输入框
         */
        pointInfoPopupRemove() {

            if (!!this.pointInfo.feature) {

                const name = document.getElementById('info-name').value;
                const detail = document.getElementById('info-detail').value;

                this.pointInfo.feature.set('info-name', name);
                this.pointInfo.feature.set('info-detail', detail);
                const original = this.pointInfo.feature.get('style');
                const nameText = {
                    text: {
                        text: `${name}`,
                        offsetY: 12,
                        size: '12px',
                        fill: {
                            color: '#ED3F2B',
                            width: 1
                        },
                        placement: 'point'
                    }
                };
                const detailText = {
                    text: {
                        text: `${detail}`,
                        offsetY: 30,
                        size: '12px',
                        fill: {
                            color: '#ED3F2B',
                            width: 1
                        }
                    }
                }
                const style = Object.assign(original, detailText);
                this.pointInfo.feature.set('dstyle', nameText);
                this.pointInfo.feature.setStyle([ lmap.style.getStyle(nameText), lmap.style.getStyle(style) ]);
                this.pointInfo.feature = null;
            }

            if (!!this.pointInfo.overlay) {
                lmap.map.removeOverlay(this.pointInfo.overlay);
                this.pointInfo.overlay = null;
            }
        },

        /**
         * 初始化问题输入框
         * @param {object} feature 矢量对象
         */
        textInputInit(feature) {
            const $measure = document.createElement('div');
            $measure.style = 'padding: 3px; background-color: #fff; box-shadow: 0 2px 4px 0 rgba(0, 0, 0,.3); border-radius: 4px';

            const $textarea = document.createElement('textarea');
            $textarea.setAttribute('placeholder', '请输入文字');
            $textarea.style = 'margin-right: 4px;resize:none;vertical-align: middle;';

            const $btn = document.createElement('a');
            $btn.className = 'btn';
            $btn.innerHTML = '完成';

            $measure.appendChild($textarea);
            $measure.appendChild($btn);

            const popup = lmap.draw.getOverlay({
                element: $measure,
                offset: [10, 30],
                positioning: 'bottom-center'
            });

            const coord = feature.getGeometry().getCoordinates();
            popup.setPosition(coord);

            lmap.map.addOverlay(popup);

            $btn.onclick = () => {
                setTextStyle();
            };

            // $textarea.onkeydown = () => {
            //     const event = window.event; // 消除浏览器差异
            //     if (event.keyCode === 13) setTextStyle();
            // };

            // 输入框提交事件
            const that = this;
            function setTextStyle() {
                const text = $textarea.value;
                const style = {
                    text: {
                        text: text,
                        size: that.selected.size.size,
                        fill: { color: that.selected.color.color, width: 6 }
                    }
                };
                that.textInput.feature.set('style', style);
                that.textInput.feature.set('tempText', false);
                that.textInput.feature.setStyle(lmap.style.getStyle(style));
                that.textInputRemove();
            }

            return popup;
        },

        /**
         * 删除文字弹窗
         */
        textInputRemove() {
            if (!!this.textInput.overlay) {
                lmap.icon.clearType(this.layer, 'tempText');
                lmap.map.removeOverlay(this.textInput.overlay);
                this.textInput.overlay = null;
            }
        },

        /**
         * 案例保存
         */
        caseSave() {
            if (!this.hcase.text.trim()) {
                this.updateParam([ 'sysTip', { status: true, text: '案例名称为空！', type: 'error' } ]);
                return;
            }

            if (this.cases.length === 0) {
                this.updateParam([ 'sysTip', { status: true, text: '没有新建节点！', type: 'error' } ]);
                return;
            }

            if (this.saving) return;

            this.updateParam([ 'sysTip', { status: true, text: '正在保存中...', type: 'loading' } ]);
            this.saving = true;
            if (this.last) this.nodeSave();
            const caseStr = JSON.stringify(this.cases);
            const param = { title: this.hcase.text, type: this.hcase.type, nodeJson: caseStr, id: this.caseId, userId: this.userId, code: this.code, startTime: this.cases[0].time, endTime: this.cases[this.cases.length - 1].time };
            utils.post(this.urls.save, param).then((json) => {
                if (!!json.data.id && json.data.id !== -1) {
                    this.caseId = json.data.id;
                    this.updateParam([ 'sysTip', { status: true, text: '保存成功！', type: 'success' } ]);
                } else {
                    this.updateParam([ 'sysTip', { status: true, text: '登陆账户没有权限操作！', type: 'warn' } ]);
                }
                this.saving = false;
            });

        },

        caseModify() {
            if (this.isGuestUser) return
            this.hcase.new = true;
        },

        caseCancel() {
            this.$emit('caseModel', { status: false });
        },

        /**
         * 设置矢量元素颜色和尺寸
         * @param {object} param 颜色和尺寸参数
         */
        setSCParam(param) {
            this.selected.color = param.color;
            this.selected.size = param.size;
        },

        /**
         * 渲染滚动条
         */
        renderScroll() {
            if (this.scrollId) {
                this.scrollId.refresh();
            } else {
                this.$nextTick(() => {
                    /* eslint-disable */
                    this.scrollId = new IScroll('#case-line', {
                        // disablePointer: true,
                        scrollbars: 'custom',
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        click: false
                    });
                });
            }
        }

    },

    mounted: function() {
        this.initConstData();
        this.hcase.new = !this.model.new;
        this.caseId = this.model.id;
        this.caseLoad(this.caseId);
        this.updateParam([ 'historyCase', { hide: false } ]);
    },

    destroyed: function() {
        this.textInputRemove();
        lmap.map.un('singleclick', this.clickMap);
        lmap.draw.cancel(lmap.map, this.modify);
        lmap.draw.cancel(lmap.map, this.drawHandle);
        lmap.map.removeLayer(this.layer);
        lmap.map.removeLayer(this.selected.layer);
        this.updateParam([ 'historyCase', { hide: true } ]);
        utils.clearTimer(this.timer.render);
    }

};
</script>

<style scoped lang='less'>
@import '../../../assets/css/common.less';
@images: '../../../assets/img';

.case-render-panel {
    position: fixed;
    top: 0px;
    right: 0px;
    width: 308px;
    height: 100%;

    background-color: rgba(39, 48, 63, 0.98);
    z-index: @pop-index + 10;
    box-shadow: @shadow;

    transition: transform .4s ease,-webkit-transform .4s ease;

    .iScrollIndicator {
        background: rgba(0, 0, 0, 0);
        background-color: rgba(0, 0, 0, 0);
        border: 1px solid rgba(0, 0, 0, 0) !important;
    }

    &.hide-panel {
        transform: translateX(100%);
    }

    div, ul, li {
        color: #fff;
    }

    .case-title {
        text-align: left;
        text-indent: 4px;
        border-bottom: 1px solid rgb(51, 80, 129);
        .close {
            right: 2px;
            top: 2px;
        }
    }

    .case-btns {
        padding: 4px 0;
        border-bottom: 1px solid rgb(51, 80, 129);
        .btn {
            width: 46%;
            margin: 0 3px;
            border: 1px solid #222222;

            &.btn-disabled {
                cursor: not-allowed;
                background: #888;
            }
        }
    }

    .case-line {

        position: relative;
        overflow-y: hidden;
        box-sizing: border-box;

        height: calc(~'100% - 70px');

        ul li {
            cursor: default;
            margin-bottom: 10px;
            &.selected {
                margin-bottom: 6px;
            }
            &.line-new {
                margin-bottom: 123px;
            }
        }

        .line {
            height: 160px;
            border-left: 1px dashed #fff;
            position: absolute;
            left: 60px;
            &.long {
                height: 208px;
            }
            &.bottom {
                height: 900px;
            }
        }

        .calendar {
            position: relative;
            top: 8px;
            left: 41px;
            width: 36px;
            height: 36px;

            border: 1px solid #717171;
            border-radius: 4px;

            background: #fff;
            box-shadow: @shadow;

            margin-bottom: 10px;

            .month {
                color: #fff;
                background: @eye-color;
                .height(18px);
            }
            .date {
                color: @font-color;
                .height(18px);
            }
        }

        .node {

            .time {
                float: left;
                margin-top: 12px;
                margin-left: 12px;
                input {
                    width: 16px;
                    border: 1px solid rgba(0, 0, 0, 0);
                    border-left: 0;
                    border-bottom: 1px solid #fff;
                    background-color: rgba(0, 0, 0, 0);
                    color: #fff;
                    font-size: 12px;
                    &:focus {
                        outline: none;
                        border: none;
                        border-bottom: 1px solid #fff;
                    }
                }
            }

            .point {
                width: 9px;
                height: 9px;
                position: relative;
                top: 22px;
                left: 55px;
                border: 1px solid #717171;
                background: #fff;
                border-radius: 100%;
                &.selected {
                    border: 1px solid red;
                }
            }

            .thumbnail, .time {
                cursor: pointer;
            }

            .thumbnail, .node-new {
                position: relative;
                left: 80px;
                width: 210px;
                height: 140px;
                background: #fff;
                box-shadow: @shadow;

                .node-name-box {
                    text-align: left;
                    color: @font-color;
                    .height(24px);
                    display: block;
                    width: 100%;
                    .node-name {
                        position: absolute;
                        left: 6px;

                        .index {
                            color: @font-color;
                            &::before {
                                content: '';
                                display: inline-block;
                                vertical-align: middle;
                                width: 14px;
                                height: 14px;
                                border: 1px solid #717171;
                                background: @select-font-color;
                                border-radius: 100%;
                            }
                        }

                        input {
                            width: 124px;
                            border: none;
                            &:focus {
                                outline: none;
                                border: none;
                            }
                        }

                        input, span {
                            position: relative;
                            left: -8px;
                            top: 2px;
                        }

                        span {
                            color: @font-color;
                            top: 1px;
                            left: -9px;
                        }

                        label {
                            width: 14px;
                            height: 14px;
                            position: relative;
                            left: -14.5px;
                            top: 1.4px;
                            color: #fff;
                            &.left {
                                left: -18.5px;
                            }
                        }
                    }
                }


                &::before {
                    content: '';
                    border-top: 6px solid transparent;
                    border-bottom: 6px solid transparent;
                    border-right: 6px solid rgba(255, 255, 255, 0.9);
                    position: absolute;
                    top: 10px;
                    left: -6px;
                    z-index: @pop-index;
                }

                &.selected {
                    top: -2px;
                    left: 78px;
                    border: 2px solid red;
                    border-radius: 4px;
                    img {
                        width: 100%;
                        position: relative;
                        top: -1px;
                        left: 0;
                        border-radius: 2px;
                    }
                }

                &.selected::after {
                    content: '';
                    border-top: 7px solid transparent;
                    border-bottom: 7px solid transparent;
                    border-right: 7px solid red;
                    position: absolute;
                    top: 9px;
                    left: -8px;
                    z-index: @pop-index - 1;
                }

                img {
                    width: 100%;
                    position: relative;
                    top: -3px;
                    left: 0;
                }

            }

            .node-new {
                height: 28px;
                background: #fff;
                .node-name-box {
                    height: 30px;
                    .node-name {
                        color: @font-color;
                        label {
                            top: 0.5px;
                            left: -12.5px;
                        }
                        span {
                            left: -4.5px;
                        }
                    }
                }
            }

        }

        .node-hidden {
            position: relative;
            height: 240px;
        }

    }
}

.case-tip {

    .tip {

        position: fixed;
        top: @top-normal;
        left: 50%;
        transform: translateX(-50%);

        width: 440px;
        height: 66px;

        background: #fff;
        box-shadow: @shadow;
        display: inline-block;
        text-align: center;
        vertical-align: top;

        .text {
            input, label {
                font-size: 24px;
                color: @select-font-color;
                width: 98%;
                text-align: center;
                border: none;
                margin-top: 8px;
                .height(24px);
                &:focus {
                    outline: none;
                    border: none;
                }
            }
            label {
                .height(40px);
            }
        }

        ul {
            position: relative;
            bottom: 4px;
            li {
                display: inline-block;
                .height(24px);
            }
        }

    }

    .econtrol {

        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);

        .tools {
            // padding: 2px 2px;
            width: auto;
            box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.3);
            background-color: #fff;

            .tool {
                width: 26px;
                .height(26px);
                margin: 2px 2px;
                float: left;
                background: linear-gradient(#fff, #eee);

                &:nth-child(1) {
                    margin-left: 2px;
                }

                &:nth-last-child(1) {
                    margin-right: 2px;
                    background: none;
                }

                &::before {
                    font-size: 26px;
                    border: 1px solid rgb(199, 199, 199);
                }

            }

            .selected::before {
                color: @select-font-color;
                border-color: @select-font-color;
            }

            .drag {
                cursor: move;
                width: 16px;
                height: 16px;
                &::before {
                    content: '';
                    display: inline-block;
                    border: none;
                    width: 100%;
                    height: 26px;
                    line-height: 26px;
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    background-image: url('@{images}/common/drag.png');
                    background-position: right top;
                    background-size: auto;
                }
            }
        }
    }


}

.toggle-btn {
    background-color: rgba(39, 48, 63, 0.98);
    position: absolute;
    width: 16px;
    height: 50px;
    left: -16px;
    top: 44%;
    transform: translateY(-50%);
    border-radius: 3px 0 0 3px;
    box-shadow: 0 2px 4px 0 rgba(0,0,0,.3);
    cursor: pointer;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        height: 6px;
        width: 6px;
        margin-top: -3px;
        margin-left: -6px;
        border-right: 2px solid #c7c8cd;
        border-bottom: 2px solid #c7c8cd;
        transform: rotate(-45deg);
    }

    &:hover::before {
        border-right: 2px solid #fff;
        border-bottom: 2px solid #fff;
    }

    &.right {
        &::before {
            margin-left: -3px;
            transform: rotate(135deg);
        }
    }

}

.big {
    .case-render-panel {
        width: 378px;
        .case-line {
            ul li {
                // margin-bottom: 32px
            }
            .line {
                left: 80px;
                height: 210px;
                &.long {
                    height: 266px;
                }

                &.bottom {
                    height: 900px;
                }
            }
            .node {
                .time {
					input {
						width: 24px;
						font-size: 20px;
					}
				}
                .point {
                    top: 28px;
                    left: 75px;
                }
                .thumbnail {
                    left: 100px;
                    top: 6px;
                    width: 264px;
                    height: 171px;
                    img {
                        top: -16px;
                    }
                    &.selected {
                        top: 4px;
                        left: 98px;
                        img {
                            top: -14px;
                        }
                    }
                    .node-name-box {

                        .node-name {
                            input {
                                .height(20px);
                                font-size: 20px;
                                left: -18px;
                            }
                            i {
                                &::before {
                                    width: 18px;
                                    height: 18px;
                                }
                            }
                            label {
                                left: -21.5px;
                                top: 1.5px;
                            }
                        }
                    }
                }
                .node-new {
                    top: 6px;
                    left: 100px;
                    width: 264px;
                    .node-name label {
                        left: -15.5px;
                    }
                }
            }
            .calendar {
                top: 8px;
                left: 55px;
                width: 48px;
                height: 48px;
                div {
                    .height(24px);
                }
            }
        }
    }
    .case-tip {
        .tip {
            top: @top-big;
            width: 660px;
            height: 94px;
            .text {
                input, label {
                    .height(36px);
                    font-size: 36px;
                }
                label {
                    .height(54px);
                }
            }
            .radio:checked + label::after {
                top: 10px;
            }
        }
    }
    .econtrol {
        top: 142px;
    }
}

</style>
