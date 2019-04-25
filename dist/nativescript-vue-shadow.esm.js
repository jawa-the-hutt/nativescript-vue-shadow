import { isAndroid, screen, isIOS } from 'tns-core-modules/platform';
import { Color } from 'tns-core-modules/color';
import { Length, View } from 'tns-core-modules/ui/page/page';

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

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var weakEventListener = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var handlersForEventName = new Map();
var sourcesMap = new WeakMap();
var TargetHandlerPair = (function () {
    function TargetHandlerPair(target, handler) {
        this.tagetRef = new WeakRef(target);
        this.handler = handler;
    }
    return TargetHandlerPair;
}());
function getHandlerForEventName(eventName) {
    var handler = handlersForEventName.get(eventName);
    if (!handler) {
        handler = function (eventData) {
            var source = eventData.object;
            var sourceEventMap = sourcesMap.get(source);
            if (!sourceEventMap) {
                source.removeEventListener(eventName, handlersForEventName.get(eventName));
                return;
            }
            var targetHandlerPairList = sourceEventMap.get(eventName);
            if (!targetHandlerPairList) {
                return;
            }
            var deadPairsIndexes = [];
            for (var i = 0; i < targetHandlerPairList.length; i++) {
                var pair = targetHandlerPairList[i];
                var target = pair.tagetRef.get();
                if (target) {
                    pair.handler.call(target, eventData);
                }
                else {
                    deadPairsIndexes.push(i);
                }
            }
            if (deadPairsIndexes.length === targetHandlerPairList.length) {
                source.removeEventListener(eventName, handlersForEventName.get(eventName));
                sourceEventMap.delete(eventName);
            }
            else {
                for (var j = deadPairsIndexes.length - 1; j >= 0; j--) {
                    targetHandlerPairList.splice(deadPairsIndexes[j], 1);
                }
            }
        };
        handlersForEventName.set(eventName, handler);
    }
    return handler;
}
function validateArgs(source, eventName, handler, target) {
    if (!source) {
        throw new Error("source is null or undefined");
    }
    if (!target) {
        throw new Error("target is null or undefined");
    }
    if (typeof eventName !== "string") {
        throw new Error("eventName is not a string");
    }
    if (typeof handler !== "function") {
        throw new Error("handler is not a function");
    }
}
function addWeakEventListener(source, eventName, handler, target) {
    validateArgs(source, eventName, handler, target);
    var shouldAttach = false;
    var sourceEventMap = sourcesMap.get(source);
    if (!sourceEventMap) {
        sourceEventMap = new Map();
        sourcesMap.set(source, sourceEventMap);
        shouldAttach = true;
    }
    var pairList = sourceEventMap.get(eventName);
    if (!pairList) {
        pairList = new Array();
        sourceEventMap.set(eventName, pairList);
        shouldAttach = true;
    }
    pairList.push(new TargetHandlerPair(target, handler));
    if (shouldAttach) {
        source.addEventListener(eventName, getHandlerForEventName(eventName));
    }
}
exports.addWeakEventListener = addWeakEventListener;
function removeWeakEventListener(source, eventName, handler, target) {
    validateArgs(source, eventName, handler, target);
    var handlerForEventWithName = handlersForEventName.get(eventName);
    if (!handlerForEventWithName) {
        return;
    }
    var sourceEventMap = sourcesMap.get(source);
    if (!sourceEventMap) {
        return;
    }
    var targetHandlerPairList = sourceEventMap.get(eventName);
    if (!targetHandlerPairList) {
        return;
    }
    var targetHandlerPairsToRemove = [];
    for (var i = 0; i < targetHandlerPairList.length; i++) {
        var pair = targetHandlerPairList[i];
        var registeredTarget = pair.tagetRef.get();
        if (!registeredTarget || (registeredTarget === target && handler === pair.handler)) {
            targetHandlerPairsToRemove.push(i);
        }
    }
    if (targetHandlerPairsToRemove.length === targetHandlerPairList.length) {
        source.removeEventListener(eventName, handlerForEventWithName);
        sourceEventMap.delete(eventName);
    }
    else {
        for (var j = targetHandlerPairsToRemove.length - 1; j >= 0; j--) {
            targetHandlerPairList.splice(targetHandlerPairsToRemove[j], 1);
        }
    }
}
exports.removeWeakEventListener = removeWeakEventListener;

});

