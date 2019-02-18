<template>
    <div>
        <v-livething :detail="selectedSpot" v-if="selectedSpot" @close="selectedSpot = null; selectedSpotFeature = null"></v-livething>
    </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import LiveThing from '../PopupBox/LiveThing'

export default {
    name: 'LiveThing',

    components: {
        'v-livething': LiveThing
    },

    data: function () {
        return {
            // 选中点的数据
            selectedSpot: null,
            // 选中的点位 feature
            selectedSpotFeature: null
        }
    },

    computed: {
        ...mapState({
            sysTime: state => state.time.sysTime,
            code: state => state.sys.code,
            bigScreen: state => state.toolsBar.bigScreen
        })
    },

    watch: {
        bigScreen() {
            // this.fetchData()
        },
        sysTime: function (val) {
            this.fetchData()
        },

        code: function () {
            this.fetchData()
        },

        selectedSpotFeature: function (val, prevVal) {
            if (prevVal instanceof ol.Feature) {
                prevVal.setStyle()
            }

            if (val instanceof ol.Feature) {
                val.setStyle(this.spotActiveStyle)
            }
        }
    },

    methods: {
        ...mapActions([ 'updateParam' ]),

        /**
         * 初始化组件数据
         */
        initData: function () {
            this.urls = {
                data: sysconfig.TESTPATH + '/realTimeMonitor/getLiveThingInfo'
            }
            this.timers = {
                overlay: null
            }

            this.spotsData = []
            this.spotOverlays = []
            this.spotFeatures = new ol.Collection()
            this.selectedFeature = null
            this.featureById = {}

            this.spotsLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: this.spotFeatures
                }),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 5,
                        fill: new ol.style.Fill({
                            color: '#ffb062'
                        }),
                        stroke: new ol.style.Stroke({
                            width: 1,
                            color: '#000'
                        })
                    })
                }),
                zIndex: lmap.util.getIndex('poitop')
            })
            this.spotActiveStyle = [
                new ol.style.Style({
                    image: new ol.style.Icon({
                        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVR42u3XsQkAQAgEweu/aW3BT0T4WTCVycRUUpPJY+O9ZwBZDgAA4A5AkiTXEAAA4PvvuAGFpx7wVLPmGgAAAABJRU5ErkJggg==',
                        scale: 0.75
                    })
                }),
                this.spotsLayer.getStyle()
            ]

            lmap.map.addLayer(this.spotsLayer)
        },

        /*
         * 获取数据
         *
         */
        fetchData: function () {
            let time

            if (this.sysTime.getHours() === new Date().getHours()) {
                time = new Date()
            } else {
                time = this.sysTime
            }

            const reqParam = {
                dateTime: TU(time).format('YYYYMMDDHHmmss'),
                code: this.code
            }

            this.selectedSpot = null

            utils.GET(this.urls.data, reqParam).then((json) => {
                if (!json || !json.data || !json.data.liveThingList) throw new Error('NODATA')

                this.spotsData = json.data.liveThingList.map((item, index) => {
                    return {
                        id: index,
                        type: item.weatherType,
                        imageSrc: item.urls[0],
                        uploadTime: item.upTime,
                        readableTime: item.upTime.substr(11, 5),
                        coordinate: ol.proj.fromLonLat([+item.lon, +item.lat]),
                        originalData: item
                    }
                })

                this.refreshSpots(this.spotsData)
                this.refreshOverlays(this.spotsData)
            }).catch((ex) => {
                this.removeSpots()
            })
        },

        /*
         * 更新数据点位
         *
         * @param {array} [spotsData] 点位数据
         */
        refreshSpots: function (spotsData) {
            spotsData = spotsData || this.spotsData
            this.spotFeatures.clear()
            this.featureById = {}
            this.selectedSpotFeature = null

            spotsData.forEach((spot) => {
                const feature = new ol.Feature(new ol.geom.Point(spot.coordinate))

                feature.set('originalData', spot.originalData)
                feature.set('spotId', spot.id)
                this.featureById[spot.id] = feature
                this.spotFeatures.push(feature)
            })
        },

        /*
         * 更新数据点位 overlay
         *
         * @param {array} [spotsData] 点位数据
         */
        refreshOverlays: function (spotsData) {
            spotsData = spotsData || this.spotsData

            this.spotOverlays.forEach((overlay) => {
                lmap.map.removeOverlay(overlay)
            })

            this.spotOverlays = []
            window.clearTimeout(this.timers.overlay)

            const overlayWrapper = document.createElement('div')

            overlayWrapper.className = 'live-thing-spot-overlay hidden'

            spotsData.forEach((spot, index) => {
                overlayWrapper.innerHTML = `
                    <img class="lt-spot-image" src="${spot.imageSrc}" alt="">
                    <div class="lt-spot-info-wrapper clearfix">
                        <span class="lt-spot-type text-ellipsis">${spot.type}</span>
                        <span class="lt-spot-time">${spot.readableTime}</span>
                    </div>

                `

                const clonedWrapper = overlayWrapper.cloneNode(true)

                clonedWrapper.addEventListener('animationend', (e) => {
                    if (e.target.classList.contains('hidden')) {
                        e.target.style.display = 'none'
                    }
                })

                const overlay = new ol.Overlay({
                    element: clonedWrapper,
                    position: spot.coordinate,
                    positioning: 'bottom-left',
                    offset: [0, -18]
                })

                clonedWrapper.onclick = () => {
                    this.selectedSpot = spot.originalData
                    this.selectedSpotFeature = this.featureById[spot.id]
                }

                this.spotOverlays.push(overlay)
                lmap.map.addOverlay(overlay)

                if (index === 0) {
                    clonedWrapper.classList.remove('hidden')
                    clonedWrapper.style.display = 'block'
                }
            })

            this.switchVisibleOverlay()
        },

        /*
         * 切换显示点位 overlay
         */
        switchVisibleOverlay: function () {
            if (this.spotOverlays.length <= 1) {
                window.clearTimeout(this.timers.overlay)
                return
            }

            this.timers.overlay = window.setTimeout(() => {
                const overlay = this.spotOverlays.shift()
                const nextOverlayElem = this.spotOverlays[0].getElement()

                overlay.getElement().classList.add('hidden')
                this.spotOverlays.push(overlay)
                nextOverlayElem.classList.remove('hidden')
                nextOverlayElem.style.display = 'block'

                this.switchVisibleOverlay()
            }, 5000)
        },

        /*
         * 移除所有点位
         */
        removeSpots: function () {
            window.clearTimeout(this.timers.overlay)
            this.spotFeatures.clear()
            this.spotOverlays.forEach((overlay) => {
                lmap.map.removeOverlay(overlay)
            })
            this.spotOverlays = []
            this.featureById = {}
            this.selectedSpotFeature = null
        },

        /*
         * 移除所有东西
         */
        removeEverything: function () {
            this.removeSpots()
            lmap.map.removeLayer(this.spotsLayer)
        },

        /*
         * 单击事件处理程序
         *
         * @param {ol.MapBrowserEvent} e 事件对象
         */
        handleSingleClick: function (e) {
            if (this.bigScreen) e.pixel[1] += 5
            lmap.map.forEachFeatureAtPixel(e.pixel, (feature) => {
                this.selectedSpot = feature.get('originalData')
                this.selectedSpotFeature = this.featureById[feature.get('spotId')]
                return true
            }, {
                layerFilter: (layer) => {
                    if (layer === this.spotsLayer) return true
                }
            })
        }
    },

    mounted: function () {
        this.initData()
        this.fetchData()
        lmap.map.on('singleclick', this.handleSingleClick)
    },

    beforeDestroy: function () {
        this.removeEverything()
        lmap.map.un('singleclick', this.handleSingleClick)
    }
}
</script>

