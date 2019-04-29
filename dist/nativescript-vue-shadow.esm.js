import Vue from 'nativescript-vue';
import { isAndroid, screen, isIOS } from 'tns-core-modules/platform';
import { Color } from 'tns-core-modules/color';
import { Length, View } from 'tns-core-modules/ui/page/page';
import { addWeakEventListener, removeWeakEventListener } from 'tns-core-modules/ui/core/weak-event-listener';

var ShapeEnum;
(function (ShapeEnum) {
    ShapeEnum["RECTANGLE"] = "RECTANGLE";
    ShapeEnum["OVAL"] = "OVAL";
    ShapeEnum["RING"] = "RING";
    ShapeEnum["LINE"] = "LINE";
})(ShapeEnum || (ShapeEnum = {}));

let LayeredShadow;
let PlainShadow;
if (isAndroid) {
    LayeredShadow = android.graphics.drawable.LayerDrawable.extend({});
    PlainShadow = android.graphics.drawable.GradientDrawable.extend({});
}
const classCache = {};
function getAndroidR(rtype, field) {
    const className = "android.R$" + rtype;
    if (!classCache.hasOwnProperty(className)) {
        classCache[className] = {
            class: java.lang.Class.forName(className),
            fieldCache: {}
        };
    }
    if (!classCache[className].fieldCache.hasOwnProperty(field)) {
        classCache[className].fieldCache[field] = +classCache[className].class.getField(field).get(null);
    }
    return classCache[className].fieldCache[field];
}
class Shadow {
    static apply(tnsView, data) {
        const LOLLIPOP = 21;
        if (tnsView.android &&
            android.os.Build.VERSION.SDK_INT >= LOLLIPOP) {
            Shadow.applyOnAndroid(tnsView, Shadow.getDefaults(data));
        }
        else if (tnsView.ios) {
            Shadow.applyOnIOS(tnsView, Shadow.getDefaults(data));
        }
    }
    static getDefaults(data) {
        return Object.assign({}, data, {
            shape: data.shape || Shadow.DEFAULT_SHAPE,
            pressedElevation: data.pressedElevation || Shadow.DEFAULT_PRESSED_ELEVATION,
            pressedTranslationZ: data.pressedTranslationZ || Shadow.DEFAULT_PRESSED_ELEVATION,
            shadowColor: data.shadowColor ||
                Shadow.DEFAULT_SHADOW_COLOR,
            useShadowPath: (data.useShadowPath !== undefined ? data.useShadowPath : true),
            rasterize: (data.rasterize !== undefined ? data.rasterize : false)
        });
    }
    static isShadow(drawable) {
        return (drawable instanceof LayeredShadow || drawable instanceof PlainShadow);
    }
    static applyOnAndroid(tnsView, data) {
        const nativeView = tnsView.android;
        let shape;
        let overrideBackground = true;
        let currentBg = nativeView.getBackground();
        if (currentBg instanceof android.graphics.drawable.RippleDrawable) {
            let rippleBg = currentBg.getDrawable(0);
            if (rippleBg instanceof android.graphics.drawable.InsetDrawable) {
                overrideBackground = false;
            }
            else if (Shadow.isShadow(rippleBg)) {
                currentBg = rippleBg;
            }
        }
        if (overrideBackground) {
            if (Shadow.isShadow(currentBg)) {
                currentBg = currentBg instanceof LayeredShadow ?
                    currentBg.getDrawable(1) : null;
            }
            const outerRadii = Array.create("float", 8);
            if (data.cornerRadius === undefined) {
                outerRadii[0] = outerRadii[1] = Length.toDevicePixels(tnsView.borderTopLeftRadius, 0);
                outerRadii[2] = outerRadii[3] = Length.toDevicePixels(tnsView.borderTopRightRadius, 0);
                outerRadii[4] = outerRadii[5] = Length.toDevicePixels(tnsView.borderBottomRightRadius, 0);
                outerRadii[6] = outerRadii[7] = Length.toDevicePixels(tnsView.borderBottomLeftRadius, 0);
            }
            else {
                java.util.Arrays.fill(outerRadii, Shadow.androidDipToPx(nativeView, data.cornerRadius));
            }
            const bgColor = currentBg ?
                (currentBg instanceof android.graphics.drawable.ColorDrawable && currentBg.getColor() ?
                    currentBg.getColor() : android.graphics.Color.parseColor(data.bgcolor || Shadow.DEFAULT_BGCOLOR)) :
                android.graphics.Color.parseColor(data.bgcolor || Shadow.DEFAULT_BGCOLOR);
            let newBg;
            if (data.shape !== ShapeEnum.RECTANGLE || data.bgcolor || !currentBg) {
                shape = new PlainShadow();
                shape.setShape(android.graphics.drawable.GradientDrawable[data.shape]);
                shape.setCornerRadii(outerRadii);
                shape.setColor(bgColor);
                newBg = shape;
            }
            else {
                const r = new android.graphics.drawable.shapes.RoundRectShape(outerRadii, null, null);
                shape = new android.graphics.drawable.ShapeDrawable(r);
                shape.getPaint().setColor(bgColor);
                var arr = Array.create(android.graphics.drawable.Drawable, 2);
                arr[0] = shape;
                arr[1] = currentBg;
                const drawable = new LayeredShadow(arr);
                newBg = drawable;
            }
            nativeView.setBackgroundDrawable(newBg);
        }
        nativeView.setElevation(Shadow.androidDipToPx(nativeView, data.elevation));
        nativeView.setTranslationZ(Shadow.androidDipToPx(nativeView, data.translationZ));
        if (nativeView.getStateListAnimator() || data.forcePressAnimation) {
            this.overrideDefaultAnimator(nativeView, data);
        }
    }
    static overrideDefaultAnimator(nativeView, data) {
        const sla = new android.animation.StateListAnimator();
        const ObjectAnimator = android.animation.ObjectAnimator;
        const AnimatorSet = android.animation.AnimatorSet;
        const shortAnimTime = getAndroidR("integer", "config_shortAnimTime");
        const buttonDuration = nativeView.getContext().getResources().getInteger(shortAnimTime) / 2;
        const pressedElevation = this.androidDipToPx(nativeView, data.pressedElevation);
        const pressedZ = this.androidDipToPx(nativeView, data.pressedTranslationZ);
        const elevation = this.androidDipToPx(nativeView, data.elevation);
        const z = this.androidDipToPx(nativeView, data.translationZ || 0);
        const pressedSet = new AnimatorSet();
        const notPressedSet = new AnimatorSet();
        const defaultSet = new AnimatorSet();
        pressedSet.playTogether(java.util.Arrays.asList([
            ObjectAnimator.ofFloat(nativeView, "translationZ", [pressedZ])
                .setDuration(buttonDuration),
            ObjectAnimator.ofFloat(nativeView, "elevation", [pressedElevation])
                .setDuration(0),
        ]));
        notPressedSet.playTogether(java.util.Arrays.asList([
            ObjectAnimator.ofFloat(nativeView, "translationZ", [z])
                .setDuration(buttonDuration),
            ObjectAnimator.ofFloat(nativeView, "elevation", [elevation])
                .setDuration(0),
        ]));
        defaultSet.playTogether(java.util.Arrays.asList([
            ObjectAnimator.ofFloat(nativeView, "translationZ", [0]).setDuration(0),
            ObjectAnimator.ofFloat(nativeView, "elevation", [0]).setDuration(0),
        ]));
        sla.addState([getAndroidR("attr", "state_pressed"), getAndroidR("attr", "state_enabled")], pressedSet);
        sla.addState([getAndroidR("attr", "state_enabled")], notPressedSet);
        sla.addState([], defaultSet);
        nativeView.setStateListAnimator(sla);
    }
    static applyOnIOS(tnsView, data) {
        const nativeView = tnsView.ios;
        const elevation = parseFloat((data.elevation - 0).toFixed(2));
        nativeView.layer.maskToBounds = false;
        nativeView.layer.shadowColor = new Color(data.shadowColor).ios.CGColor;
        nativeView.layer.shadowOffset =
            data.shadowOffset ?
                CGSizeMake(0, parseFloat(String(data.shadowOffset))) :
                CGSizeMake(0, 0.54 * elevation - 0.14);
        nativeView.layer.shadowOpacity =
            data.shadowOpacity ?
                parseFloat(String(data.shadowOpacity)) :
                0.006 * elevation + 0.25;
        nativeView.layer.shadowRadius =
            data.shadowRadius ?
                parseFloat(String(data.shadowRadius)) :
                0.66 * elevation - 0.5;
        nativeView.layer.shouldRasterize = data.rasterize;
        nativeView.layer.rasterizationScale = screen.mainScreen.scale;
        let shadowPath = null;
        if (data.useShadowPath) {
            shadowPath = UIBezierPath.bezierPathWithRoundedRectCornerRadius(nativeView.bounds, nativeView.layer.shadowRadius).cgPath;
        }
        nativeView.layer.shadowPath = shadowPath;
    }
    static androidDipToPx(nativeView, dip) {
        const metrics = nativeView.getContext().getResources().getDisplayMetrics();
        return android.util.TypedValue.applyDimension(android.util.TypedValue.COMPLEX_UNIT_DIP, dip, metrics);
    }
}
Shadow.DEFAULT_SHAPE = ShapeEnum.RECTANGLE;
Shadow.DEFAULT_BGCOLOR = '#FFFFFF';
Shadow.DEFAULT_SHADOW_COLOR = '#000000';
Shadow.DEFAULT_PRESSED_ELEVATION = 2;
Shadow.DEFAULT_PRESSED_Z = 4;

