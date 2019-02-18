<template>
    <div :class="['icon', {'icon-chose': selected}]"></div>
</template>

<script>
    export default {
        props: [ 'selected' ],
        data() {
            return {}
        },
        computed: {}
    }
</script>

<style scoped lang="less">
    .icon {
        position: absolute;
        top: 3px;
        right: 0;
    }

    .base-info {
        .icon {
            top: -1px;
            right: -2px;
        }

        .deptments {
            .icon {
                top: -4px;
                right: -6px;
            }
        }
    }

    .model {
        .icon {
            
        }
    }
</style> 
