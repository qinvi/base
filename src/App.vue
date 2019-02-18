<template>
<div>
    <v-login v-if="status && login" @destroy="gotoLogin()"></v-login>
    <v-index v-if="!login"></v-index>
</div>
</template>

<script>
import Login from './components/Login'
import Index from './components/Index'
import { mapActions, mapState } from 'vuex';

export default {
    name: 'app',
    components: {
        'v-login': Login,
        'v-index': Index
    },
    data() {
        return {
            status: false
        }
    },
    computed: {
        ...mapState({
            login: state => state.login
        })
    },
    methods: {
        ...mapActions(['updateParam']),
        gotoLogin() {
            this.updateParam([{login: false}]);
        },
        getLog() {
            // const version = 'V5.0.0';
            // this.updateParam([ 'sys', { version } ]);
            utils.get(sysconfig.TESTPATH + '/track/getVersionMsg').then((json) => {
                if (!json || !json.data) throw new Error('NO DATA')

                this.status = true;
                const version = json.data.resp[0].version;
                this.updateParam([ 'sys', { version } ]);
            }).catch((ex) => {
                setTimeout(() => {
                    this.getLog()
                }, 1000)
            })
        }
    },
    beforeMount() {
        console.log('😃');
        this.getLog();
    }
}
</script>
