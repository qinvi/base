const Model = {};

// 模型定制对应关系
Model.setting = {
    gale: { text: '大风', type: 'gale', status: false, detail: false, poiArr: [] },
    heavyRainfall: { text: '强降水', type: 'heavyRainfall', status: false, detail: false, poiArr: [] },
    temp: { text: '温度', type: 'temp', status: false, detail: false, poiArr: [] },
    mountainTorrents: { text: '山洪', type: 'mountainTorrents', status: false, detail: false, poiArr: [] },
    waterLogging: { text: '内涝', type: 'waterLogging', status: false, detail: false, hide: true, poiArr: [] },
    mt: { text: '漫滩', type: 'mt', status: false, detail: false, hide: true, poiArr: [] },
    stormTide: { text: '风暴潮', type: 'stormTide', status: false, detail: false, hide: true, poiArr: [] },
    pollutantDispersion: { text: '污染扩散', type: 'pollutantDispersion', status: false, detail: false, hide: true, poiArr: [] },
    fireDanger: { text: '森林火点', type: 'fireDanger', status: false, detail: false, hide: true, poiArr: [] }
};

// 属性说明: static表示静态图片；analysis表示数据分析  exportPoi表示基础数据列表导出 poiImage表示Poi图层 poiDetail表示详情
Model.url = {
    gale: {
        static: '/galemodel/getGaleModelImage',
        poiImage: '/galemodel/getGaleModelPoiImg',
        poiDetail: '/galemodel/getGaleModelPoiDetail',
        analysis: '/galemodel/getGaleModelTotal',
        townName: '/galemodel/getGaleModelTownNameImage',
        townTable: '/galemodel/getGaleModelTownTable',
        modelTown: '/galemodel/exportGaleModelTown',
        poiTable: '/galemodel/getGaleModelPoiTable',
        modelPoi: '/galemodel/exportGaleModelPoi'
    },
    heavyRainfall: {
        static: '/rainmodel/getRainModelImage',
        poiImage: '/rainmodel/getRainModelPoiImg',
        poiDetail: '/rainmodel/getRainModelPoiDetail',
        analysis: '/rainmodel/getRainModelTotal',
        townName: '/rainmodel/getRainModelTownNameImage',
        townTable: '/rainmodel/getRainModelTownTable',
        modelTown: '/rainmodel/exportRainModelTown',
        poiTable: '/rainmodel/getRainModelPoiTable',
        modelPoi: '/rainmodel/exportRainModelPoi'
    },
    temp: {
        static: '/temperaturemodel/getTemperatureModelImage',
        poiImage: '/temperaturemodel/getTemperatureModelPoiImg',
        poiDetail: '/temperaturemodel/getTemperatureModelPoiDetail',
        analysis: '/temperaturemodel/getTemperatureModelTotal',
        townName: '/temperaturemodel/getTemperatureModelTownNameImage',
        townTable: '/temperaturemodel/getTemperatureModelTownTable',
        modelTown: '/temperaturemodel/exportTemperatureModelTown',
        poiTable: '/temperaturemodel/getTemperatureModelPoiTable',
        modelPoi: '/temperaturemodel/exportTemperatureModelPoi'
    },
    mountainTorrents: {
        static: '/mountainFloodModel/getMountainFloodModelImage',
        poiImage: '/mountainFloodModel/getMountainFloodPoiImg',
        poiDetail: '/mountainFloodModel/getMountainFloodPoiDetail',
        analysis: '/mountainFloodModel/getMountainFloodModelTotal',
        townName: '/mountainFloodModel/getMountainFloodTownNameImage',
        townTable: '/mountainFloodModel/getMountainFloodTownTable',
        modelTown: '/mountainFloodModel/exportMountainFloodTown',
        poiTable: '/mountainFloodModel/getMountainFloodPoiTable',
        modelPoi: '/mountainFloodModel/exportMountainFloodPoi'
    },
    waterLogging: {
        static: '/waterloggingModel/getWaterModelImage',
        poiInfo: '/waterloggingModel/getWaterDetailByLonlat',
        analysis: '',
        exportPoi: ''
    },
    mt: {
        static: '/floodplainmodel/getFloodPlainImage',
        poiImage: '/floodplainmodel/getFloodPlainPoiImg',
        poiDetail: '/floodplainmodel/getFloodPlainPoiDetail',
        analysis: '/floodplainmodel/getFloodPlainTotal',
        townName: '/floodplainmodel/getFloodPlainTownNameImage',
        townTable: '/floodplainmodel/getFloodPlainTownTable',
        modelTown: '/floodplainmodel/exportFloodPlainTown',
        poiTable: '/floodplainmodel/getFloodPlainPoiTable',
        modelPoi: '/floodplainmodel/exportFloodPlainPoi'
    },
    stormTide: {
        static: '/stormtidemodel/getStormTideImage',
        poiImage: '/stormtidemodel/getStormTidePoiImg',
        poiDetail: '/stormtidemodel/getStormTidePoiDetail',
        analysis: '/stormtidemodel/getStormTideTotal',
        townName: '/stormtidemodel/getStormTideTownNameImage',
        townTable: '/stormtidemodel/getStormTideTownTable',
        modelTown: '/stormtidemodel/exportStormTideTown',
        poiTable: '/stormtidemodel/getStormTidePoiTable',
        modelPoi: '/stormtidemodel/exportStormTidePoi'
    },
    pollutantDispersion: {
        static: '/pollutantdispersionmodel/getPollutantModelImage',
        poiImage: '/pollutantdispersionmodel/getPollutantModelPoiImg',
        poiDetail: '/pollutantdispersionmodel/getPollutantModelPoiDetail',
        analysis: '/pollutantdispersionmodel/getPollutantModelTotalByGeom',
        townName: '/pollutantdispersionmodel/getPollutantModelTownNameImage',
        townTable: '/pollutantdispersionmodel/getPollutantModelTownTable',
        modelTown: '/pollutantdispersionmodel/exportPollutantModelTown',
        poiTable: '/pollutantdispersionmodel/getPollutantModelPoiTable',
        modelPoi: '/pollutantdispersionmodel/exportPollutantModelPoi'
    },
    fireDanger: {
        static: '/fireModel/getFirePointImage',
        poiInfo: '/fireModel/getFirePointInfo',
        analysis: '',
        exportPoi: ''
    }
}

