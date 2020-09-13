import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'org.nativescript.application',
  appResourcesPath: 'app/App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  },
  name: 'demo',
  version: '0.1.0',
  appPath: 'app'
} as NativeScriptConfig;
