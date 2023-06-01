const { resolve } = require('path');
const { readdirSync, readFileSync } = require('fs');
const TerserPlugin = require("terser-webpack-plugin");

let entryObject = {};

scanDirectory('./pages');

function scanDirectory(directory) {
  readdirSync(directory).forEach(page => {
    if(page.endsWith('.tsx') && readFileSync(`${directory}/${page}`).includes('createRoot(')) {
      let pageName = page.split('.tsx')[0];
      let index = 1;

      while(Object.keys(entryObject).includes(pageName)) {
        index++;
        pageName = page.split('.tsx')[0] + index;
      }

      entryObject = {...entryObject, 
        [page.split('.tsx')[0]]: `${directory}/${page}`
      }
    } 
    else {
      if(!page.includes('.')) scanDirectory(`${directory}/${page}`);
    }
  });
}

module.exports = {
  entry: entryObject,
  module: {
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        use: 'ts-loader',
        include: /pages/,
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: resolve('./dist/public/js/'),
  },
  mode: 'development',
  // optimization: {
  //   minimize: true,
  //   minimizer: [new TerserPlugin()],
  // }
};