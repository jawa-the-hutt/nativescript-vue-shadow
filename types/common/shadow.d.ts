import { ShapeEnum } from './shape.enum';
export declare class Shadow {
    static DEFAULT_SHAPE: ShapeEnum;
    static DEFAULT_BGCOLOR: string;
    static DEFAULT_SHADOW_COLOR: string;
    static DEFAULT_PRESSED_ELEVATION: number;
    static DEFAULT_PRESSED_Z: number;
    static apply(tnsView: any, data: {
        elevation: number;
        shape: "RECTANGLE" | "OVAL" | "RING" | "LINE" | undefined;
        pressedTranslationZ: number | string | undefined;
        useShadowPath: boolean | undefined;
        shadowOpacity: number;
        cornerRadius: number | undefined;
        maskToBounds: boolean | undefined;
        pressedElevation: number;
        shadowRadius: number;
        bgcolor: string | undefined;
        forcePressAnimation: boolean | undefined;
        rasterize: boolean | undefined;
        shadowOffset: number;
        translationZ: number | string | undefined;
        shadowColor: string | undefined;
    }): void;
    private static getDefaults;
    private static isShadow;
    private static applyOnAndroid;
    private static overrideDefaultAnimator;
    private static applyOnIOS;
    static androidDipToPx(nativeView: any, dip: number): any;
}