Model.mapping = {

    past24: { dateTime: -24, text: '过去24小时', etext: 'IN THE LAST 24 HOURS' },
    past12: { dateTime: -12, text: '过去12小时', etext: 'IN THE LAST 12 HOURS' },
    past6: { dateTime: -6, text: '过去6小时', etext: 'IN THE LAST 6 HOURS' },
    past0: { dateTime: 0, text: '当前时刻', etext: 'IN NOW' },
    future1: { dateTime: 1, text: '未来1小时', etext: 'IN THE NEXT 1 HOUR' },
    future2: { dateTime: 2, text: '未来2小时', etext: 'IN THE NEXT 2 HOURS' },
    future3: { dateTime: 3, text: '未来3小时', etext: 'IN THE NEXT 3 HOURS' },

    heavyRainfall: { dateTime: -1, text: '过去1小时格点累计强降水', etext: 'RAINSTORM IN THE LAST 1 HOUR' },
    heavyRainfall3: { dateTime: -3, text: '过去3小时格点累计强降水', etext: 'RAINSTORM IN THE LAST 3 HOURS' },
    heavyRainfall24: { dateTime: -24, text: '过去24小时格点累计强降水', etext: 'RAINSTORM IN THE LAST 24 HOURS' },
    heavyRainfall_qpf: { dateTime: 1, text: '未来1小时强降水', etext: 'RAINSTORM IN THE NEXT 1 HOUR' },
    heavyRainfall3_qpf: { dateTime: 3, text: '未来3小时强降水', etext: 'RAINSTORM IN THE NEXT 3 HOURS' },
    heavyRainfall6_2d: { dateTime: 6, type: 'fixed', text: '未来6小时格点累计强降水', etext: 'RAINSTORM IN THE NEXT 6 HOURS' },
    heavyRainfall12_2d: { dateTime: 12, type: 'fixed', text: '未来12小时格点累计强降水', etext: 'RAINSTORM IN THE NEXT 12 HOURS' },
    heavyRainfall24_2d: { dateTime: 24, type: 'fixed', text: '未来24小时强降水', etext: 'RAINSTORM IN THE NEXT 24 HOURS' },
    heavyRainfall48_2d: { dateTime: 48, type: 'fixed', text: '未来48小时强降水', etext: 'RAINSTORM IN THE NEXT 48 HOURS' },
    heavyRainfall72_2d: { dateTime: 72, type: 'fixed', text: '未来72小时强降水', etext: 'RAINSTORM IN THE NEXT 72 HOURS' },
    heavyRainfall48lj_2d: { dateTime: 48, type: 'fixed', text: '48小时格点累计强降水', etext: 'RAINSTORM CUMULATIVE IN THE NEXT 48 HOURS' },
    heavyRainfall72lj_2d: { dateTime: 72, type: 'fixed', text: '72小时格点累计强降水', etext: 'RAINSTORM CUMULATIVE IN THE NEXT 72 HOURS' },

    galeInstant24: { dateTime: -24, text: '过去24小时瞬时风(格点)', etext: 'GUST WIND IN THE LAST 24 HOURS' },
    galeInstant: { dateTime: -1, text: '过去1小时瞬时风(格点)', etext: 'GUST WIND IN THE LAST 1 HOUR' },
    futureGaleInstant24: { dateTime: 24, type: 'fixed', text: '未来24时瞬时风(格点)', etext: 'GUST WIND IN THE NEXT 24 HOURS' },
    futureGaleInstant48: { dateTime: 48, type: 'fixed', text: '未来48小时瞬时风(格点)', etext: 'GUST WIND IN THE NEXT 48 HOURS' },

    galeAverage24: { dateTime: -24, text: '过去24小时平均风(格点)', etext: 'MEAN WIND IN THE LAST 24 HOURS' },
    galeAverage: { dateTime: -1, text: '过去1小时平均风(格点)', etext: 'MEAN WIND IN THE LAST 1 HOUR' },
    futureGaleAverage24: { dateTime: 24, type: 'fixed', text: '未来24时平均风(格点)', etext: 'MEAN WIND IN THE NEXT 24 HOURS' },
    futureGaleAverage48: { dateTime: 48, type: 'fixed', text: '未来48小时平均风(格点)', etext: 'MEAN WIND IN THE NEXT 48 HOURS' },

    pastMaxTemperature24: { dateTime: -24, text: '过去24小时高温(格点)', etext: 'MAXIMUM TEMPERATURE IN THE LAST 24 HOURS' },
    futureMaxTemperature24: { dateTime: 24, type: 'fixed', text: '未来24小时高温(格点)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 24 HOURS' },
    futureMaxTemperature48: { dateTime: 48, type: 'fixed', text: '未来48小时高温(格点)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 48 HOURS' },
    futureMaxTemperature72: { dateTime: 72, type: 'fixed', text: '未来72小时高温(格点)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 72 HOURS' },
    pastMinTemperature24: { dateTime: -24, text: '过去24小时低温(格点)', etext: 'MINIMUM TEMPERATURE IN THE LAST 24 HOURS' },
    futureMinTemperature24: { dateTime: 24, type: 'fixed', text: '未来24小时低温(格点)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 24 HOURS' },
    futureMinTemperature48: { dateTime: 48, type: 'fixed', text: '未来48小时低温(格点)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 48 HOURS' },
    futureMinTemperature72: { dateTime: 72, type: 'fixed', text: '未来72小时低温(格点)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 72 HOURS' },

    pollutantDispersion: { dateTime: 0, text: '污染扩散', etext: 'POLLUTION DIFFUSION STATUS' },
    stormTide: { dateTime: 0, text: '风暴潮', etext: 'STORM SURGE FORECASTING' },
    waterLogging: { dateTime: 0, text: '内涝', etext: 'WATERLOGGING ' },
    fireDanger: { dateTime: 0, text: '森林火点', etext: 'FOREST FIRE' },
    mtzj: { dateTime: 0, text: '湛江漫滩', etext: 'STORM SURGE INUNDATION FORECASTING' },
    mtzh: { dateTime: 0, text: '珠海漫滩', etext: 'STORM SURGE INUNDATION FORECASTING' },
    mtgd: { dateTime: 0, text: '广东漫滩', etext: 'STORM SURGE INUNDATION FORECASTING' },

    mountainTorrents: { dateTime: 0, text: '当前时刻山洪', etext: 'MOUNTAIN TORRENTS IN NOW' },
    mountainTorrents1: { dateTime: 1, text: '未来1小时山洪', etext: 'MOUNTAIN TORRENTS IN THE NEXT 1 HOUR' },
    mountainTorrents2: { dateTime: 2, text: '未来2小时山洪', etext: 'MOUNTAIN TORRENTS IN THE NEXT 2 HOURS' },
    mountainTorrents3: { dateTime: 3, text: '未来3小时山洪', etext: 'MOUNTAIN TORRENTS IN THE NEXT 3 HOURS' },

    heavyRainfallDropArea24: { dateTime: 24, text: '未来24小时降水(≥25mm)', etext: 'RAINSTORM IN THE NEXT 24 HOURS(≥25mm)' },
    heavyRainfallDropArea48: { dateTime: 48, text: '未来48小时降水(≥25mm)', etext: 'RAINSTORM IN THE NEXT 48 HOURS(≥25mm)' },
    heavyRainfallDropArea72: { dateTime: 72, text: '未来72小时降水(≥25mm)', etext: 'RAINSTORM IN THE NEXT 72 HOURS(≥25mm)' },
    galeAverageDropArea24: { dateTime: 24, text: '未来24小时平均风(落区)', etext: 'MEAN WIND IN THE NEXT 24 HOURS' },
    galeAverageDropArea48: { dateTime: 48, text: '未来48小时平均风(落区)', etext: 'MEAN WIND IN THE NEXT 48 HOURS' },
    galeAverageDropArea72: { dateTime: 72, text: '未来72小时平均风(落区)', etext: 'MEAN WIND IN THE NEXT 72 HOURS' },
    minTemperatureDropArea24: { dateTime: 24, text: '未来24小时低温(≤5℃落区)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 24 HOURS' },
    maxTemperatureDropArea24: { dateTime: 24, text: '未来24小时高温(>35℃落区)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 24 HOURS' },
    minTemperatureDropArea48: { dateTime: 48, text: '未来48小时低温(≤5℃落区)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 48 HOURS' },
    maxTemperatureDropArea48: { dateTime: 48, text: '未来48小时高温(>35℃落区)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 48 HOURS' },
    minTemperatureDropArea72: { dateTime: 72, text: '未来72小时低温(≤5℃落区)', etext: 'MINIMUM TEMPERATURE IN THE NEXT 72 HOURS' },
    maxTemperatureDropArea72: { dateTime: 72, text: '未来72小时高温(>35℃落区)', etext: 'MAXIMUM TEMPERATURE IN THE NEXT 72 HOURS' }
};

