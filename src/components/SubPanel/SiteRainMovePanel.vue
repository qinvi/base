<template>
    <!--鼠标移上弹出框-->
    <div class="siteInfo" :style="getPathPosition" v-if="moveWinStatus">
        <div v-if="curPoint.type==='sw'||curPoint.type==='swen'">
            <div class="title nullbg">{{curPoint.name}}(水位信息)</div>
            <div class="popTab popTaBorder">
                <ul class="site-water-ui">
                    <li>站点号：{{curPoint.siteID}}</li>
                    <li>类型：水位站</li>
                    <li>经度：{{curPoint.lon}}</li>
                    <li>纬度：{{curPoint.lat}}</li>
                    <li>水位：--</li>
                </ul>
            </div>
        </div>
        <div class="site-min-panel poiPop" v-if="curPoint.type==='gj'||curPoint.type==='qy'">
            <div class="title nullbg">{{curPoint.name}}(雨量信息)</div>
            <div class="popTab popTaBorder">
                <div class="title">站点信息</div>
                <div class="site-min-ui">
                    <div class="title nullbg">
                        <span>站点号：{{curPoint.siteID}}</span>
                        <span v-if="curPoint.type==='qy'">    类型：区域站</span>
                        <span v-if="curPoint.type==='gj'">    类型：国家站</span>
                    </div>
                    <div class="info">
                        <span>过去雨量</span>
                        <table cellpadding="0" cellspacing="0">
                            <tr><td>1小时</td><td>6小时</td><td>12小时</td><td>24小时</td></tr>
                            <tr><td>{{siteCurRain.rain1hour}}</td><td>{{siteCurRain.rain6hour}}</td><td>{{siteCurRain.rain12hour}}</td><td>{{siteCurRain.rain24hour}}</td></tr>
                        </table>
                        <span>未来雨量</span>
                        <table cellpadding="0" cellspacing="0">
                            <tr><td>1小时</td><td>6小时</td><td>24小时</td><td>72小时</td></tr>
                            <tr><td>{{siteFutureRain.rain1hour}}</td><td>{{siteFutureRain.rain6hour}}</td><td>{{siteFutureRain.rain1day}}</td><td>{{siteFutureRain.rain3day}}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang='less'>
@import '../../assets/css/common.less';

.siteInfo {
    width: 300px;
    height: 221px;
    position: absolute;
    right: 0px;
    top: 0px;
    z-index: @pop-index;
    background-color: #fff;
    box-shadow: @shadow;
}

div.site-min-panel {
    /*top: 300px;
        right: 250px; */
    width: 300px;
}

.poiPop {
    width: 616px;
    height: auto;
    position: absolute;
    z-index: @pop-index;
    background: #fff;
    box-shadow: @shadow;
}
</style>
