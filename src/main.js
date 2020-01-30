import Vue from 'vue'
import VueRouter from 'vue-router'
import Viewer from 'v-viewer'
import App from './App.vue'
import IngredientsView from './views/IngredientsView.vue'
import QuestionView from './views/QuestionView.vue'
import 'viewerjs/dist/viewer.css'

Vue.use(VueRouter)
Vue.use(Viewer)
Vue.config.productionTip = false


const routes = [
  { path: '/', component: QuestionView },
  { path: '/ingredients', component: IngredientsView },
  { path: '/questions', component: QuestionView },
];

const router = new VueRouter({
  mode: 'history',
  routes,
  linkActiveClass: "partial-active",
  linkExactActiveClass: "active",
});
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
