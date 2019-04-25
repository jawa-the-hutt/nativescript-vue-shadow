// import { Component, Prop } from 'vue-property-decorator';
import Vue from 'nativescript-vue';
import { DirectiveOptions, VNodeDirective, VNode } from 'vue';
import { isAndroid, isIOS } from 'tns-core-modules/platform';

import { AndroidData } from './common/android-data.model';
import { IOSData } from './common/ios-data.model';
import { Shadow } from './common/shadow';
import { Shape, ShapeEnum } from './common/shape.enum';
import { View, Page } from 'tns-core-modules/ui/page/page';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { addWeakEventListener, removeWeakEventListener } from "tns-core-modules/ui/core/weak-event-listener";
declare const android: any;

export interface ShadowValue  {
  shadow: string | AndroidData | IOSData;
  elevation: number | string;
  pressedElevation: number | string;
  shape: Shape;
  bgcolor: string;
  cornerRadius: number | string;
  translationZ: number | string;
  pressedTranslationZ: number | string ;
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


export class NativeShadowDirective {

  private el: any;
  private shadow!: string | AndroidData | IOSData;
  private elevation?: number | string;
  private pressedElevation?: number | string;
  private shape?: Shape;
  private bgcolor?: string;
  private cornerRadius?: number | string;
  private translationZ?: number | string;
  private pressedTranslationZ?: number | string;
  private forcePressAnimation?: boolean;
  private maskToBounds?: boolean;
  private shadowColor?: string;
  private shadowOffset?: number | string;
  private shadowOpacity?: number | string;
  private shadowRadius?: number | string;
  private useShadowPath?: boolean;
  private rasterize?: boolean;

  private loaded = false;
  private initialized = false;
  private originalNSFn: any;
  private previousNSFn: any;
  private iosShadowWrapper!: View;
  private eventsBound = false;

  constructor(el: HTMLElement, binding: ShadowBindings) {
    this.el = el;

    if (binding.value) {
      this.shadow = binding.value.shadow;
      this.elevation = binding.value.elevation;
      this.pressedElevation = binding.value.pressedElevation;
      this.shape= binding.value.shape;
      this.bgcolor = binding.value.bgcolor;
      this.cornerRadius = binding.value.cornerRadius;
      this.translationZ = binding.value.translationZ;
      this.pressedTranslationZ = binding.value.pressedTranslationZ;
      this.forcePressAnimation= binding.value.forcePressAnimation;
      this.maskToBounds = binding.value.maskToBounds;
      this.shadowColor = binding.value.shadowColor;
      this.shadowOffset = binding.value.shadowOffset;
      this.shadowOpacity = binding.value.shadowOpacity;
      this.shadowRadius = binding.value.shadowRadius;
      this.useShadowPath = binding.value.useShadowPath;
      this.rasterize = binding.value.rasterize;
    }

    if (isAndroid) {
      if(this.el._nativeView._redrawNativeBackground) {
        this.originalNSFn = this.el._nativeView._redrawNativeBackground; //always store the original method
      }
    }
  }

  public init() { // RadListView calls this multiple times for the same view
    if (!this.initialized) {
      this.initialized = true;
      this.initializeCommonData();
      if (isAndroid) {
        this.initializeAndroidData();
      } else if (isIOS) {
        this.initializeIOSData();
      }
      if (this.shadow && (this.shadow as AndroidData | IOSData).elevation) {
        if (isAndroid) {
          this.loadFromAndroidData(this.shadow as AndroidData);
        } else if (isIOS) {
          this.loadFromIOSData(this.shadow as IOSData);
        }
      }
      this.bindEvents();
    }
  }

  public destroy() {
    if (this.initialized) {
      this.unload();
      this.unbindEvents();
      this.initialized = false;
    }
  }

  // NS ListViews create elements dynamically
  // loaded and unloaded are called before angular is "ready"
  // https://github.com/NativeScript/nativescript-angular/issues/1221#issuecomment-422813111
  // So we ensure we're running loaded/unloaded events outside of angular
  public bindEvents() {
    if (!this.eventsBound) {
      addWeakEventListener(this.el._nativeView, View.loadedEvent, this.load, this);
      addWeakEventListener(this.el._nativeView, View.unloadedEvent, this.unload, this);
      this.eventsBound = true;
      // in some cases, the element is already loaded by time of binding
      if (this.el._nativeView.isLoaded) {
        this.load();
      }
    }
  }

  public unbindEvents() {
    if (this.eventsBound) {
      removeWeakEventListener(this.el._nativeView, View.loadedEvent, this.load, this);
      removeWeakEventListener(this.el._nativeView, View.unloadedEvent, this.unload, this);
      this.eventsBound = false;
    }
  }

  public load() {
    this.loaded = true;
    // Weirdly ngOnInit isn't called on iOS on demo app
    // Managed to get it working on iOS when applying to
    // FlexboxLayout, but on the demo app, we apply to a
    // Label, and, for that case, ngOnInit isn't called

    // This is just enforcing the Directive is initialized
    // before calling this.applyShadow()
    if (!this.initialized) {
      this.init();
    }
    this.applyShadow();
    if (isAndroid) {
      this.previousNSFn = this.el._nativeView._redrawNativeBackground; // just to maintain compatibility with other patches
      this.el._nativeView._redrawNativeBackground = this.monkeyPatch;
    }
  }