class NativeShadowDirective {
    constructor(el, binding) {
        this.loaded = false;
        this.initialized = false;
        this.eventsBound = false;
        this.monkeyPatch = (val) => {
            this.previousNSFn.call(this.el._nativeView, val);
            this.applyShadow();
        };
        this.el = el;
        if (binding.value && typeof binding.value !== 'object' && (typeof binding.value === 'string' || typeof binding.value === 'number')) {
            this.shadow = binding.value;
            this.elevation = binding.value;
        }
        if (binding.value && typeof binding.value === 'object' && binding.value.elevation) {
            this.shadow = binding.value;
            this.elevation = this.shadow.elevation;
            if (isAndroid && (('pressedElevation' in this.shadow) ||
                ('shape' in this.shadow) ||
                ('bgcolor' in this.shadow) ||
                ('cornerRadius' in this.shadow) ||
                ('translationZ' in this.shadow) ||
                ('pressedTranslationZ' in this.shadow) ||
                ('forcePressAnimation' in this.shadow))) {
                this.pressedElevation = this.shadow.pressedElevation;
                this.shape = this.shadow.shape;
                this.bgcolor = this.shadow.bgcolor;
                this.cornerRadius = this.shadow.cornerRadius;
                this.translationZ = this.shadow.translationZ;
                this.pressedTranslationZ = this.shadow.pressedTranslationZ;
                this.forcePressAnimation = this.shadow.forcePressAnimation;
            }
            else if (isIOS && (('maskToBounds' in this.shadow) ||
                ('shadowColor' in this.shadow) ||
                ('shadowOffset' in this.shadow) ||
                ('shadowOpacity' in this.shadow) ||
                ('shadowRadius' in this.shadow) ||
                ('useShadowPath' in this.shadow) ||
                ('rasterize' in this.shadow))) {
                this.maskToBounds = this.shadow.maskToBounds;
                this.shadowColor = this.shadow.shadowColor;
                this.shadowOffset = this.shadow.shadowOffset;
                this.shadowOpacity = this.shadow.shadowOpacity;
                this.shadowRadius = this.shadow.shadowRadius;
                this.useShadowPath = this.shadow.useShadowPath;
                this.rasterize = this.shadow.rasterize;
            }
        }
        if (isAndroid) {
            if (this.el._nativeView._redrawNativeBackground) {
                this.originalNSFn = this.el._nativeView._redrawNativeBackground;
            }
        }
    }
    initializeCommonData() {
        const tShadow = typeof this.shadow;
        if ((tShadow === 'string' || tShadow === 'number') && !this.elevation) {
            this.elevation = this.shadow ? parseInt(this.shadow, 10) : 2;
        }
        const tElevation = typeof this.elevation;
        if (tElevation === 'string' || tElevation === 'number') {
            this.elevation = this.elevation ? parseInt(this.elevation, 10) : 2;
        }
    }
    initializeAndroidData() {
        if (typeof this.cornerRadius === 'string') {
            this.cornerRadius = parseInt(this.cornerRadius, 10);
        }
        if (typeof this.translationZ === 'string') {
            this.translationZ = parseInt(this.translationZ, 10);
        }
    }
    initializeIOSData() {
        if (typeof this.shadowOffset === 'string') {
            this.shadowOffset = parseFloat(this.shadowOffset);
        }
        if (typeof this.shadowOpacity === 'string') {
            this.shadowOpacity = parseFloat(this.shadowOpacity);
        }
        if (typeof this.shadowRadius === 'string') {
            this.shadowRadius = parseFloat(this.shadowRadius);
        }
    }
    bindEvents() {
        if (!this.eventsBound) {
            addWeakEventListener(this.el._nativeView, View.loadedEvent, this.load, this);
            addWeakEventListener(this.el._nativeView, View.unloadedEvent, this.unload, this);
            this.eventsBound = true;
            if (this.el._nativeView.isLoaded) {
                this.load();
            }
        }
    }
    unbindEvents() {
        if (this.eventsBound) {
            removeWeakEventListener(this.el._nativeView, View.loadedEvent, this.load, this);
            removeWeakEventListener(this.el._nativeView, View.unloadedEvent, this.unload, this);
            this.eventsBound = false;
        }
    }
    load() {
        this.loaded = true;
        this.applyShadow();
        if (isAndroid) {
            this.previousNSFn = this.el._nativeView._redrawNativeBackground;
            this.el._nativeView._redrawNativeBackground = this.monkeyPatch;
        }
    }
    unload() {
        this.loaded = false;
        if (isAndroid) {
            this.el._nativeView._redrawNativeBackground = this.originalNSFn;
        }
    }
    applyShadow() {
        if (!this.shadow && !this.elevation) {
            return;
        }
        if (isAndroid) {
            if (android.os.Build.VERSION.SDK_INT < 21) {
                return;
            }
        }
        const viewToApplyShadowTo = isIOS ? this.iosShadowWrapper : this.el._nativeView;
        if (viewToApplyShadowTo) {
            Shadow.apply(viewToApplyShadowTo, {
                elevation: this.elevation,
                pressedElevation: this.pressedElevation,
                shape: this.shape,
                bgcolor: this.bgcolor,
                cornerRadius: this.cornerRadius,
                translationZ: this.translationZ,
                pressedTranslationZ: this.pressedTranslationZ,
                forcePressAnimation: this.forcePressAnimation,
                maskToBounds: this.maskToBounds,
                shadowColor: this.shadowColor,
                shadowOffset: this.shadowOffset,
                shadowOpacity: this.shadowOpacity,
                shadowRadius: this.shadowRadius,
                rasterize: this.rasterize,
                useShadowPath: this.useShadowPath
            });
        }
    }
    loadFromAndroidData(data) {
        this.elevation = data.elevation || this.elevation;
        this.shape = data.shape || this.shape;
        this.bgcolor = data.bgcolor || this.bgcolor;
        this.cornerRadius = data.cornerRadius || this.cornerRadius;
        this.translationZ = data.translationZ || this.translationZ;
        this.pressedTranslationZ = data.pressedTranslationZ || this.pressedTranslationZ;
        this.forcePressAnimation = data.forcePressAnimation || this.forcePressAnimation;
    }
    loadFromIOSData(data) {
        this.maskToBounds = data.maskToBounds || this.maskToBounds;
        this.shadowColor = data.shadowColor || this.shadowColor;
        this.shadowOffset = data.shadowOffset || this.shadowOffset;
        this.shadowOpacity = data.shadowOpacity || this.shadowOpacity;
        this.shadowRadius = data.shadowRadius || this.shadowRadius;
        this.rasterize = data.rasterize || this.rasterize;
        this.useShadowPath = data.useShadowPath || this.useShadowPath;
    }
    init() {
        if (!this.initialized) {
            this.initialized = true;
            this.initializeCommonData();
            if (isAndroid) {
                this.initializeAndroidData();
            }
            else if (isIOS) {
                this.initializeIOSData();
            }
            if (this.shadow && this.shadow.elevation) {
                if (isAndroid) {
                    this.loadFromAndroidData(this.shadow);
                }
                else if (isIOS) {
                    this.loadFromIOSData(this.shadow);
                }
            }
            if (!this.shadow && this.elevation) {
                if (isAndroid) {
                    this.loadFromAndroidData({
                        elevation: this.elevation,
                        pressedElevation: this.pressedElevation,
                        shape: this.shape,
                        bgcolor: this.bgcolor,
                        cornerRadius: this.cornerRadius,
                        translationZ: this.translationZ,
                        pressedTranslationZ: this.pressedTranslationZ,
                        forcePressAnimation: this.forcePressAnimation,
                    });
                }
                else if (isIOS) {
                    this.loadFromIOSData({
                        elevation: this.elevation,
                        maskToBounds: this.maskToBounds,
                        shadowColor: this.shadowColor,
                        shadowOffset: this.shadowOffset,
                        shadowOpacity: this.shadowOpacity,
                        shadowRadius: this.shadowRadius,
                        rasterize: this.rasterize,
                        useShadowPath: this.useShadowPath
                    });
                }
            }
            this.bindEvents();
        }
    }
    addIOSWrapper() {
        if (isIOS) {
            const originalElement = this.el;
            const parent = originalElement.parentNode;
            const vm = new Vue({
                template: '<StackLayout></StackLayout>',
            }).$mount();
            const wrapper = vm.$el;
            parent.insertBefore(wrapper, originalElement);
            parent.removeChild(originalElement);
            wrapper.appendChild(originalElement);
            this.iosShadowWrapper = wrapper._nativeView;
        }
    }
    onUpdate(values) {
        if (this.loaded && !!values) {
            if (typeof values !== 'object' && (typeof values === 'string' || typeof values === 'number')) {
                this.shadow = values;
                this.elevation = values;
            }
            if (typeof values === 'object' && values.elevation) {
                this.shadow = values;
                this.elevation = this.shadow.elevation;
                if (isAndroid) {
                    this.loadFromAndroidData(this.shadow);
                }
                else if (isIOS) {
                    this.loadFromIOSData(this.shadow);
                }
            }
            this.applyShadow();
        }
    }
    destroy() {
        if (this.initialized) {
            this.unload();
            this.unbindEvents();
            this.initialized = false;
        }
    }
}
const ShadowDirective = {
    bind(el, binding, vnode) {
        const shadowDir = new NativeShadowDirective(el, binding);
        shadowDir.init();
        el.__vShadow = shadowDir;
    },
    inserted(el, binding, vnode) {
        const shadowDir = el.__vShadow;
        shadowDir.addIOSWrapper();
    },
    update(el, { value }, vnode) {
        const shadowDir = el.__vShadow;
        shadowDir.onUpdate(value);
    },
    unbind(el, binding, vnode) {
        const shadowDir = el.__vShadow;
        shadowDir.destroy();
        el.__vShadow = null;
    },
};

