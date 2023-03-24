const { resolve } = require('path');
const { readdirSync } = require('fs');
const TerserPlugin = require("terser-webpack-plugin");

/**
 * Selecting all the react files to be bundled by webpack.
 * In this instance, I'm doing so for all React files in the 'pages' directory.
 */
let entryObject = {};
readdirSync('./pages').forEach(page => {
  if(page.split('.tsx').length > 1) {
    entryObject = {...entryObject, [page.split('.tsx')[0]]: `./pages/${page}`}
  }
});

module.exports = {
  entry: entryObject,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts'],
  },
  output: {
    filename: '[name].js',
    path: resolve('./dist/public/js/'),
  },
  /**
   * set to 'production'
   */
  mode: 'development',
  /**
   * Minify & Uglify for produciton
   */
//   optimization: {
//     minimize: true,
//     minimizer: [new TerserPlugin()],
//   }
};