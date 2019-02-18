<template>
    <div class="color-panel">
        <ul class="clearfix">
            <li v-for="(item, index) in colorItems" @click="selectColor(item)" :class="item.class" :key="index"></li>
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            colorItems: [
                { color: '#000000', class: 'black', code: '16' },
                { color: '#6f706b', class: 'dark-gray', code: '10' },
                { color: '#6f180e', class: 'drak-red', code: '11' },
                { color: '#f28837', class: 'orange', code: '02' },
                { color: '#266d28', class: 'dark-green', code: '08' },
                { color: '#0e37b8', class: 'deep-blue', code: '14 ' },
                { color: '#6d0b62', class: 'deep-purple', code: '12' },
                { color: '#13807f', class: 'dark-cyan', code: '06' },
                { color: '#ffffff', class: 'white', code: '01' },
                { color: '#b3b5ae', class: 'gray', code: '05' },
                { color: '#ed3f2b', class: 'tomato', code: '03' },
                { color: '#ebde37', class: 'khaki', code: '07' },
                { color: '#96c130', class: 'lime-green', code: '09' },
                { color: '#0a78c8', class: 'royal-blue', code: '15' },
                { color: '#d523c8', class: 'orchid', code: '04' },
                { color: '#1ac1ca', class: 'turquoise', code: '13' }
            ]
        };
    },
    methods: {
        selectColor(item) {
            this.$emit('touch', item);
        }
    }
};
</script>

<style lang='less' scoped>
@import '../../assets/css/common.less';

.color-panel {
    display: inline-block;
    float: left;

    ul {
        width: 120px;

        li {
            display: inline-block;
            width: 13px;
            height: 13px;
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

.big {
    .font-panel,
    .marker-panel {
        .color-panel {
            ul {
                width: 150px;
                li {
                    height: 16px;
                    width: 16px;
                }
            }
        }
    }
}
</style>
