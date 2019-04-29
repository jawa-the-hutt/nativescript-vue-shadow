import Vue from 'nativescript-vue';
import App from './App.vue';

import NSVueShadow from '../../'
Vue.use(NSVueShadow)

// Set the following to `true` to hide the logs created by nativescript-vue
Vue.config.silent = false;
// Set the following to `false` to not colorize the logs created by nativescript-vue
// disabled in template due to typing issue for Typescript projects....NEEDS TO BE FIXED
// @ts-ignore
Vue.config.debug = true;

// setup NS-Vue Devtools for use
import VueDevtools from 'nativescript-vue-devtools';
Vue.use(VueDevtools, { host: '10.0.2.2' });

new Vue({
  render: h => h('frame', [h(App)]),
}).$start();
