import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Room from '@/components/Room'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/room/:id',
      name: 'Room',
      component: Room
    }
  ]
})
