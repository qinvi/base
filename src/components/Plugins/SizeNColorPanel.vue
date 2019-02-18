<template>
    <div class="snc-panel">
        <div class="font-size">
            <ul class="clearfix">
                <li v-for="(item, index) in sizeItems" :key="index" :class="[ item.code, item.code === select.size ? 'selected' : '' ]" @click="setSize(item)"></li>
            </ul>
        </div>
        <div class="color-choose">
            <div class="background-color" :style="{ backgroundColor: select.color }"></div>
            <div class="color-panel">
                <ul class="clearfix">
                    <li v-for="(item, index) in colorItems" @click="setColor(item)" :class="item.class" :key="index"></li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            select: { color: '#ED3F2B', size: 'M' },
            save: { color: { color: '#ED3F2B', class: 'tomato', code: '03' }, size: { size: '12px', width: 1, code: 'M', scale: 0.5 } },
            sizeItems: [
                { size: '12px', width: 1, code: 'M', scale: 0.5 },
                { size: '24px', width: 3, code: 'L', scale: 0.75 },
                { size: '36px', width: 5, code: 'XL', scale: 1 }
            ],
            colorItems: [
                { color: '#000000', class: 'black', code: '16' },
                { color: '#6F706B', class: 'dark-gray', code: '10' },
                { color: '#6F180E', class: 'drak-red', code: '11' },
                { color: '#F28837', class: 'orange', code: '02' },
                { color: '#266D28', class: 'dark-green', code: '08' },
                { color: '#0E37B8', class: 'deep-blue', code: '14 ' },
                { color: '#6D0B62', class: 'deep-purple', code: '12' },
                { color: '#13807F', class: 'dark-cyan', code: '06' },
                { color: '#FFFFFF', class: 'white', code: '01' },
                { color: '#B3B5AE', class: 'gray', code: '05' },
                { color: '#ED3F2B', class: 'tomato', code: '03' },
                { color: '#EBDE37', class: 'khaki', code: '07' },
                { color: '#96C130', class: 'lime-green', code: '09' },
                { color: '#0A78C8', class: 'royal-blue', code: '15' },
                { color: '#D523C8', class: 'orchid', code: '04' },
                { color: '#1AC1CA', class: 'turquoise', code: '13' }
            ]
        };
    },
    methods: {
        setColor(item) {
            this.select.color = item.color;
            this.save.color = item;
            this.$emit('color', item);
            this.setParam();
        },

        setSize(item) {
            this.select.size = item.code;
            this.save.size = item;
            this.$emit('size', item);
            this.setParam();
        },

        setParam() {
            this.$emit('param', { size: this.save.size, color: this.save.color });
        }
    }
};
</script>

<style lang='less' scoped>
@import '../../assets/css/common.less';

.snc-panel {
    width: 256px;
    height: 32px;
    box-shadow: @shadow;
    background: #fff;
    position: absolute;

    .font-size {
        height: 32px;
        float: left;
        display: inline-block;

        ul li {
            width: 32px;
            height: 32px;
            line-height: 32px;
            float: left;
            position: relative;

            &.selected::before {
                content: '';
                width: 24px;
                height: 24px;
                border: 1px solid #8c8c8c;
                display: inline-block;
                border-radius: 6px;
                vertical-align: middle;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            &.M::after, &.L::after, &.XL::after {
                content: '';
                display: inline-block;
                border: 1px solid @select-font-color;
                background: @select-font-color;
                border-radius: 100%;
                vertical-align: middle;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            &.M::after {
                width: 3px;
                height: 3px;
            }

            &.L::after {
                width: 6px;
                height: 6px;
            }

            &.XL::after {
                width: 9px;
                height: 9px;
            }

            div {
                width: 32px;
                height: 32px;
            }
        }


    }

    .color-choose {
        width: auto;
        height: 30px;
        float: left;
        background: #fff;
        display: inline-block;

        .color-panel {
            display: inline-block;

            ul {
                width: 128px;

                li {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 1px solid #eee;
                    float: left;

                    &.black {
                        background-color: rgb(0, 0, 0);
                    }

                    &.dark-gray {
                        background-color: rgb(111, 112, 107);
                    }

                    &.drak-red {
                        background-color: rgb(111, 24, 14);
                    }

                    &.orange {
                        background-color: rgb(242, 136, 55);
                    }

                    &.dark-green {
                        background-color: rgb(38, 109, 40);
                    }

                    &.deep-blue {
                        background-color: rgb(14, 55, 184);
                    }

                    &.deep-purple {
                        background-color: rgb(109, 11, 98);
                    }

                    &.dark-cyan {
                        background-color: rgb(19, 128, 127);
                    }

                    &.white {
                        background-color: rgb(255, 255, 255);
                    }

                    &.gray {
                        background-color: rgb(179, 181, 174);
                    }

                    &.tomato {
                        background-color: rgb(237, 63, 43);
                    }

                    &.khaki {
                        background-color: rgb(235, 222, 55);
                    }

                    &.lime-green {
                        background-color: rgb(150, 193, 48);
                    }

                    &.royal-blue {
                        background-color: rgb(10, 120, 200);
                    }

                    &.orchid {
                        background-color: rgb(213, 35, 200);
                    }

                    &.turquoise {
                        background-color: rgb(26, 193, 202);
                    }
                }
            }
        }

        .background-color {
            width: 30px;
            height: 30px;
            float: left;
            border: 1px solid #eee;
        }

    }
}


</style>