Model.slider = {

    heavyRainfall: {
        model: 'heavyRainfall',
        currModel: 'heavyRainfall',
        currName: '格点',
        currIndex: 7,
        baseItems: [
            { dateTime: '-24', code: 'heavyRainfall24', name: '过去24小时格点累计', type: 'grid' },
            { dateTime: '-3', code: 'heavyRainfall3', name: '过去3小时格点累计', type: 'grid' },
            { dateTime: '-1', code: 'heavyRainfall', name: '过去1小时格点累计', type: 'grid' },
            { dateTime: '+1', code: 'heavyRainfall_qpf', name: '未来1小时格点', type: 'grid' },
            { dateTime: '+3', code: 'heavyRainfall3_qpf', name: '未来3小时格点', type: 'grid' },
            { dateTime: '+6', code: 'heavyRainfall6_2d', name: '未来6小时格点累计', type: 'grid' },
            { dateTime: '+12', code: 'heavyRainfall12_2d', name: '未来12小时格点累计', type: 'grid' },
            { dateTime: '+24', code: 'heavyRainfall24_2d', name: '未来24小时格点累计', both: true, type: 'grid', timeName: '未来24小时' },
            { dateTime: '+48', code: 'heavyRainfall48lj_2d', name: '未来48小时格点累计', both: true, type: 'grid', timeName: '未来48小时' },
            { dateTime: '+72', code: 'heavyRainfall72lj_2d', name: '未来72小时格点累计', both: true, type: 'sum', timeName: '未来72小时' }
        ],
        childModel: {
            heavyRainfall24_2d: {
                heavyRainfall24_2d: { name: '格点', type: 'grid', legend: 'grid' },
                heavyRainfallDropArea24: { name: '落区(≥25mm)', type: 'fallzone', legend: 'fallzone' }
            },
            heavyRainfall48lj_2d: {
                heavyRainfall48_2d: { name: '格点', type: 'grid', legend: 'grid' },
                heavyRainfallDropArea48: { name: '落区(≥25mm)', type: 'fallzone', legend: 'fallzone' },
                heavyRainfall48lj_2d: { name: '格点累计', type: 'sum', legend: 'grid' }
            },
            heavyRainfall72lj_2d: {
                heavyRainfall72_2d: { name: '格点', type: 'grid', legend: 'grid' },
                heavyRainfall72lj_2d: { name: '格点累计', type: 'sum', legend: 'grid' },
                heavyRainfallDropArea72: { name: '落区(≥25mm)', type: 'fallzone', legend: 'fallzone' }
            }
        }
    },

    gale: {
        model: 'gale',
        currModel: 'futureGaleInstant24',
        currName: '过去1小时瞬时风(格点)',
        currIndex: 2,
        baseItems: [
            { dateTime: '-24', code: 'galeInstant24', name: '过去24小时瞬时风(格点)', both: true, timeName: '过去24小时', type: 'instant' },
            { dateTime: '-1', code: 'galeInstant', name: '过去1小时瞬时风(格点)', both: true, timeName: '过去1小时', type: 'instant' },
            { dateTime: '+24', code: 'futureGaleInstant24', name: '未来24小时瞬时风(格点)', both: true, timeName: '未来24小时', type: 'instant' },
            { dateTime: '+48', code: 'futureGaleInstant48', name: '未来48小时瞬时风(格点)', both: true, timeName: '未来48小时', type: 'instant' },
            { dateTime: '+72', code: 'galeAverageDropArea72', name: '未来72小时平均风(落区)', type: 'fallzone', legend: 'fallzone' }
        ],
        childModel: {
            galeInstant24: {
                galeInstant24: { name: '瞬时风(格点)', type: 'instant', legend: 'grid' },
                galeAverage24: { name: '平均风(格点)', type: 'average', legend: 'grid' }
            },
            galeInstant: {
                galeInstant: { name: '瞬时风(格点)', type: 'instant', legend: 'grid' },
                galeAverage: { name: '平均风(格点)', type: 'average', legend: 'grid' }
            },
            futureGaleInstant24: {
                futureGaleInstant24: { name: '瞬时风(格点)', type: 'instant', legend: 'grid' },
                futureGaleAverage24: { name: '平均风(格点)', type: 'average', legend: 'grid' },
                galeAverageDropArea24: { name: '平均风(落区)', type: 'fallzone', legend: 'fallzone' }
            },
            futureGaleInstant48: {
                futureGaleInstant48: { name: '瞬时风(格点)', type: 'instant', legend: 'grid' },
                futureGaleAverage48: { name: '平均风(格点)', type: 'average', legend: 'grid' },
                galeAverageDropArea48: { name: '平均风(落区)', type: 'fallzone', legend: 'fallzone' }
            }
        }
    },

    mountainTorrents: {
        model: 'mountainTorrents',
        currModel: 'mountainTorrents',
        currName: '当前时刻',
        currIndex: 0,
        baseItems: [
            { dateTime: 'now', code: 'mountainTorrents', name: '当前时刻' },
            { dateTime: '+1', code: 'mountainTorrents1', name: '未来1小时' },
            { dateTime: '+2', code: 'mountainTorrents2', name: '未来2小时' },
            { dateTime: '+3', code: 'mountainTorrents3', name: '未来3小时' }
        ]
    },

    waterLogging: {
        model: 'waterLogging',
        currModel: 'past12',
        currName: '过去12小时',
        currIndex: 1,
        baseItems: [
            { dateTime: '-24', code: 'past24', name: '过去24小时' },
            { dateTime: '-12', code: 'past12', name: '过去12小时' },
            { dateTime: '-6', code: 'past6', name: '过去6小时' },
            { dateTime: 'now', code: 'past0', name: '当前时刻' },
            { dateTime: '+1', code: 'future1', name: '未来1小时' },
            { dateTime: '+2', code: 'future2', name: '未来2小时' },
            { dateTime: '+3', code: 'future3', name: '未来3小时' }
        ]
    },

    temp: {
        model: 'temp',
        currModel: 'futureMaxTemperature24',
        currName: '过去24小时高温(格点)',
        currIndex: 1,
        baseItems: [
            { dateTime: '-24', code: 'pastMaxTemperature24', name: '过去24小时高温(格点)', both: true, timeName: '过去24小时', type: 'max' },
            { dateTime: '+24', code: 'futureMaxTemperature24', name: '未来24小时高温(格点)', both: true, timeName: '未来24小时', type: 'max' },
            { dateTime: '+48', code: 'futureMaxTemperature48', name: '未来48小时高温(格点)', both: true, timeName: '未来48小时', type: 'max' },
            { dateTime: '+72', code: 'futureMaxTemperature72', name: '未来72小时高温(格点)', both: true, timeName: '未来72小时', type: 'max' }
        ],

        childModel: {
            pastMaxTemperature24: {
                pastMaxTemperature24: { name: '高温(格点)', type: 'max', legend: 'grid' },
                pastMinTemperature24: { name: '低温(格点)', type: 'min', legend: 'grid' }
            },
            futureMaxTemperature24: {
                futureMaxTemperature24: { name: '高温(格点)', type: 'max', legend: 'grid' },
                maxTemperatureDropArea24: { name: '高温(>35℃落区)', type: 'maxD', legend: 'fallzone' },
                futureMinTemperature24: { name: '低温(格点)', type: 'min', legend: 'grid' },
                minTemperatureDropArea24: { name: '低温(≤5℃落区)', type: 'minD', legend: 'fallzone' }
            },
            futureMaxTemperature48: {
                futureMaxTemperature48: { name: '高温(格点)', type: 'max', legend: 'grid' },
                maxTemperatureDropArea48: { name: '高温(>35℃落区)', type: 'maxD', legend: 'fallzone' },
                futureMinTemperature48: { name: '低温(格点)', type: 'min', legend: 'grid' },
                minTemperatureDropArea48: { name: '低温(≤5℃落区)', type: 'minD', legend: 'fallzone' }
            },
            futureMaxTemperature72: {
                futureMaxTemperature72: { name: '高温(格点)', type: 'max', legend: 'grid' },
                maxTemperatureDropArea72: { name: '高温(>35℃落区)', type: 'maxD', legend: 'fallzone' },
                futureMinTemperature72: { name: '低温(格点)', type: 'min', legend: 'grid' },
                minTemperatureDropArea72: { name: '低温(≤5℃落区)', type: 'minD', legend: 'fallzone' }
            }
        }
    },

    mt: {
        model: 'mt',
        currModel: 'mt',
        currName: '湛江漫滩',
        currIndex: 0,
        baseItems: [ { dateTime: '0', code: 'mtzj', name: '湛江漫滩', timeName: '漫滩产品', both: true } ],
        childModel: {
            mtzj: {
                mtzj: { name: '湛江漫滩', type: 'mtzj', legend: '' },
                mtzh: { name: '珠海漫滩', type: 'mtzh', legend: '' },
                mtgd: { name: '广东漫滩', type: 'mtgd', legend: '' }
            }
        }
    },

    fireDanger: {
        model: 'fireDanger',
        currModel: 'past12',
        currName: '过去12小时',
        currIndex: 1,
        baseItems: [
            { dateTime: '-24', code: 'past24', name: '过去24小时' },
            { dateTime: '-12', code: 'past12', name: '过去12小时' },
            { dateTime: '-6', code: 'past6', name: '过去6小时' },
            { dateTime: 'now', code: 'past0', name: '当前时刻' }
        ]
    }
}

