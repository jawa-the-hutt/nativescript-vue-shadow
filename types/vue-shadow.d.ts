import { DirectiveOptions, VNodeDirective } from 'vue';
import { AndroidData } from './common/android-data.model';
import { IOSData } from './common/ios-data.model';
import { Shape } from './common/shape.enum';
export interface ShadowValue {
    shadow: string | AndroidData | IOSData;
    elevation: number | string;
    pressedElevation: number | string;
    shape: Shape;
    bgcolor: string;
    cornerRadius: number | string;
    translationZ: number | string;
    pressedTranslationZ: number | string;
    forcePressAnimation: boolean;
    maskToBounds: boolean;
    shadowColor: string;
    shadowOffset: number | string;
    shadowOpacity: number | string;
    shadowRadius: number | string;
    useShadowPath: boolean;
    rasterize: boolean;
}
export interface ShadowBindings extends VNodeDirective {
    value?: ShadowValue;
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
    private useShadowPath?;
    private rasterize?;
    private loaded;
    private initialized;
    private originalNSFn;
    private previousNSFn;
    private iosShadowWrapper;
    private eventsBound;
    constructor(el: HTMLElement, binding: ShadowBindings);
    init(): void;
    destroy(): void;
    bindEvents(): void;
    unbindEvents(): void;
    load(): void;
    addIosWrapper(): void;
    unload(): void;
    onChanges(changes: any): void;
    private monkeyPatch;
    private applyShadow;
    private initializeCommonData;
    private initializeAndroidData;
    private initializeIOSData;
    private loadFromAndroidData;
    private loadFromIOSData;
}
export declare const ShadowDirective: DirectiveOptions;
