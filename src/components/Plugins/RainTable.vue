<template>
	<div class="rain-info-table" :style="{width: tableWidth + 'px'}">
        <div class="thead">
            <table>
                <thead>
                    <tr>
                        <td v-for="value in title">
                            {{value}}
                        </td>
                    </tr>
                </thead>
            </table>
        </div>
	    <div class="tbody">
            <div class="wrapper" v-show="dataStatus" :id="mark" :style="tbodyHeigth">
                <table>
                    <tbody class="ps-table">
                        <tr v-for="entry in dataItems" @mouseenter="genus?mouseSent(entry):''"  @click="clickEvent(entry)">
                            <td v-for="(value, key) in title" :title="entry[key]">
                                {{entry[key]}}
                            </td>
                        </tr>
                    </tbody> 
                </table>    
            </div>
            <div v-show ="!dataStatus" class="nodata">暂无数据 </div>
	    </div>
	</div>
</template>

<script>
// import PS from 'perfect-scrollbar';
import { mapState } from 'vuex';
// import 'perfect-scrollbar/css/perfect-scrollbar.css';
import IScroll from 'iscroll';

export default {
    props: [
        'mark',
        'genus',
        'title',
        'dataItems',
        'height'
    ],
    data() {
        return {}
    },
    computed: {
        ...mapState({
            bigScreen: state => state.toolsBar.bigScreen
        }),
        dataStatus() {
            if (typeof this.dataItems === 'object') return (Object.keys(this.dataItems).length !== 0);
            else if (Array.isArray(this.dataItems)) return (this.dataItems[0].length !== 0);
        },
        tbodyHeigth() {
            if (!this.height) return {};
            else return {height: (parseInt(this.height) - 26) + 'px'};
        },
        tableWidth() {
            return (this.bigScreen ? 424 : 318);
        }
    },
    watch: {
        dataItems() {
            this.setScroll();
        },
        bigScreen() {
            this.setScroll();
        }
    },
    methods: {
        filter(entry) {
            let reference = {areaName: 0, siteCount: 1, maxRain: 2, avgRain: 3, areaCode: 4, areaList: 5};
            let array = Object.keys(entry).sort((a, b) => {
                return reference[a] - reference[b];
            });
            return array;
        },
        mouseSent(subset) {
            this.setScroll();
            this.$emit('genusInfo', {type: this.genus, status: true, subset: subset});
        },
        clickEvent(subset) {
            this.$emit('touch', {type: this.genus, subset: subset});
        },
        setScroll() {
            this.$nextTick(() => {
                /* eslint-disable */
                if (this.scrollId) {
                    this.scrollId.refresh();
                } else {
                    /* eslint-disable */
                    this.scrollId = new IScroll('#' + this.mark, {
                        mouseWheel: true,
                        scrollbars: true,
                        disableMouse: true,
                        interactiveScrollbars: true,
                        disablePointer: true,
                        click: false
                    });
                }    
            })
        }
    },
    mounted() {
        this.setScroll();
        // this.newPsScroller()
    }
}
</script>

<style lang='less' scoped>
	@import "../../assets/css/common.less";

	.rain-info-table {
		height: auto;
        background: #fff;
        border: 1px solid #E5E8EC;
        
        .wrapper {
            overflow: hidden;
        }
        table {
            tr {
                display:  flex;
            }
            td {
                flex: 1 0 0;
                width: 72px;
                border: 0;
                border-right: 1px solid #E5E8EC;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space:nowrap;
            }
            tbody {
                overflow: hidden;
            }
            td:first-child {
                width: 74px
            }
        }
        .nodata {
            text-align: center;
            height: 74px;
            line-height: 74px;
        }
        .tbody {
            position: relative;
            /* height: 120px; */
        }
	}
</style>