Model.level = {
    heavyRainfall: {
        // 0: { id: 'heavyRainfall_1', val: '0', color: '#FFFFFF', text: '毛毛雨' },
        1: { id: 'heavyRainfall_2', val: '1', color: '#A6F28E', text: '小雨' },
        2: { id: 'heavyRainfall_3', val: '2', color: '#3DB93D', text: '中雨' },
        3: { id: 'heavyRainfall_4', val: '3', color: '#61B8FF', text: '大雨' },
        4: { id: 'heavyRainfall_5', val: '4', color: '#0000FE', text: '暴雨' },
        5: { id: 'heavyRainfall_6', val: '5', color: '#FA00FA', text: '大暴雨' },
        6: { id: 'heavyRainfall_7', val: '6', color: '#810040', text: '特大暴雨' }
    },
    heavyRainfallFallzone: {
        // 1: { id: 'heavyRainfall_1', val: '1', color: '#1EB41E', text: '10-25' },
        // 2: { id: 'heavyRainfall_2', val: '2', color: '#FF3200', text: '25-50' },
        // 3: { id: 'heavyRainfall_3', val: '3', color: '#A5000A', text: '50-100' },
        // 4: { id: 'heavyRainfall_4', val: '4', color: '#600020', text: '100-250' },
        // 5: { id: 'heavyRainfall_5', val: '5', color: '#600020', text: '≥250' }
        1: { id: 'heavyRainfall_1', val: '1', color: '#3DB93D', text: '10-25' },
        2: { id: 'heavyRainfall_2', val: '2', color: '#61B8FF', text: '25-50' },
        3: { id: 'heavyRainfall_3', val: '3', color: '#0000FE', text: '50-100' },
        4: { id: 'heavyRainfall_4', val: '4', color: '#FA00FA', text: '100-250' },
        5: { id: 'heavyRainfall_5', val: '5', color: '#810040', text: '≥250' }
    },
    gale: {
        1: { id: 'gale_1', val: '1', color: '#4169FF', text: '2-3' },
        2: { id: 'gale_2', val: '2', color: '#0000FF', text: '4-5' },
        3: { id: 'gale_3', val: '3', color: '#DAA520', text: '6-7' },
        4: { id: 'gale_4', val: '4', color: '#FFFF00', text: '8-9' },
        5: { id: 'gale_5', val: '5', color: '#FF8C00', text: '10-11' },
        6: { id: 'gale_6', val: '6', color: '#FF1493', text: '12-13' },
        7: { id: 'gale_7', val: '7', color: '#DC1406', text: '>=14' }
    },
    galeFallzone: {
        1: { id: 'gale_1', val: '1', color: '#74F28F', text: '6' },
        2: { id: 'gale_2', val: '2', color: '#3DBA3D', text: '8' },
        3: { id: 'gale_3', val: '3', color: '#61B8FF', text: '10' },
        4: { id: 'gale_4', val: '4', color: '#0000E1', text: '12' }
    },
    mountainTorrents: [
        { id: 'mountainTorrents_4', val: '4', color: '#00CFF1', text: 'Ⅳ级' },
        { id: 'mountainTorrents_3', val: '3', color: '#FFFD00', text: 'Ⅲ级' },
        { id: 'mountainTorrents_2', val: '2', color: '#FF9513', text: 'Ⅱ级' },
        { id: 'mountainTorrents_1', val: '1', color: '#F72D22', text: 'Ⅰ级' }
    ],
    waterLogging: [
        { id: 'waterLogging_4', val: '4', color: '#00CFF1', text: 'Ⅳ级' },
        { id: 'waterLogging_3', val: '3', color: '#FFFD00', text: 'Ⅲ级' },
        { id: 'waterLogging_2', val: '2', color: '#FF9513', text: 'Ⅱ级' },
        { id: 'waterLogging_1', val: '1', color: '#F72D22', text: 'Ⅰ级' }
    ],
    temp: {
        1: { id: 'temp_1', val: '1', color: '#285CFD', text: '<=5' },
        2: { id: 'temp_2', val: '2', color: '#10BDFD', text: '5-10' },
        3: { id: 'temp_3', val: '3', color: '#E66CC5', text: '10-15' },
        4: { id: 'temp_4', val: '4', color: '#FFFF9D', text: '15-20' },
        5: { id: 'temp_5', val: '5', color: '#FFD322', text: '20-25' },
        6: { id: 'temp_6', val: '6', color: '#FFA318', text: '25-30' },
        7: { id: 'temp_7', val: '7', color: '#FF5818', text: '30-40' },
        8: { id: 'temp_8', val: '8', color: '#FF0000', text: '>40' }
    },
    tempFallzone: {
        1: { id: 'temp_1', val: '1', color: '#9F9F3F', text: '0-25' },
        2: { id: 'temp_2', val: '2', color: '#F5E048', text: '25-29' },
        3: { id: 'temp_3', val: '3', color: '#F6AD42', text: '29-33' },
        4: { id: 'temp_4', val: '4', color: '#EF6349', text: '34' },
        5: { id: 'temp_5', val: '5', color: '#E82424', text: '35' },
        6: { id: 'temp_6', val: '6', color: '#CB1E02', text: '36' },
        7: { id: 'temp_7', val: '7', color: '#AB1800', text: '>36' }
    },
    mt: {
        1: { id: 'mt_1', val: '1', color: '#F7FFAA', text: '0-0.5' },
        2: { id: 'mt_2', val: '2', color: '#F3FF4E', text: '0.5-1' },
        3: { id: 'mt_3', val: '3', color: '#FFFD00', text: '1.1-1.5' },
        4: { id: 'mt_4', val: '4', color: '#FFA900', text: '1.5-2' },
        5: { id: 'mt_5', val: '5', color: '#FF6700', text: '2.1-2.5' },
        6: { id: 'mt_6', val: '6', color: '#FF0000', text: '2.5-3' },
        7: { id: 'mt_7', val: '7', color: '#570000', text: '>3m' }
    },
    stormTide: {
        1: { id: 'stormTide_1', val: '1', color: '#0000CD', text: 'Ⅰ级' },
        2: { id: 'stormTide_2', val: '2', color: '#4169E1', text: 'Ⅱ级' },
        3: { id: 'stormTide_3', val: '3', color: '#1E90FF', text: 'Ⅲ级' },
        4: { id: 'stormTide_4', val: '4', color: '#FFFFFF', text: 'Ⅳ级' },
        5: { id: 'stormTide_5', val: '5', color: '#FFE132', text: 'Ⅴ级' },
        6: { id: 'stormTide_6', val: '6', color: '#FFAA00', text: 'Ⅵ级' },
        7: { id: 'stormTide_7', val: '7', color: '#FF6E00', text: 'Ⅶ级' },
        8: { id: 'stormTide_8', val: '8', color: '#C80000', text: 'Ⅷ级' },
        9: { id: 'stormTide_9', val: '9', color: '#A02323', text: 'Ⅸ级' }
    },
    pollutantDispersion: {
        2: { id: 'pollutantDispersion_0', val: '2', color: '#52d918', rgba: '98, 255, 29, 0.6', text: '轻微' },
        3: { id: 'pollutantDispersion_1', val: '3', color: '#0aead8', rgba: '0, 255, 180, 0.6', text: '轻度' },
        4: { id: 'pollutantDispersion_2', val: '4', color: '#0099fa', rgba: '0, 228, 255, 0.6', text: '中度' },
        5: { id: 'pollutantDispersion_3', val: '5', color: '#fa9c05', rgba: '246, 247, 68, 0.6', text: '较重' },
        6: { id: 'pollutantDispersion_4', val: '6', color: '#bf1c0a', rgba: '207, 54, 23, 0.6', text: '重度' },
        7: { id: 'pollutantDispersion_5', val: '7', color: '#65001f', rgba: '159, 0, 0, 0.6', text: '严重' }
    },
    fireDanger: {
        0: { id: 'fireDanger_1', val: '0', color: '#4169FE', text: '0级' },
        1: { id: 'fireDanger_2', val: '1', color: '#0000FB', text: 'Ⅰ级' },
        2: { id: 'fireDanger_3', val: '2', color: '#D9A31C', text: 'Ⅱ级' },
        3: { id: 'fireDanger_4', val: '3', color: '#D5830F', text: 'Ⅲ级' },
        4: { id: 'fireDanger_5', val: '4', color: '#F06B08', text: 'Ⅳ级' },
        5: { id: 'fireDanger_6', val: '5', color: '#FF1193', text: 'Ⅴ级' },
        6: { id: 'fireDanger_7', val: '6', color: '#DC1103', text: 'Ⅵ级' },
        7: { id: 'fireDanger_8', val: '7', color: '#970E05', text: 'Ⅶ级' }
    }
}

