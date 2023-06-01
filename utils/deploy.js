const fs = require('fs');
const resolve = require('path').resolve;
const execSync = require('child_process').execSync;

/**
 * Deleteing a previous build if it exists
 */
if(fs.existsSync(resolve('./dist'))) fs.rmSync(resolve('./dist'), { recursive: true, force: true });
if(fs.existsSync(resolve('./app'))) fs.rmSync(resolve('./app'), { recursive: true, force: true });

/**
 * Running the typescript command
 */
console.log('\nCompiling Typescript files...');
execSync('tsc');

/**
 * Running the sass command
 */
console.log('\nCompiling Sass files...');
execSync('sass styles:dist/public/css');

/**
 * Running the webpack command
 */
console.log('\nHydrating React files...');
execSync('webpack');

/**
 * Creating a package.json file for the production build.
 * This will add a start script and remove anything that has to do with webpack, typescript, and sass.
 */
console.log('\nCreating a package.json file...');
let packageJson = JSON.parse(fs.readFileSync(resolve('./package.json')).toString());

/**
 * Adding a start script.
 */
packageJson.scripts = {
    "start": "npm i && node server.js"
}

/**
 * Looping through each dependecy and removing ones associated with webpack, typescript, and sass.
 */
let newDevDependencies = {};

Object.keys(packageJson.devDependencies).forEach(dependency => {
    if(dependency.includes('@types') || ['sass', 'ts-loader', 'webpack', 'webpack-cli', 'babel-loader', 'css-loader', '@babel/preset-env', '@babel/core', 'style-loader'].indexOf(dependency) !== -1) return;
    newDevDependencies = {...newDevDependencies,
        [dependency]: packageJson.devDependencies[dependency]
    };
});

/**
 * Writing the new package.json.
 */
delete packageJson.devDependencies;
packageJson = {...packageJson,
    dependencies: newDevDependencies
};

fs.writeFileSync(resolve('./dist/package.json'), JSON.stringify(packageJson));

/**
 * Adding the Procfile.
 */
console.log('\nAdding environmental variables...');
fs.writeFileSync('./dist/Procfile', 'web: node server.js');

/**
 * Recursivelty going through each js file remove 'dist/' from any path.
 * This is so that all paths resolve correctly.
 * Also removing any '.map' files.
 */
console.log('\nCleaning up the directories...');
cleanDirectory('./dist');

function cleanDirectory(dirname) {
    fs.readdirSync(resolve(dirname)).forEach(fileName => {
        /**
         * We don't need the dev monitoring script, so remove it.
         */
        if(fileName === 'watch.js') {
            fs.rmSync(resolve(`${dirname}/${fileName}`));
            return;
        }
        /**
         * Removing .map files.
         */
        // if(fileName.includes('.map')) {
        //     fs.rmSync(resolve(`${dirname}/${fileName}`));
        //     return;
        // }
        /**
         * Removing 'dist/' from js files.
         */
        if(fileName.includes('.js')) {
            fs.writeFileSync(resolve(`${dirname}/${fileName}`), fs.readFileSync(resolve(`${dirname}/${fileName}`)).toString().split('dist/').join(''));
            return;
        }
        /**
         * Recursively calling it for folders.
         */
        if(!fileName.includes('.') && fileName !== 'Procfile') {
            cleanDirectory(`${dirname}/${fileName}`)
        }
    });
}

/**
 * Adding Resume
 */
fs.mkdirSync('./dist/public/assets');
fs.writeFileSync('./dist/public/assets/Resume_Kevin_Cox.pdf', fs.readFileSync('./public/assets/Resume_Kevin_Cox.pdf').toString());

/**
 * Renaming the 'dist' folder to prevent conflicts.
 */
fs.renameSync('./dist', './app');

console.log('\nDone!\n');