unwrapExports(weakEventListener);
var weakEventListener_1 = weakEventListener.addWeakEventListener;
var weakEventListener_2 = weakEventListener.removeWeakEventListener;

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
        if (binding.value) {
            this.shadow = binding.value.shadow;
            this.elevation = binding.value.elevation;
            this.pressedElevation = binding.value.pressedElevation;
            this.shape = binding.value.shape;
            this.bgcolor = binding.value.bgcolor;
            this.cornerRadius = binding.value.cornerRadius;
            this.translationZ = binding.value.translationZ;
            this.pressedTranslationZ = binding.value.pressedTranslationZ;
            this.forcePressAnimation = binding.value.forcePressAnimation;
            this.maskToBounds = binding.value.maskToBounds;
            this.shadowColor = binding.value.shadowColor;
            this.shadowOffset = binding.value.shadowOffset;
            this.shadowOpacity = binding.value.shadowOpacity;
            this.shadowRadius = binding.value.shadowRadius;
            this.useShadowPath = binding.value.useShadowPath;
            this.rasterize = binding.value.rasterize;
        }
        if (isAndroid) {
            if (this.el._nativeView._redrawNativeBackground) {
                this.originalNSFn = this.el._nativeView._redrawNativeBackground;
            }
        }
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
            this.bindEvents();
        }
    }
    destroy() {
        if (this.initialized) {
            this.unload();
            this.unbindEvents();
            this.initialized = false;
        }
    }
    bindEvents() {
        if (!this.eventsBound) {
            weakEventListener_1(this.el._nativeView, View.loadedEvent, this.load, this);
            weakEventListener_1(this.el._nativeView, View.unloadedEvent, this.unload, this);
            this.eventsBound = true;
            if (this.el._nativeView.isLoaded) {
                this.load();
            }
        }
    }
    unbindEvents() {
        if (this.eventsBound) {
            weakEventListener_2(this.el._nativeView, View.loadedEvent, this.load, this);
            weakEventListener_2(this.el._nativeView, View.unloadedEvent, this.unload, this);
            this.eventsBound = false;
        }
    }
    load() {
        this.loaded = true;
        if (!this.initialized) {
            this.init();
        }
        this.applyShadow();
        if (isAndroid) {
            this.previousNSFn = this.el._nativeView._redrawNativeBackground;
            this.el._nativeView._redrawNativeBackground = this.monkeyPatch;
        }
    }
    addIosWrapper() {
        if (isIOS) {
            const originalElement = this.el._nativeView;
        }
    }
    unload() {
        this.loaded = false;
        if (isAndroid) {
            this.el._nativeView._redrawNativeBackground = this.originalNSFn;
        }
    }
    onChanges(changes) {
        if (this.loaded &&
            !!changes &&
            (changes.hasOwnProperty('shadow') ||
                changes.hasOwnProperty('elevation') ||
                changes.hasOwnProperty('pressedElevation') ||
                changes.hasOwnProperty('shape') ||
                changes.hasOwnProperty('bgcolor') ||
                changes.hasOwnProperty('cornerRadius') ||
                changes.hasOwnProperty('pressedTranslationZ') ||
                changes.hasOwnProperty('forcePressAnimation') ||
                changes.hasOwnProperty('translationZ') ||
                changes.hasOwnProperty('maskToBounds') ||
                changes.hasOwnProperty('shadowColor') ||
                changes.hasOwnProperty('shadowOffset') ||
                changes.hasOwnProperty('shadowOpacity') ||
                changes.hasOwnProperty('shadowRadius') ||
                changes.hasOwnProperty('rasterize') ||
                changes.hasOwnProperty('useShadowMap'))) {
            if (changes.hasOwnProperty('shadow') &&
                !changes.hasOwnProperty('elevation') &&
                typeof changes.shadow === 'number') {
                this.elevation = changes.shadow;
            }
            if (changes.shadow && changes.shadow.elevation) {
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
    applyShadow() {
        if (this.shadow === null ||
            this.shadow === undefined ||
            (this.shadow === '' && !this.elevation)) {
            return;
        }
        if (isAndroid) {
            if (android.os.Build.VERSION.SDK_INT < 21) {
                return;
            }
        }
        const viewToApplyShadowTo = isIOS
            ? this.iosShadowWrapper
            : this.el._nativeView;
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
    initializeCommonData() {
        const tShadow = typeof this.shadow;
        if ((tShadow === 'string' || tShadow === 'number') && !this.elevation) {
            this.elevation = this.shadow ? parseInt(this.shadow, 10) : 2;
        }
        const tElevation = typeof this.elevation;
        if (tElevation === 'string' || tElevation === 'number') {
            this.elevation = this.elevation
                ? parseInt(this.elevation, 10)
                : 2;
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
    loadFromAndroidData(data) {
        this.elevation = data.elevation || this.elevation;
        this.shape = data.shape || this.shape;
        this.bgcolor = data.bgcolor || this.bgcolor;
        this.cornerRadius = data.cornerRadius || this.cornerRadius;
        this.translationZ = data.translationZ || this.translationZ;
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
}
const ShadowDirective = {
    bind(el, binding, vnode) {
        console.log("v-shadow - bind");
        const shadowDir = new NativeShadowDirective(el, binding);
        shadowDir.init();
    },
    inserted(el, binding, vnode) {
        console.log("v-shadow - inserted");
        const shadowDir = new NativeShadowDirective(el, binding);
        shadowDir.addIosWrapper();
    },
    update(el, binding, vnode) {
        console.log("v-shadow - update");
        const shadowDir = new NativeShadowDirective(el, binding);
    },
    componentUpdated(el, binding, vnode) {
        console.log("v-shadow - componentUpdated");
        const shadowDir = new NativeShadowDirective(el, binding);
    },
    unbind(el, binding, vnode) {
        console.log("v-shadow - unbind");
        const shadowDir = new NativeShadowDirective(el, binding);
        shadowDir.destroy();
    },
};

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
export { install };