Model.time = function (type, detail, time) {
    // time = TU().clone(time);
    // let { hour } = TU().split(time);
    // let tu = TU(time);
    // let timeStr = null;
    // const templateMap = {
    //     stormTide: 'YYYYMMDDHH0000',
    //     pollutantDispersion: 'YYYYMMDDHH00'
    // };
    // const filter = [ 'pollutantDispersion', 'stormTide', 'waterLogging', 'fireDanger', 'mt', 'mountainTorrents' ];
    // const status = filter.includes(type);
    // detail = status ? type : detail;
    // if (!status && this.mapping[detail].type === 'fixed') {
    //     if (hour >= 8 && hour <= 20) {
    //         timeStr = tu.setHour(8).format('YYYYMMDDHH');
    //     } else if (hour < 8) {
    //         timeStr = tu.date(-1).setHour(20).format('YYYYMMDDHH');
    //     } else if (hour > 20) {
    //         timeStr = tu.setHour(20).format('YYYYMMDDHH');
    //     }
    // } else {
    //     const period = [ 'heavyRainfall', 'gale', 'temp' ].includes(type);
    //     const hour = this.mapping[detail].dateTime;
    //     if (period && hour < 0) {
    //         timeStr = tu.hour(-1).format(templateMap[type] || 'YYYYMMDDHH');
    //     } else {
    //         let time = 0;
    //         if (type !== 'pollutantDispersion') {
    //             time = this.mapping[detail].dateTime;
    //         }
    //         timeStr = tu.hour(time).format(templateMap[type] || 'YYYYMMDDHH');
    //     }
    // }
    return TU(time).format('YYYY-MM-DD HH:mm:ss');
};

