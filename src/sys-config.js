const isProduction = process.env.NODE_ENV === 'production'
const host = 'http://10.148.10.208'
// const host = 'http://10.148.16.56'
let config = {
    IP: isProduction ? '' : host,
    TESTIP: isProduction ? '' : host,
    REMOTEPATH: isProduction ? '/dss' : host + '/dss',
    ONLINEPATH: isProduction ? '/dss' : host + '/dss',
    TESTPATH: isProduction ? '/dss-server-gd' : host + '/dss-server-gd'
}

Object.defineProperty(config, 'IP', {
    writable: false
})

Object.defineProperty(config, 'TESTIP', {
    writable: false
})

Object.defineProperty(config, 'REMOTEPATH', {
    writable: false
})

Object.defineProperty(config, 'ONLINEPATH', {
    writable: false
})

Object.defineProperty(config, 'TESTPATH', {
    writable: false
})

Object.defineProperty(config, 'MERCATOR_PROJECTION', {
    value: 'EPSG:3857',
    writable: false
})

Object.defineProperty(config, 'SYSTEM_PROJECTION', {
    value: 'EPSG:3857',
    writable: false
})

Object.defineProperty(config, 'SOURCE_PROJECTION', {
    value: 'EPSG:4326',
    writable: false
})

module.exports = config;
