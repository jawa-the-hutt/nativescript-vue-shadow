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
      objectHashIgnoreUnknownHack: true,
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
  "vue",
  "tns-core-modules/color",
  "tns-core-modules/platform",
  "tns-core-modules/ui/page/page",
];
const globals = {
  // Provide global variable names to replace your external imports
  // eg. jquery: '$'
  "tns-core-modules/color": 'color',
  "tns-core-modules/platform": 'platform',
  "tns-core-modules/ui/page/page": 'page',
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
