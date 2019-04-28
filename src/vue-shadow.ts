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
  shadow?: string | AndroidData | IOSData;
  elevation?: number | string;
  pressedElevation?: number | string;
  shape?: Shape;
  bgcolor?: string;
  cornerRadius?: number | string;
  translationZ?: number | string;
  pressedTranslationZ?: number | string ;
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

// const isAndroidData = (x: any): x is AndroidData => fruit.includes(x);
// const isIOSData = (x: any): x is IOSData => fruit.includes(x);

export class NativeShadowDirective {

  private el: any;
  private shadow?: string | AndroidData | IOSData;
  private elevation?: number | string;

// with this.elevation the following make up AndroidData object
  private pressedElevation?: number | string;
  private shape?: Shape;
  private bgcolor?: string;
  private cornerRadius?: number | string;
  private translationZ?: number | string;
  private pressedTranslationZ?: number | string;
  private forcePressAnimation?: boolean;

  // with this.elevation the following make up IOSData object
  private maskToBounds?: boolean;
  private shadowColor?: string;
  private shadowOffset?: number | string;
  private shadowOpacity?: number | string;
  private shadowRadius?: number | string;
  private rasterize?: boolean;
  private useShadowPath?: boolean;

  // used to manage functions
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

      if (this.shadow && (typeof this.shadow !== 'string' && !this.shadow.elevation) && typeof this.shadow === 'number') {
        this.elevation = this.shadow;
      }

      if ( this.shadow && (typeof this.shadow !== 'string' && this.shadow.elevation) && !this.elevation) {
        this.elevation = this.shadow.elevation;

        if (isAndroid && (
          ('pressedElevation' in this.shadow) || 
          ('shape' in this.shadow) ||
          ('bgcolor' in this.shadow) ||
          ('cornerRadius' in this.shadow) ||
          ('translationZ' in this.shadow) ||
          ('pressedTranslationZ' in this.shadow) ||
          ('forcePressAnimation' in this.shadow)
          )) {
          this.pressedElevation = this.shadow.pressedElevation;
          this.shape= this.shadow.shape;
          this.bgcolor = this.shadow.bgcolor;
          this.cornerRadius = this.shadow.cornerRadius;
          this.translationZ = this.shadow.translationZ;
          this.pressedTranslationZ = this.shadow.pressedTranslationZ;
          this.forcePressAnimation= this.shadow.forcePressAnimation;
        } else if (isIOS && (
          ('maskToBounds' in this.shadow) ||
          ('shadowColor' in this.shadow) ||
          ('shadowOffset' in this.shadow) ||
          ('shadowOpacity' in this.shadow) ||
          ('shadowRadius' in this.shadow) ||
          ('useShadowPath' in this.shadow) ||
          ('rasterize' in this.shadow)
          )) {
          this.maskToBounds = this.shadow.maskToBounds;
          this.shadowColor = this.shadow.shadowColor;
          this.shadowOffset = this.shadow.shadowOffset;
          this.shadowOpacity = this.shadow.shadowOpacity;
          this.shadowRadius = this.shadow.shadowRadius;
          this.useShadowPath = this.shadow.useShadowPath;
          this.rasterize = this.shadow.rasterize;
        } else {
          //
        }
      }

