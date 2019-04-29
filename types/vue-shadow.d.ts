import { DirectiveOptions, VNodeDirective } from 'vue';
import { AndroidData } from './common/android-data.model';
import { IOSData } from './common/ios-data.model';
export interface ShadowBindings extends VNodeDirective {
    value?: string | number | AndroidData | IOSData;
}
export declare class NativeShadowDirective {
    private el;
    private shadow;
    private elevation?;
    private pressedElevation?;
    private shape?;
    private bgcolor?;
    private cornerRadius?;
    private translationZ?;
    private pressedTranslationZ?;
    private forcePressAnimation?;
    private maskToBounds?;
    private shadowColor?;
    private shadowOffset?;
    private shadowOpacity?;
    private shadowRadius?;
    private rasterize?;
    private useShadowPath?;
    private loaded;
    private initialized;
    private originalNSFn;
    private previousNSFn;
    private iosShadowWrapper;
    private eventsBound;
    constructor(el: HTMLElement, binding: ShadowBindings);
    private initializeCommonData;
    private initializeAndroidData;
    private initializeIOSData;
    private bindEvents;
    private unbindEvents;
    private load;
    private unload;
    private monkeyPatch;
    private applyShadow;
    private loadFromAndroidData;
    private loadFromIOSData;
    init(): void;
    addIOSWrapper(): void;
    onUpdate(values: string | number | AndroidData | IOSData): void;
    destroy(): void;
}
export declare const ShadowDirective: DirectiveOptions;
