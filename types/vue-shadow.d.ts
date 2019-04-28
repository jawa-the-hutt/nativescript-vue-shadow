import { DirectiveOptions, VNodeDirective } from 'vue';
import { AndroidData } from './common/android-data.model';
import { IOSData } from './common/ios-data.model';
import { Shape } from './common/shape.enum';
export interface ShadowValue {
    shadow?: string | AndroidData | IOSData;
    elevation?: number | string;
    pressedElevation?: number | string;
    shape?: Shape;
    bgcolor?: string;
    cornerRadius?: number | string;
    translationZ?: number | string;
    pressedTranslationZ?: number | string;
    forcePressAnimation?: boolean;
    maskToBounds?: boolean;
    shadowColor?: string;
    shadowOffset?: number | string;
    shadowOpacity?: number | string;
    shadowRadius?: number | string;
    useShadowPath?: boolean;
    rasterize?: boolean;
}
export interface ShadowBindings extends VNodeDirective {
    value?: ShadowValue;
}
export declare class NativeShadowDirective {
    private el;
    private shadow?;
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
    onUpdate(values: ShadowValue): void;
    destroy(): void;
}
export declare const ShadowDirective: DirectiveOptions;
