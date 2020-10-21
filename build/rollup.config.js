// rollup.config.js
import vue from "rollup-plugin-vue";
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import minimist from "minimist";
import resolve from "rollup-plugin-node-resolve";

const argv = minimist(process.argv.slice(2));

const baseConfig = {
  input: "src/index.ts",
  inlineDynamicImports: true,
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production")
    }),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
      useTsconfigDeclarationDir: true,
      objectHashIgnoreUnknownHack: false,
      clean: true
    }),
    vue({
      css: true,
      compileTemplate: true,
      template: {
        isProduction: true
      }
    })
  ]
};

// UMD/IIFE shared settings: externals and output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const external = [
  // list external dependencies, exactly the way it is written in the import statement.
  // eg. 'jquery'
  "nativescript-vue",
    "@nativescript/core",
  // "@nativescript/core/color",
  // "@nativescript/core/platform",
  // "@nativescript/core/ui/page/page",
  // "@nativescript/core/ui/core/weak-event-listener",
  // "'@nativescript/core/ui/layouts/stack-layout"
];
const globals = {
  // Provide global variable names to replace your external imports
  // eg. jquery: '$'
  "nativescript-vue": 'vue',
  "@nativescript/core/color": 'color',
  "@nativescript/core/platform": 'platform',
  "@nativescript/core/ui/page/page": 'page',
  "@nativescript/core/ui/core/weak-event-listener" : 'weakEventListener',
};

// Customize configs for individual targets
const buildFormats = [];
if (!argv.format || argv.format === "es") {
  const esConfig = {
    ...baseConfig,
    external,
    output: {
      file: "dist/nativescript-vue-shadow.esm.js",
      format: "esm",
      exports: "named"
    },
    plugins: [
      ...baseConfig.plugins
      // terser({
      //   output: {
      //     ecma: 6
      //   }
      // })
    ]
  };
  buildFormats.push(esConfig);
}

if (!argv.format || argv.format === "umd") {
  const umdConfig = {
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: "dist/nativescript-vue-shadow.umd.js",
      format: "umd",
      name: "NativescriptVueshadow",
      exports: "named",
      globals
    },
    plugins: [
      ...baseConfig.plugins
      // terser({
      //   output: {
      //     ecma: 6
      //   }
      // })
    ]
  };
  buildFormats.push(umdConfig);
}

if (!argv.format || argv.format === "iife") {
  const unpkgConfig = {
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: "dist/nativescript-vue-shadow.js",
      format: "iife",
      name: "NativescriptVueshadow",
      exports: "named",
      globals
    },
    plugins: [
      ...baseConfig.plugins
      // terser({
      //   output: {
      //     ecma: 5
      //   }
      // })
    ]
  };
  buildFormats.push(unpkgConfig);
}

// Export config
export default buildFormats;
