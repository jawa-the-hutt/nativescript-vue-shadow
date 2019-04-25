import { VueConstructor, PluginFunction } from 'vue';

// Import directive
import { ShadowDirective } from './vue-shadow';


// export default {
//   install(Vue: VueConstructor): void {
//     Vue.directive('shadow', ShadowDirective);
//   },
// };

export function install(Vue: VueConstructor): void {

  if(install.installed) {
    console.log('not installed')
    return;
  } else {
    install.installed = true;
    Vue.directive('shadow', ShadowDirective);
  }
};

class NSVueShadow {
  static install: PluginFunction<never>;
}

export namespace install {
  export let installed: boolean;
}

NSVueShadow.install = install;

// To auto-install when vue is found
/* global window global */
let GlobalVue!: VueConstructor;
if (typeof window !== "undefined" && typeof (window as any).Vue !== 'undefined') {
  GlobalVue = (window as any).Vue;
} else if (typeof global !== "undefined" && typeof global['Vue'] !== 'undefined') {
  GlobalVue = global['Vue'];
}
if (GlobalVue) {
  GlobalVue.use(NSVueShadow);
}

export default NSVueShadow;
