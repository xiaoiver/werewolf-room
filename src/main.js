// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import FastClick from 'fastclick'
import App from './App'
import router from './router'
import store from './store'
import VueSocketio from 'vue-socket.io'
import  { ToastPlugin, ConfirmPlugin, LoadingPlugin } from 'vux'
import Icon from 'vue-awesome/components/Icon.vue'

import 'vue-awesome/icons';
import '@/assets/styles/reset.styl'

Vue.config.productionTip = false

// vux
Vue.use(ToastPlugin)
Vue.use(ConfirmPlugin)
Vue.use(LoadingPlugin)

// fa icons
Vue.component('icon', Icon);

// socket.io
const SOCKET_HOST = process.env.SOCKET_HOST;
const SOCKET_PORT = process.env.SOCKET_PORT;
Vue.use(VueSocketio, `${SOCKET_HOST}:${SOCKET_PORT}`, store)

FastClick.attach(document.body)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