      if ( !binding.value.shadow && binding.value.elevation) {
        this.elevation = binding.value.elevation;
        
        if (isAndroid) {
          this.pressedElevation = binding.value.pressedElevation;
          this.shape= binding.value.shape;
          this.bgcolor = binding.value.bgcolor;
          this.cornerRadius = binding.value.cornerRadius;
          this.translationZ = binding.value.translationZ;
          this.pressedTranslationZ = binding.value.pressedTranslationZ;
          this.forcePressAnimation= binding.value.forcePressAnimation;
        } else if (isIOS) {
          this.maskToBounds = binding.value.maskToBounds;
          this.shadowColor = binding.value.shadowColor;
          this.shadowOffset = binding.value.shadowOffset;
          this.shadowOpacity = binding.value.shadowOpacity;
          this.shadowRadius = binding.value.shadowRadius;
          this.useShadowPath = binding.value.useShadowPath;
          this.rasterize = binding.value.rasterize;
        }
      }
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
          } as AndroidData);
        } else if (isIOS) {
          this.loadFromIOSData({
            elevation: this.elevation,
            maskToBounds: this.maskToBounds,
            shadowColor: this.shadowColor,
            shadowOffset: this.shadowOffset as number,
            shadowOpacity: this.shadowOpacity as number,
            shadowRadius: this.shadowRadius as number,
            rasterize: this.rasterize,
            useShadowPath: this.useShadowPath
          } as IOSData);
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

  // Following sections (bindEvents & unbindEvents) of code is left in for historical purposes until more extensive testing
  // can be undertaken with the Vue version of the plugin.  Commenting them out has no ill effects for Android,
  // but for IOS, the initial render has no shadows. If the v-shadow value is updated post render, then it will work

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

    this.applyShadow();
    if (isAndroid) {
      this.previousNSFn = this.el._nativeView._redrawNativeBackground; // just to maintain compatibility with other patches
      this.el._nativeView._redrawNativeBackground = this.monkeyPatch;
    }
  }

  public addIOSWrapper(): void {
    if (isIOS) {
      const originalElement = this.el;
      const parent = originalElement.parentNode;

      const vm = new Vue({
        template: '<StackLayout></StackLayout>',
      }).$mount();

      // @ts-ignore
      const wrapper = vm.$el;

      parent.insertBefore(wrapper, originalElement);
      parent.removeChild(originalElement);
      wrapper.appendChild(originalElement);      

      // @ts-ignore
      this.iosShadowWrapper = wrapper._nativeView as StackLayout;
    }
  }

  public unload() {
    this.loaded = false;

    if (isAndroid) {
      this.el._nativeView._redrawNativeBackground = this.originalNSFn; // always revert to the original method
    }
  }

  public onUpdate(values: any) {
    if (this.loaded && !!values && (
      values.shadow ||
      values.elevation ||
      values.pressedElevation ||
      values.shape ||
      values.bgcolor ||
      values.cornerRadius ||
      values.pressedTranslationZ ||
      values.forcePressAnimation ||
      values.translationZ ||
      values.maskToBounds ||
      values.shadowColor ||
      values.shadowOffset ||
      values.shadowOpacity ||
      values.shadowRadius ||
      values.rasterize ||
      values.useShadowMap
    )) {
      if (values.shadow && !values.shadow.elevation && typeof values.shadow === 'number') {
        this.elevation = values.shadow;
      }

      if ( values.shadow && values.shadow.elevation && !values.elevation) {
        this.elevation = values.shadow.elevation;
        if (isAndroid) {
          this.loadFromAndroidData(values.shadow as AndroidData);
        } else if (isIOS) {
          this.loadFromIOSData(values.shadow as IOSData);
        }
      }

      if ( !values.shadow && values.elevation) {
        this.elevation = values.elevation;
        if (isAndroid) {
          this.loadFromAndroidData(values as AndroidData);
        } else if (isIOS) {
          this.loadFromIOSData(values as IOSData);
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
    if (!this.shadow && !this.elevation) {
        return;
    }

    // For shadows to be shown on Android the SDK has to be greater
    // or equal than 21, lower SDK means no setElevation method is available
    if (isAndroid) {
      if (android.os.Build.VERSION.SDK_INT < 21) {
        return;
      }
    }

    const viewToApplyShadowTo = isIOS ? this.iosShadowWrapper : this.el._nativeView;

    if (viewToApplyShadowTo) {
      Shadow.apply(viewToApplyShadowTo, {
        elevation: this.elevation as number,

        // along with this.elevation the following make up AndroidData object
        pressedElevation: this.pressedElevation as number,
        shape: this.shape,
        bgcolor: this.bgcolor,
        cornerRadius: this.cornerRadius,
        translationZ: this.translationZ,
        pressedTranslationZ: this.pressedTranslationZ,
        forcePressAnimation: this.forcePressAnimation,

        // along with this.elevation the following make up IOSData object
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
      this.elevation = this.elevation ? parseInt(this.elevation as string, 10) : 2;
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
    this.pressedTranslationZ = data.pressedTranslationZ || this.pressedTranslationZ;
    this.forcePressAnimation = data.forcePressAnimation || this.forcePressAnimation;
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
    // console.log("v-shadow - bind")
    const shadowDir: NativeShadowDirective = new NativeShadowDirective(el, binding);
    shadowDir.init();
    // @ts-ignore
    el.__vShadow = shadowDir; 
  },
  inserted(el, binding, vnode) {
    // console.log("v-shadow - inserted")
    // @ts-ignore
    const shadowDir = el.__vShadow
    shadowDir.addIOSWrapper();
  },
  update(el, { value, oldValue }, vnode) {
    // console.log("v-shadow - update")
    // console.log("v-shadow - update - value - ", value);
    // @ts-ignore
    const shadowDir = el.__vShadow
    shadowDir.onUpdate(value);
  },
  componentUpdated(el, { value, oldValue }, vnode) {
    // console.log("v-shadow - componentUpdated")
  },
  unbind(el, binding, vnode) {
    // console.log("v-shadow - unbind")
    // @ts-ignore
    const shadowDir = el.__vShadow
    shadowDir.destroy();
    // @ts-ignore
    el.__vShadow = null;

  },
};