const { resolve } = require('path');
const { readdirSync, readFileSync, lstatSync } = require('fs');
const TerserPlugin = require("terser-webpack-plugin");

/**
 * We only want to bundle the pages that need to be server-side rendered.
 */
let entryObject = {};
scanDirectory('./views');

/**
 * A function to recursively check the "pages" directory for any React pages that need bundling.
 * If the file is ".tsx" and contains the function hydrateRoot(), then we add it to "entryObject" as a key value pair.
 * 
 * @param directory The entry point to start scanning.
 */
function scanDirectory(directory) {
  /**
   * Looping through each file/folder.
   */
  readdirSync(directory).forEach(pointer => {
    /**
     * If the file ends with .tsx and calls the hydrateRoot() function, then we must bundle it.
     */
    if(pointer.endsWith('.tsx') && readFileSync(`${directory}/${pointer}`).includes('hydrateRoot(')) {
      /**
       * Getting the file name
       */
      let fileName = pointer.split('.tsx')[0];
      
       /**
       * If the file's name is already taken, then we'll add an integer to the end so it's unique.
       */
      if(Object.keys(entryObject).includes(fileName)){
        let index = 1;

        while(Object.keys(entryObject).includes(fileName)) {
          index++;
        }

        fileName = pointer.split('.tsx')[0] + index;
      }

      /**
       * Adding this file to the entryObject with its file name.
       */
      entryObject = {...entryObject, 
        [fileName]: `${directory}/${pointer}`
      }
    }
    /**
     * Otherwise, if it's a folder, then recursively call this function.
     */
    else if(lstatSync(`${directory}/${pointer}`).isDirectory()) {
      scanDirectory(`${directory}/${pointer}`);
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
        include: /views/,
        exclude: /node_modules/
      },
      {
        test: /\.(js|mjs)?$/,
        resolve: { fullySpecified: false },
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ]
          }
        }
      },
      {
        test: /\.(css)$/,
        use: ['style-loader','css-loader'],
        exclude: /node_modules/
      }
    ],
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