const Viewer = {};
Viewer.GPSLONLAT = {
    PI: 3.14159265358979324,
    x_pi: 3.14159265358979324 * 3000.0 / 180.0,
    delta: function (lat, lon) {
        //  Krasovsky 1940
        //  a = 6378245.0, 1/f = 298.3
        //  b = a * (1 - f)
        //  ee = (a^2 - b^2) / a^2;
        let a = 6378245.0;
        let ee = 0.00669342162296594323;
        let dLat = this.transformLat(lon - 105.0, lat - 35.0);
        let dLon = this.transformLon(lon - 105.0, lat - 35.0);
        let radLat = lat / 180.0 * this.PI;
        let magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        let sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
        dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
        return { 'lat': dLat, 'lon': dLon };
    },
    // WGS-84 to GCJ-02
    gcj_encrypt: function (wgsLat, wgsLon) {
        if (this.outOfChina(wgsLat, wgsLon)) return { 'lat': wgsLat, 'lon': wgsLon };

        let d = this.delta(wgsLat, wgsLon);
        return { 'lat': parseFloat(wgsLat) + parseFloat(d.lat), 'lon': parseFloat(wgsLon) + parseFloat(d.lon) };
    },
    // GCJ-02 to WGS-84
    gcj_decrypt: function (gcjLat, gcjLon) {
        if (this.outOfChina(gcjLat, gcjLon)) return { 'lat': gcjLat, 'lon': gcjLon };

        let d = this.delta(gcjLat, gcjLon);
        return { 'lat': gcjLat - d.lat, 'lon': gcjLon - d.lon };
    },
    // GCJ-02 to WGS-84 exactly
    gcj_decrypt_exact: function (gcjLat, gcjLon) {
        let initDelta = 0.01;
        let threshold = 0.000000001;
        let dLat = initDelta;
        let dLon = initDelta;
        let mLat = gcjLat - dLat;
        let mLon = gcjLon - dLon;
        let pLat = gcjLat + dLat;
        let pLon = gcjLon + dLon;
        let wgsLat, wgsLon;
        let i = 0;
        while (1) {
            wgsLat = (mLat + pLat) / 2;
            wgsLon = (mLon + pLon) / 2;
            let tmp = this.gcj_encrypt(wgsLat, wgsLon)
            dLat = tmp.lat - gcjLat;
            dLon = tmp.lon - gcjLon;
            if ((Math.abs(dLat) < threshold) && (Math.abs(dLon) < threshold)) break;

            if (dLat > 0) pLat = wgsLat; else mLat = wgsLat;
            if (dLon > 0) pLon = wgsLon; else mLon = wgsLon;

            if (++i > 10000) break;
        }
        // console.log(i);
        return { 'lat': wgsLat, 'lon': wgsLon };
    },
    // GCJ-02 to BD-09
    bd_encrypt: function (gcjLat, gcjLon) {
        let x = gcjLon;
        let y = gcjLat;
        let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
        let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
        let bdLon = z * Math.cos(theta) + 0.0065;
        let bdLat = z * Math.sin(theta) + 0.006;
        return { 'lat': bdLat, 'lon': bdLon };
    },
    // BD-09 to GCJ-02
    bd_decrypt: function (bdLat, bdLon) {
        let x = bdLon - 0.0065;
        let y = bdLat - 0.006;
        let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
        let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
        let gcjLon = z * Math.cos(theta);
        let gcjLat = z * Math.sin(theta);
        return { 'lat': gcjLat, 'lon': gcjLon };
    },
    distance: function (latA, logA, latB, logB) {
        let earthR = 6371000;
        let x = Math.cos(latA * Math.PI / 180) * Math.cos(latB * Math.PI / 180) * Math.cos((logA - logB) * Math.PI / 180);
        let y = Math.sin(latA * Math.PI / 180) * Math.sin(latB * Math.PI / 180);
        let s = x + y;
        if (s > 1) s = 1;
        if (s < -1) s = -1;
        let alpha = Math.acos(s);
        let distance = alpha * earthR;
        return distance;
    },
    outOfChina: function (lat, lon) {
        if (lon < 72.004 || lon > 137.8347) return true;
        if (lat < 0.8293 || lat > 55.8271) return true;
        return false;
    },
    transformLat: function (x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    },
    transformLon: function (x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0;
        return ret;
    }
};
Viewer.LCB = {
    /**
     * 由后台推送直播端位置信息
     */
    gotPostion: function (lon, lat, accuracy) {
        console.log('后台推送的直播端位置信息');
        // console.log(lon);
        // console.log(lat);
        // console.log(accuracy);

        // BD-09 to GCJ-02
        let rtjson = Viewer.GPSLONLAT.bd_decrypt(lat, lon);
        console.log(rtjson);
    },
    gotOnliveStatus: function (status) {
        return status;
    },
    queryOnliveStatus: function (sendCallback) {
        var message = {
            id: 'onlive'
        }
        sendCallback(message);
    }
};

export { Viewer };
