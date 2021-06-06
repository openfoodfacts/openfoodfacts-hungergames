import Vue from 'vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Viewer from 'v-viewer'
import VueZoomer from 'vue-zoomer'
import './semantic-ui-utils/main.css'
import App from './App.vue'
import QuestionView from './views/QuestionView.vue'
import NutritionView from './views/NutritionView.vue'
import NutritionViewWIP1 from "./views/NutritionViewWIP1.vue"
import NutritionViewWIP2 from "./views/NutritionViewWIP2.vue"
import NutritionViewComputer from "./views/NutritionViewComputer.vue"
import NutritionProblems from "./views/NutritionProblems.vue"
import TableAnnotation from './views/TableAnnotation.vue'
import SettingsView from './views/SettingsView.vue'
import InsightListView from './views/InsightListView.vue'
import LogoSearchView from './views/LogoSearchView.vue'
import LogoAnnotationView from './views/LogoAnnotationView.vue'
import LogoUpdateView from './views/LogoUpdateView.vue'
import 'viewerjs/dist/viewer.css'
import SuiVue from 'semantic-ui-vue'
import messages from './i18n/messages'
import { getLang } from "./settings";

Vue.use(SuiVue)
Vue.use(VueRouter)
Vue.use(Viewer)
Vue.use(VueI18n)
Vue.use(VueZoomer)
Vue.config.productionTip = false


Vue.directive("focus", {
  componentUpdated: function(el) {
    el.firstElementChild.focus();
  },
  inserted: function(el) {
    el.firstElementChild.focus();
  },
});
const routes = [
  { path: '/', redirect: '/questions' },
  { path: '/insights', component: InsightListView },
  { path: '/questions', component: QuestionView },
  { path: '/nutritions', component: NutritionView },
  { path: "/nutritionsWIP1", component: NutritionViewWIP1 },
  { path: "/nutritionsWIP2", component: NutritionViewWIP2 },
  { path: "/nutritionComputer", component: NutritionViewComputer },
  { path: "/nutritionProblems", component: NutritionProblems },
  { path: '/table', component: TableAnnotation },
  { path: '/settings', component: SettingsView },
  { path: '/logos', component: LogoAnnotationView },
  { path: '/logos/search', component: LogoSearchView },
  { path: '/logos/:id', component: LogoUpdateView },
];

const router = new VueRouter({
  mode: 'history',
  routes,
});


const i18n = new VueI18n({
  locale: getLang(),
  messages,
  fallbackLocale: 'en'
})

new Vue({
  router,
  i18n,
  render: h => h(App)
}).$mount('#app')