<style lang='less'>
.live-thing-spot-overlay {
    width: 100px;
    height: 70px;
    padding: 4px;
    border-radius: 5px;
    background-color: #fff;
    box-shadow: 0px 0px 6px 2px #62aee4;
    cursor: pointer;
    position: relative;
    animation: lt-slide-up-in .6s;
    animation-fill-mode: forwards;
    opacity: 0;
    display: none;

    &::after {
        content: '';
        width: 13px;
        height: 13px;
        position: absolute;
        bottom: -8px;
        background: linear-gradient(to bottom right, rgba(0, 0, 0, 0) 40%, #fff 50%, #fff);
        border: 1px solid #62aee4;
        border-left: transparent;
        border-top: transparent;
        left: 50%;
        transform: translate(-50%, 0) rotate(45deg);
    }

    &.hidden {
        animation: lt-slide-down-out .6s;
    }

    @keyframes lt-slide-up-in {
        0% {
            transform: translate(-50%, 40%);
        }

        100% {
            opacity: 1;
            transform: translate(-50%, 0%);
        }
    }

    @keyframes lt-slide-down-out {
        0% {
            opacity: 1;
            transform: translate(-50%, 0%);
        }

        100% {
            opacity: 0;
            transform: translate(-50%, 40%);
        }
    }

    .lt-spot-image {
        width: 100%;
        height: 50px;
    }

    .lt-spot-type {
        display: inline-block;
        float: left;
        width: 65px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .lt-spot-time {
        float: right;
    }
}

.big .live-thing-spot-overlay {
    width: 160px;
    height: 105px;

    .lt-spot-image {
        height: 70px;
    }
}
</style>
