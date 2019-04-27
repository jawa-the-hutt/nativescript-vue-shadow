import { VueConstructor, PluginFunction } from 'vue';
export declare function install(Vue: VueConstructor): void;
declare class NSVueShadow {
    static install: PluginFunction<never>;
}
export declare namespace install {
    let installed: boolean;
}
export * from './common';
export default NSVueShadow;