  public addIosWrapper() {
    if (isIOS) {
      const originalElement = this.el._nativeView as View;

      // this.iosShadowWrapper = this.render.createElement(
      //   'StackLayout'
      // ) as StackLayout;

      // // wrappingElement.cssClasses = mainElement.cssClasses;
      // const parent = originalElement.parentNode;
      // this.render.insertBefore(parent, this.iosShadowWrapper, originalElement);
      // this.render.removeChild(parent, originalElement);
      // this.render.appendChild(this.iosShadowWrapper, originalElement);
    }
  }

  public unload() {
    this.loaded = false;

    if (isAndroid) {
      this.el._nativeView._redrawNativeBackground = this.originalNSFn; // always revert to the original method
    }
  }

  public onChanges(changes: any) {
    if (
      this.loaded &&
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
        changes.hasOwnProperty('useShadowMap'))
    ) {
      if (
        changes.hasOwnProperty('shadow') &&
        !changes.hasOwnProperty('elevation') &&
        typeof changes.shadow === 'number'
      ) {
        this.elevation = changes.shadow;
      }
      if (changes.shadow && changes.shadow.elevation) {
        if (isAndroid) {
          this.loadFromAndroidData(this.shadow as AndroidData);
        } else if (isIOS) {
          this.loadFromIOSData(this.shadow as IOSData);
        }
      }
      this.applyShadow();
    }
  }

  private monkeyPatch = (val) => {
    this.previousNSFn.call(this.el._nativeView, val);
    this.applyShadow();
  };

  private applyShadow() {
    if (
      this.shadow === null ||
      this.shadow === undefined ||
      (this.shadow === '' && !this.elevation)
    ) {
      return;
    }

    // For shadows to be shown on Android the SDK has to be greater
    // or equal than 21, lower SDK means no setElevation method is available
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
        elevation: this.elevation as number,
        pressedElevation: this.pressedElevation as number,
        shape: this.shape,
        bgcolor: this.bgcolor,
        cornerRadius: this.cornerRadius,
        translationZ: this.translationZ,
        pressedTranslationZ: this.pressedTranslationZ,
        forcePressAnimation: this.forcePressAnimation,
        maskToBounds: this.maskToBounds,
        shadowColor: this.shadowColor,
        shadowOffset: this.shadowOffset as number,
        shadowOpacity: this.shadowOpacity as number,
        shadowRadius: this.shadowRadius as number,
        rasterize: this.rasterize,
        useShadowPath: this.useShadowPath
      });
    }
  }

  private initializeCommonData() {
    const tShadow = typeof this.shadow;
    if ((tShadow === 'string' || tShadow === 'number') && !this.elevation) {
      this.elevation = this.shadow ? parseInt(this.shadow as string, 10) : 2;
    }
    const tElevation = typeof this.elevation;
    if (tElevation === 'string' || tElevation === 'number') {
      this.elevation = this.elevation
        ? parseInt(this.elevation as string, 10)
        : 2;
    }
  }

  private initializeAndroidData() {
    if (typeof this.cornerRadius === 'string') {
      this.cornerRadius = parseInt(this.cornerRadius, 10);
    }
    if (typeof this.translationZ === 'string') {
      this.translationZ = parseInt(this.translationZ, 10);
    }
  }

  private initializeIOSData() {
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

  private loadFromAndroidData(data: AndroidData) {
    this.elevation = data.elevation || this.elevation;
    this.shape = data.shape || this.shape;
    this.bgcolor = data.bgcolor || this.bgcolor;
    this.cornerRadius = data.cornerRadius || this.cornerRadius;
    this.translationZ = data.translationZ || this.translationZ;
  }

  private loadFromIOSData(data: IOSData) {
    this.maskToBounds = data.maskToBounds || this.maskToBounds;
    this.shadowColor = data.shadowColor || this.shadowColor;
    this.shadowOffset = data.shadowOffset || this.shadowOffset;
    this.shadowOpacity = data.shadowOpacity || this.shadowOpacity;
    this.shadowRadius = data.shadowRadius || this.shadowRadius;
    this.rasterize = data.rasterize || this.rasterize;
    this.useShadowPath = data.useShadowPath || this.useShadowPath;
  }
}

export const ShadowDirective: DirectiveOptions = {

  bind(el, binding, vnode) {
    console.log("v-shadow - bind")
    // console.log("v-shadow - bind - el - ", el);
    // console.log("v-shadow - bind - binding - ", binding);
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);
    shadowDir.init();


  },
  inserted(el, binding, vnode) {
    console.log("v-shadow - inserted")
    // console.log("v-shadow - inserted - el - ", el);
    // console.log("v-shadow - inserted - binding - ", binding);
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);
    shadowDir.addIosWrapper();
  },
  update(el, binding, vnode) {
    console.log("v-shadow - update")
    // console.log("v-shadow - update - el - ", el);
    // console.log("v-shadow - update - binding - ", binding);
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);

  },
  componentUpdated(el, binding, vnode) {
    console.log("v-shadow - componentUpdated")
    // console.log("v-shadow - componentUpdated - el - ", el);
    // console.log("v-shadow - componentUpdated - binding - ", binding);
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);

  },
  unbind(el, binding, vnode) {
    console.log("v-shadow - unbind")
    // console.log("v-shadow - unbind - el - ", el);
    // console.log("v-shadow - unbind - binding - ", binding);
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);
    shadowDir.destroy();

  },
};