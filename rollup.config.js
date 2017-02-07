import path from "path";
import babel from "rollup-plugin-babel";
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-js';

const {
  name,
  version
} = require('./package.json');

const banner =
    '/*!\n' +
    ' * v' + version + '\n' +
    ' * (c) 2017-' + new Date().getFullYear() + ' \n' +
    ' */';


const COMMONJS_CONFIG = {
  extensions : [".js"],
  ignoreGlobal : false,
  sourceMap : true
};


module.exports =  {
  banner,
  entry : path.resolve(__dirname,"./src/index.js"),
  dest : path.resolve(__dirname,"./dist/miniapp-util.js"),
  format : "umd",
  moduleName : name,
  sourceMap : false,
  plugins : [
    babel({ runtimeHelpers: true }),
  ]
};


if (process.env.BUILD === "dev") {

    module.exports.dest = path.resolve(__dirname,"./dev/miniapp-util.js");
    module.exports.sourceMap = true;

    module.exports.plugins.push(
      commonjs(COMMONJS_CONFIG)
    );

} else {

  COMMONJS_CONFIG.ignoreGlobal = true;
  COMMONJS_CONFIG.sourceMap = false;

  module.exports.plugins.push(
    commonjs(COMMONJS_CONFIG),
    uglify({},minify)
  );

}