Model.timeStr = function (type, detail, time) {
    const timeStr = Model.time(type, detail, time);
    const period = [ 'heavyRainfall', 'gale', 'temp' ].includes(type);
    const template = 'YYYY年MM月DD日HH时';
    if (period) {
        let start
        const hour = this.mapping[detail].dateTime;
        const past = hour < 0;
        const stu = TU(timeStr);
        const etu = TU(timeStr);
        const end = past ? etu.hour(0).format(template) : etu.hour(hour).format(template);

        // 根据需要修改标题时间区间
        switch (detail) {
            case 'heavyRainfall48_2d':
                start = past ? stu.hour(hour).format(template) : etu.hour(-24).format(template);
                break
            case 'heavyRainfall72_2d':
                start = past ? stu.hour(hour).format(template) : etu.hour(-24).format(template);
                break

            default:
                start = past ? stu.hour(hour).format(template) : stu.format(template);
                break
        }

        return `${start} - ${end}`;
    } else {
        return `${TU(timeStr).format(template)}`;
    }
}

const PollutantDispersion = {
    address: [
        { id: 1, lon: '113.55', lat: '22.84', address: '广州南沙泰山石化发展有限公司' },
        { id: 2, lon: '113.57', lat: '22.65', address: '东方国际集装箱（广州）有限公司' },
        { id: 3, lon: '116.61', lat: '23.69', address: '潮州丹木涂料有限公司' },
        { id: 4, lon: '116.62', lat: '23.61', address: '潮安县浮洋镇豪全陶瓷制作厂' },
        { id: 5, lon: '113.96', lat: '22.91', address: '东莞市政欣化工科技有限公司' },
        { id: 6, lon: '114.14', lat: '22.79', address: '群光电子（东莞）有限公司' },
        { id: 7, lon: '113.59', lat: '22.90', address: '石东油库' },
        { id: 8, lon: '113.03', lat: '22.98', address: '广东能强陶瓷有限公司' },
        { id: 9, lon: '113.04', lat: '22.96', address: '佛山市粤祥陶瓷有限公司' },
        { id: 10, lon: '113.41', lat: '23.08', address: '广州中船黄埔造船有限公司' },
        { id: 11, lon: '113.33', lat: '22.90', address: '广州市番禺富邦粘胶有限公司' },
        { id: 12, lon: '113.30', lat: '23.37', address: '华南蓝天航空油料有限公司广东分公司' },
        { id: 13, lon: '114.71', lat: '23.74', address: '河源市友利德化工有限公司' },
        { id: 14, lon: '114.28', lat: '23.05', address: '惠州市庆广化工有限公司' },
        { id: 15, lon: '114.34', lat: '23.03', address: '惠州市金山电子有限公司' },
        { id: 16, lon: '114.61', lat: '22.75', address: '惠州市东达石化有限公司' },
        { id: 17, lon: '113.03', lat: '22.50', address: '江门市彩信化工有限公司' },
        { id: 18, lon: '113.13', lat: '22.60', address: '江门市广悦电化有限公司' },
        { id: 19, lon: '112.98', lat: '21.92', address: '台山核电' },
        { id: 20, lon: '116.43', lat: '23.56', address: '揭阳市泰鸿化工有限公司' },
        { id: 21, lon: '116.50', lat: '23.45', address: '揭东县通辉石化有限公司' },
        { id: 22, lon: '110.96', lat: '21.58', address: '茂名华粤华源气体有限公司' },
        { id: 23, lon: '110.89', lat: '21.67', address: '茂名市供气总公司' },
        { id: 24, lon: '115.73', lat: '24.17', address: '中石化广东梅州石油分公司' },
        { id: 25, lon: '116.15', lat: '24.28', address: '梅州中燃城市燃气发展有限公司' },
        { id: 26, lon: '113.11', lat: '23.56', address: '清远市泛太化工实业有限公司' },
        { id: 27, lon: '113.67', lat: '24.19', address: '英德市高远通新材料科技有限公司' },
        { id: 28, lon: '116.66', lat: '23.41', address: '汕头市俊昌化工有限公司' },
        { id: 29, lon: '116.74', lat: '23.35', address: '广东石油分公司汉汕油库' },
        { id: 30, lon: '115.35', lat: '22.83', address: '汕尾市城区德昌电子有限公司' },
        { id: 31, lon: '114.27', lat: '25.10', address: '南雄市科鼎化工有限公司' },
        { id: 32, lon: '113.58', lat: '24.59', address: '乌石火电站' },
        { id: 33, lon: '114.03', lat: '22.71', address: '深圳市燃气集团股份有限公司.' },
        { id: 34, lon: '114.33', lat: '22.79', address: '深圳市宇鹏化工有限公司' },
        { id: 35, lon: '114.53', lat: '22.60', address: '大亚湾核电' },
        { id: 36, lon: '112.03', lat: '21.89', address: '阳东县生晖金属涂料有限公司' },
        { id: 37, lon: '112.26', lat: '21.71', address: '阳江核电' },
        { id: 38, lon: '112.04', lat: '22.97', address: '云硫矿业分公司' },
        { id: 39, lon: '112.38', lat: '22.69', address: '新兴县金玛利陶瓷有限公司' },
        { id: 40, lon: '110.37', lat: '21.21', address: '中石化管道储运分公司湛江输油处' },
        { id: 41, lon: '112.50', lat: '23.05', address: '肇庆星岩制漆有限公司' },
        { id: 42, lon: '112.73', lat: '23.22', address: '肇庆市国美陶瓷有限公司' },
        { id: 43, lon: '113.30', lat: '22.72', address: '中山市三森汉诺威化工涂料有限公司' },
        { id: 44, lon: '113.30', lat: '22.61', address: '中山市威勇电子有限公司' },
        { id: 45, lon: '113.43', lat: '22.57', address: '中山台光电子材料有限公司' },
        { id: 46, lon: '113.58', lat: '22.24', address: '九州港' },
        { id: 47, lon: '113.20', lat: '22.03', address: '珠海金成田化工有限公司' }
    ],
    factory: [
        { value: 'sy', text: '石油厂' },
        { value: 'hd', text: '核电厂' },
        { value: 'gt', text: '钢铁厂' },
        { value: 'tl', text: '涂料厂' },
        { value: 'hg', text: '化工厂' },
        { value: 'rq', text: '燃气厂' },
        { value: 'mq', text: '煤气厂' },
        { value: 'dz', text: '电子厂' },
        { value: 'zy', text: '炸药厂' },
        { value: 'tc', text: '陶瓷厂' },
        { value: 'dd', text: '机械电镀厂' },
        { value: 'sk', text: '石矿厂' },
        { value: 'sj', text: '塑胶厂' },
        { value: 'sn', text: '水泥厂' },
        { value: 'od', text: '火电厂' },
        { value: 'qt', text: '其他' }
    ],
    mapping: {
        chemical: {
            XSO2: '二氧化硫',
            C137: '铯137',
            I131: '碘131',
            XXXC: '炭',
            C6H6: '苯',
            XXCO: '一氧化碳',
            XPbO: '氧化铅',
            HgON: '雷汞',
            C6HO: '苯酚',
            XCH4: '甲烷',
            C2H4: '乙烯',
            XXNi: '镍',
            XBeO: '氧化铍',
            XXHF: '氟化氢',
            SiO2: '二氧化硅',
            Fe2O: '三氧化二铁',
            BaSO: '重晶石',
            XCaO: '氧化钙',
            Al2O: '三氧化二铝',
            XXH2: '氢气'
        },
        factory: {
            sy: [ 'C6H6', 'XSO2', 'C6HO', 'C2H4' ],
            hd: [ 'C137', 'I131' ],
            gt: [ 'Fe2O', 'C6H6', 'XXXC' ],
            tl: [ 'C6H6', 'C6HO' ],
            hg: [ 'C6H6', 'C6HO' ],
            rq: [ 'XXCO', 'XCH4' ],
            mq: [ 'XXH2', 'XXCO', 'XCH4' ],
            dz: [ 'XPbO', 'XXNi', 'C6H6' ],
            zy: [ 'HgON', 'C6HO' ],
            tc: [ 'XXNi', 'XBeO', 'XXHF' ],
            dd: [ 'XPbO', 'XXNi', 'C6H6' ],
            sk: [ 'SiO2', 'BaSO' ],
            sj: [ 'C6H6', 'C6HO' ],
            sn: [ 'Al2O', 'Fe2O', 'XCaO', 'SiO2' ],
            od: [ 'XSO2', 'XXXC' ],
            qt: [ 'XSO2', 'C137', 'I131', 'XXXC', 'C6H6', 'XXCO', 'XPbO', 'HgON', 'C6HO', 'XCH4', 'C2H4', 'XXNi', 'XBeO', 'XXHF', 'SiO2', 'Fe2O', 'BaSO', 'XCaO', 'Al2O', 'XXH2' ]
        }
    }
}

export { Model, PollutantDispersion };