var Elevation;
(function (Elevation) {
    Elevation[Elevation["SWITCH"] = 1] = "SWITCH";
    Elevation[Elevation["CARD_RESTING"] = 2] = "CARD_RESTING";
    Elevation[Elevation["RAISED_BUTTON_RESTING"] = 2] = "RAISED_BUTTON_RESTING";
    Elevation[Elevation["SEARCH_BAR_RESTING"] = 2] = "SEARCH_BAR_RESTING";
    Elevation[Elevation["REFRESH_INDICADOR"] = 3] = "REFRESH_INDICADOR";
    Elevation[Elevation["SEARCH_BAR_SCROLLED"] = 3] = "SEARCH_BAR_SCROLLED";
    Elevation[Elevation["APPBAR"] = 4] = "APPBAR";
    Elevation[Elevation["FAB_RESTING"] = 6] = "FAB_RESTING";
    Elevation[Elevation["SNACKBAR"] = 6] = "SNACKBAR";
    Elevation[Elevation["BOTTOM_NAVIGATION_BAR"] = 8] = "BOTTOM_NAVIGATION_BAR";
    Elevation[Elevation["MENU"] = 8] = "MENU";
    Elevation[Elevation["CARD_PICKED_UP"] = 8] = "CARD_PICKED_UP";
    Elevation[Elevation["RAISED_BUTTON_PRESSED"] = 8] = "RAISED_BUTTON_PRESSED";
    Elevation[Elevation["SUBMENU_LEVEL1"] = 9] = "SUBMENU_LEVEL1";
    Elevation[Elevation["SUBMENU_LEVEL2"] = 10] = "SUBMENU_LEVEL2";
    Elevation[Elevation["SUBMENU_LEVEL3"] = 11] = "SUBMENU_LEVEL3";
    Elevation[Elevation["SUBMENU_LEVEL4"] = 12] = "SUBMENU_LEVEL4";
    Elevation[Elevation["SUBMENU_LEVEL5"] = 13] = "SUBMENU_LEVEL5";
    Elevation[Elevation["FAB_PRESSED"] = 12] = "FAB_PRESSED";
    Elevation[Elevation["NAV_DRAWER"] = 16] = "NAV_DRAWER";
    Elevation[Elevation["RIGHT_DRAWER"] = 16] = "RIGHT_DRAWER";
    Elevation[Elevation["MODAL_BOTTOM_SHEET"] = 16] = "MODAL_BOTTOM_SHEET";
    Elevation[Elevation["DIALOG"] = 24] = "DIALOG";
    Elevation[Elevation["PICKER"] = 24] = "PICKER";
})(Elevation || (Elevation = {}));

function install(Vue) {
    if (install.installed) {
        console.log('not installed');
        return;
    }
    else {
        install.installed = true;
        Vue.directive('shadow', ShadowDirective);
    }
}
class NSVueShadow {
}
(function (install) {
})(install || (install = {}));
NSVueShadow.install = install;
let GlobalVue;
if (typeof window !== "undefined" && typeof window.Vue !== 'undefined') {
    GlobalVue = window.Vue;
}
else if (typeof global !== "undefined" && typeof global['Vue'] !== 'undefined') {
    GlobalVue = global['Vue'];
}
if (GlobalVue) {
    GlobalVue.use(NSVueShadow);
}

export default NSVueShadow;
export { Elevation, Shadow, ShapeEnum, install };
