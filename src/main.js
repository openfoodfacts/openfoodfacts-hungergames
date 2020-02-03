import Vue from 'vue'
import VueRouter from 'vue-router'
import Viewer from 'v-viewer'
import App from './App.vue'
import IngredientsView from './views/IngredientsView.vue'
import QuestionView from './views/QuestionView.vue'
import SettingsView from './views/SettingsView.vue'
import 'viewerjs/dist/viewer.css'

Vue.use(VueRouter)
Vue.use(Viewer)
Vue.config.productionTip = false


const routes = [
  { path: '/', redirect: '/questions' },
  { path: '/ingredients', component: IngredientsView },
  { path: '/questions', component: QuestionView },
  { path: '/settings', component: SettingsView },
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
