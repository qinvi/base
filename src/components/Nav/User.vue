<template>
    <div></div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { BaseInfo as BI } from '../../utils/tools/BaseInfo.js'
export default {
    name: 'User',

    data() {
        return {
        }
    },

    computed: {
        ...mapState({
            userId: state => state.userSetting.userId,
            code: state => state.userSetting.region.code
        })
    },

    watch: {
    },

    methods: {
        ...mapActions([ 'updateParam' ]),

        /*
         * 加载用户配置
         *
         * @param {string} userId 用户 id
         */
        loadUserCustomization(userId) {
            const url = sysconfig.TESTPATH + '/basedata/getUserCustomizeByDB'

            utils.GET(url, { userId: this.userId }).then((json) => {
                if (json.status === 0) {
                    json = json.data

                    delete json.monitor.status
                    delete json.monitor.text
                    delete json.monitor.mapping
                    delete json.pois.status
                    delete json.pois.text
                    delete json.pois.mapping

                    // 处理实时观测数据
                    for (let category of Object.values(json.monitor)) {
                        if (typeof category === 'object' && category.data) {
                            category.status = false

                            for (let [key, val] of Object.entries(category.data)) {
                                let typeNormalized
                                const keyParts = key.split('_').slice(0, 2)
                                const originalType = key.split('_').slice(2).join('_')
                                const newKey = key.replace(/([a-zA-Z]+)_([a-zA-Z]+)_(.+)/, (match, p1, p2, p3) => {
                                    // if (p3.includes('RESERVOIR') && p3.includes('SHUIKU')) p3 = 'reservoirs'
                                    if (p3.includes('SOUTHRESERVOIR')) p3 = 'reservoirs'
                                    if (p3.includes('RESERVOIR_SWJ')) p3 = 'reservoirsSWJ'
                                    if (p3.includes('hl_sw')) p3 = 'river'
                                    if (p3.includes('airq')) p3 = 'air'
                                    if (p3.includes('hfs')) p3 = 'nuclear'
                                    if (p3.includes('rainwarn')) p3 = 'rainWarn'

                                    typeNormalized = p3.replace(/_/g, '')
                                    return p1 + '_' + p2 + '_' + typeNormalized
                                })

                                // 处理实景类型
                                if (keyParts[1].includes('video')) {
                                    val.isVideo = true
                                    if (!BI.videoType[keyParts[0]]) BI.videoType[keyParts[0]] = {}
                                    if (!BI.videoType[keyParts[0]][keyParts[1]]) BI.videoType[keyParts[0]][keyParts[1]] = {}
                                    BI.videoType[keyParts[0]][keyParts[1]][typeNormalized] = val.code.split(',')
                                }

                                // 处理水库和河流
                                if (typeNormalized.includes('reservoir') || typeNormalized.includes('SOUTHRESERVOIR') || typeNormalized.includes('river')) {
                                    if (!BI.poiTypes[keyParts[0]]) BI.poiTypes[keyParts[0]] = {}
                                    if (!BI.poiTypes[keyParts[0]][keyParts[1]]) BI.poiTypes[keyParts[0]][keyParts[1]] = {}
                                    BI.poiTypes[keyParts[0]][keyParts[1]][typeNormalized] = val.code.split(',')
                                }

                                val.text = val.name
                                val.status = false
                                val.originalType = originalType
                                delete val.name
                                category.data[newKey] = val

                                if (key !== newKey) {
                                    delete category.data[key]
                                }
                            }

                            // 对数据进行排序
                            category.dataSorted = []
                            category.sort.forEach((type) => {
                                for (let [key, val] of Object.entries(category.data)) {
                                    if (type === val.originalType) {
                                        val.key = key
                                        category.dataSorted.push(val)
                                    }
                                }
                            })
                        }
                    }

                    json.monitorSorted = []
                    json.monitor.sort.forEach((type) => {
                        for (let [key, val] of Object.entries(json.monitor)) {
                            if (key === type) {
                                val.key = key
                                json.monitorSorted.push(val)
                            }
                        }
                    })

                    const poiEnameMapping = {}

                    // 处理基础数据
                    for (let category of Object.values(json.pois)) {
                        if (typeof category === 'object' && category.data) {
                            category.status = false

                            for (let [key, val] of Object.entries(category.data)) {
                                const keyParts = key.split('_').slice(0, 2)
                                const type = key.split('_').slice(2).join('_')
                                const typeNormalized = type.replace(/_/g, '')
                                const newKey = keyParts.join('_') + '_' + typeNormalized

                                val.text = val.name
                                val.count = 0
                                val.status = false
                                val.originalType = type
                                category.data[newKey] = val

                                if (key !== newKey) {
                                    delete category.data[key]
                                }

                                if (!BI.poiTypes[keyParts[0]]) BI.poiTypes[keyParts[0]] = {}
                                if (!BI.poiTypes[keyParts[0]][keyParts[1]]) BI.poiTypes[keyParts[0]][keyParts[1]] = {}
                                if (!BI.poi2Dep[keyParts[0]]) BI.poi2Dep[keyParts[0]] = {}
                                if (!BI.poi2Dep[keyParts[0]][keyParts[1]]) BI.poi2Dep[keyParts[0]][keyParts[1]] = {}

                                BI.poiTypes[keyParts[0]][keyParts[1]][typeNormalized] = [typeNormalized]
                                BI.poiTypeMapping[typeNormalized] = type
                                BI.poi2Dep[keyParts[0]][keyParts[1]][typeNormalized] = []
                                BI.poiType2Key[val.code] = newKey

                                if (val.code.split(',').length > 0) {
                                    val.code.split(',').forEach((type) => {
                                        BI.poiType2Key[type] = newKey
                                    })
                                }

                                if (val.code.includes('HOSPITAL')) {
                                    BI.poiType2Key['MEDICAL_HOSPITAL'] = newKey
                                } else if (val.code.includes('SCHOOL')) {
                                    BI.poiType2Key['EDUCATION_SCHOOL'] = newKey
                                } else if (val.code.includes('HZ_TRAFFIC_TRAIN')) {
                                    BI.poiType2Key['HZ_TRAFFIC_CAR'] = newKey
                                }

                                poiEnameMapping[type] = { Name: val.text, eName: val.ename }
                            }

                            // 对数据进行排序
                            category.dataSorted = []
                            category.sort.forEach((type) => {
                                for (let [key, val] of Object.entries(category.data)) {
                                    if (type === val.originalType) {
                                        val.key = key
                                        category.dataSorted.push(val)
                                    }
                                }
                            })

                        }
                    }

                    json.poisSorted = []
                    json.pois.sort.forEach((type) => {
                        for (let [key, val] of Object.entries(json.pois)) {
                            if (key === type) {
                                val.key = key
                                json.poisSorted.push(val)
                            }
                        }
                    })

                    // 若接口未正常返回基础信息数据时
                    if (Object.keys(json.pois).length < 3) {
                        json.pois = {
                            info: { data: {} },
                            goods: { data: {} },
                            place: { data: {} },
                            power: { data: {} }
                        }
                    }

                    // 处理部门信息数据
                    for (let dept of Object.values(json.deptments.data)) {
                        dept.status = false
                    }

                    for (let [deptName, val] of Object.entries(json.deptments.mapping)) {
                        val.poi.forEach((key, index) => {
                            const keyParts = key.split('_').slice(0, 2)
                            const typeNormalized = key.split('_').slice(2).join('').replace(/_/g, '')
                            const newKey = keyParts.join('_') + '_' + typeNormalized

                            if (!BI.poi2Dep[keyParts[0]]) {
                                BI.poi2Dep[keyParts[0]] = {}
                            }

                            if (!BI.poi2Dep[keyParts[0]][keyParts[1]]) {
                                BI.poi2Dep[keyParts[0]][keyParts[1]] = {}
                            }

                            if (!BI.poi2Dep[keyParts[0]][keyParts[1]][typeNormalized]) {
                                BI.poi2Dep[keyParts[0]][keyParts[1]][typeNormalized] = []
                            }

                            BI.poi2Dep[keyParts[0]][keyParts[1]][typeNormalized].push(deptName)
                            val.poi[index] = newKey
                        })

                        // val.types = val.types.map((type) => {
                        //     return type.replace(/_/g, '')
                        // })
                    }

                    BI.deptments = json.deptments.mapping

                    for (let key in json.model.data) {
                        json.model.data[key] = json.model.data[key].map((type) => {
                            let typeNormalized
                            const newType = type.replace(/([a-zA-Z]+)_([a-zA-Z]+)_(.+)/, (match, p1, p2, p3) => {
                                // if (p3.includes('RESERVOIR') && p3.includes('SHUIKU')) p3 = 'reservoirs'
                                if (p3.includes('SOUTHRESERVOIR')) p3 = 'reservoirs'
                                if (p3.includes('RESERVOIR_SWJ')) p3 = 'reservoirsSWJ'
                                if (p3.includes('hl_sw')) p3 = 'river'
                                if (p3.includes('airq')) p3 = 'air'
                                if (p3.includes('hfs')) p3 = 'nuclear'
                                if (p3.includes('rainwarn')) p3 = 'rainWarn'

                                typeNormalized = p3.replace(/_/g, '')
                                return p1 + '_' + p2 + '_' + typeNormalized
                            })
                            return newType
                        })
                    }
                    this.updateParam(['userSetting', {
                        model: json.model.data,
                        modelOrder: json.model.sort,
                        pois: json.pois,
                        poisSorted: json.poisSorted,
                        poiOrder: json.pois.sort,
                        poiEnameMapping: poiEnameMapping,
                        monitor: json.monitor,
                        monitorSorted: json.monitorSorted,
                        deptments: json.deptments.data
                    }])

                    delete json.pois.sort
                    delete json.monitor.sort

                }
            })
        },

        /*
         * 更新用户靶向预警发布权限
         */
        updateUserTargetPermission: function () {
            utils.GET(sysconfig.TESTPATH + '/atwill/getTargetPermission', {
                userId: this.userId,
                code: this.code
            }).then(json => {
                if (json && json.data) {
                    this.updateParam(['userSetting', { targetPermission: json.data.status }])
                }
            })
        }
    },

    mounted() {
        this.loadUserCustomization()
        this.updateUserTargetPermission()
    }
}
</script>
