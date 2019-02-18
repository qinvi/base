import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        // 系统信息
        sys: {
            version: 'Alpha',
            areaName: '广东省',
            name: '应急指挥决策辅助系统',
            ename: '(EAGLE)',
            code: '44',
            updateFlag: false // 触发重复点击当前区域时的标记
        },

        login: true,

        // 用户定制
        userSetting: {
            userId: '',
            userName: '',
            // 是否有发送靶向预警权限
            targetPermission: false,
            region: {},
            model: null,
            modelOrder: null,
            monitor: null,
            monitorSorted: null,
            poisSorted: null,
            pois: null,
            poiEnameMapping: {},
            deptments: null
        },

        // 靶向预警
        target: {
            fullScreen: false, // 是否全屏编辑
            toggle: false, // 切换
            otherStatus: null,
            belong: '' // 所属
        },

        // 地图类型
        mapType: 'dh',

        // 选中图标
        selectPoint: {
            lonlat: null,
            type: '', // normal
            status: false,
            share: false,
            areaCode: '',
            activeTypes: [],
            lastArray: [],
            activeMonitorTypes: [],
            remove: function() {},
            callbackActiveType: function() {},
            // 向此数组添加的类型都将被取消选中效果
            cancelTypes: []
        },

        globalAlerts: {
            alerts: []
        },

        // 图片放大
        imgGallery: {
            image: null,
            type: ''
        },

        // 遮罩
        cover: false,

        // POI
        poi: {
            types: null,
            cacheId: null,
            PARAMS: null, // 所存的参数
            belongTo: null // left(左侧面板)/model(模型)/atwill(任意面圈选)
        },

        // 保存地图poi点击事件的回调函数
        clickCallback: {
            videoCallback: null, // 视频模块选中
            pluginCallback: null, // PoiClick.vue插件里面的公共函数
            clearTimer: null, // 清除PoiClick里面的timer
            getClickIndex: null, // 事件处理下标
            normalCallback: null, // 对应Poi.vue页面
            geologicHazardCallback: null, // 对应geologichazard.vue页面
            AgrCallback: null, // 对应Agr.vue页面
            AirCallback: null, // 对应Air.vue页面
            ShipCallback: null, // Ship.vue
            SiteCallback: null, // Site.vue
            modelCallback: null,
            trafficCallback: null,
            PollutantDispersionCallback: null, // PollutantDispersion.vue
            TyphoonCallback: null, // Typhoon.js
            ReservoirCallback: null, // Reservoir.vue
            RiverCallbak: null, // River.vue
            alarmCallback: null // HorseLamp
        },

        // 一般弹窗数据
        normalPoiDetail: {
            data: null, // 数据
            type: '', // poi类型 normal/emergency
            selectPoiType: '', // poiType
            areaCode: '',
            belongTo: '', // 'left'(左侧面板) | 'model'(模型) | 'modelSpecific'(模型中的内涝、森林火险) | 'atwill'(任意面圈选) | 'globalSearch'(全局搜索面板) | 'live'(现场直播) | 'alarm'(任意点风险)
            setPoiType: null // 回调设置poiType
        },

        // 时间轴
        time: {
            sysTime: null,
            sysMinTime: null,
            play: false,
            loadFunc: null,
            setTime: null,
            minOn: false,
            min: null
        },
        // 河流水位
        river: {
            status: false
        },
        // 水质监测
        water: {
            status: false
        },
        // 核辐射监测
        nuclear: {
            status: false
        },
        // 雷达
        radar: {
            status: false,
            callback: null
        },

        // 雷电
        thunder: {
            status: false
        },

        // 监测站
        site: {
            status: false,
            winStatus: false,
            dateTime: '',
            elementType: 'wind;rain;temp', // 自动站元素
            data: '', // 记录观测站的信息
            siteFlag: '', // 是否要从新请求站点信息和雨量信息，当地图拖动时
            panelCallback: null, // 面板打开
            poiData: null, // 保存poi点信息
            SiteSubPanelCallback: null, // 面板点击回调请求数据
            staticParams: {}// 静态图片请求参数
        },

        // 水库详情
        reservoirDetails: {
            data: null,
            type: null
        },

        // 新华南水电
        SOUTHRESERVOIR: {
            status: false,
            detail: false,
            type: ''
        },

        // 华南水电
        reservoirs: {
            status: false,
            detail: false,
            type: ''
        },

        // 水文局
        reservoirsSWJ: {
            status: false,
            detail: false,
            type: ''
        },

        // 天气实景视频
        realWeather: { status: false },

        // 现场直播
        liveView: { status: false },

        // 公众实景上报
        liveThing: { status: false },

        // 船舶
        ship: {
            status: false,
            dateTime: null,
            data: null
        },

        // 山洪沟
        mountainTorrents: {
            status: false,
            model: false
        },

        // 云图
        cloud: {
            status: false,
            callback: null
        },

        // 农情调查
        agr: {
            status: false,
            data: null
        },

        // 空气质量
        air: {
            status: false,
            data: null
        },

        // 视频
        video: {
            types: '',
            status: false
        },

        // 地质灾害
        geologicHazard: {
            status: false,
            data: null
        },

        // 模型
        model: {
            status: false,
            dateTime: null,
            param: null,
            type: null,
            callback: null,
            fallzone: false
        },

        // 模型等级
        level: {
            status: false,
            data: null,
            callback: null,
            analysisCode: null, // 影响城镇编码
            dataString: ''
        },

        // 台风
        typhoon: {
            status: false,
            paths: null, // 路径信息
            triggerType: 'time', // 'time'||manMade
            callback: null, // 移动弹窗callback
            influenceCallback: null, // 影响区域callback
            inilidCallback: null, // 台风inilid callback
            clear: null, // 清除图层
            panelCallback: null, // 面板打开
            animation: null,
            listToPoint: null, // 列表触发风圈
            deleteTsid: '' // 取消的tsid
        },

        // 任意点风险
        alarm: {
            // 告警点是否可见
            pointsVisible: true,
            initLamp: null, // 走马灯初始化
            wmsImage: null, // 走马灯画图
            showAlarmFunc: null, // 打开告警列表
            alarmListClick: function() {}, // alarmList列表点击事件
            marquee_Time: null,
            marquee_level: null,
            marqueeHide: false,
            realLength: false,
            marqueeLength: '' // 获得走马灯长度
        },

        // 任意面圈选
        atwill: {
            status: false,
            cacheId: null,
            toggle: null
        },

        // 提示框
        tip: {
            model: {
                status: false,
                highlight: false,
                name: '未来24小时瞬时风',
                time: '2017年10月12日 11时 - 2017年10月13日 11时',
                ename: 'GUST WIND IN THE NEXT 24 HOURS'
            },
            poi: {
                status: false,
                name: '未来24小时瞬时风',
                time: '2017年10月12日 11时 - 2017年10月13日 11时',
                ename: 'GUST WIND IN THE NEXT 24 HOURS'
            },
            typhoon: {
                status: false,
                name: '强热带风暴(STS)：珊瑚(SANVU)',
                time: '2017-09-03 08:00',
                center: '150.10°E, 38.40°N',
                wind: '28米/秒 982百帕',
                radius: '5'
            }
        },

        // 透明度
        opacity: {
            status: false,
            value: 1
        },

        // 格点雨量
        gridRain: {
            status: false,
            data: null
        },

        // 工具外部触发开关
        toolsBar: {
            tag: false,
            about: false,
            suggestion: false,
            gridRain: false,
            econtrol: false,
            planId: null,
            track: false,
            video: false,
            bigScreen: false,
            historyCase: false,
            navItemsCallback: null // 工具栏开关
        },

        // 应急指挥工具
        econtrol: {
            status: false,
            commandId: ''
        },

        // 左侧面板
        baseInfo: {
            status: false, // 是否打开左侧面板
            poi: [], // 外部控制选择poi，实况  【模型定制， 应急库选中应急物资和救援力量】
            poiStatus: false
        },

        analysis: {
            selected: '', // 选择模型还是圈选的分析   模型==》model 圈选=》atwill
            sigCloseAnalysis: null // 使用随机数触发影响分析窗口关闭
        },

        // 决策辅助工具
        decideServe: {
            status: true,
            siteNameStatus: false,
            // 标注
            marker: {
                pointColor: '03',
                pointSize: '50'
            },
            // 字体
            font: {
                size: '12',
                color: '#000000',
                style: '黑体'
            }
        },

        // 圈选镇名
        townList: {
            status: false
        },

        // 雨量报警
        rainWarn: {
            status: false,
            pix: [0, 0],
            areaCode: '',
            poiStatus: false
        },

        // 高速公路
        highway: {
            status: false
        },

        // 全局搜索
        globalSearch: {
            data: '',
            poiPopCallback: null,
            setOverlayDetail: null
        },

        // 迷你信息追踪
        trackMin: {
            status: false,
            id: null
        },

        // 水系
        waterSystem: {
            status: false
        },

        // 系统弹窗
        sysTip: {
            status: false,
            type: null,
            text: null,
            call: null,
            timeout: undefined
        },

        // 历史案例库
        historyCase: {
            hide: true,
            play: false
        },

        // 全局加载指示器
        loadingIndicator: {
            // 包含所有等待加载的操作
            pendingPool: [],
            // 取消信号，以操作的标识符触发，多个标识符以英文逗号分隔
            sigCancel: null
        },

        // 遮罩
        mask: {
            status: false
        }

    },

    mutations: {
        updateParam(state, param) {
            let attr, data;
            if (param.length > 1) {
                [attr, data] = param;
            } else {
                [data] = param;
            }
            let keys = Object.keys(data);
            for (let key of keys) {
                if (!!attr) {
                    state[attr][key] = data[key];
                } else {
                    state[key] = data[key];
                }
            }
        }
    },
    actions: {
        updateParam({ commit }, param) {
            commit('updateParam', param);
        }
    }
});

export default store;
