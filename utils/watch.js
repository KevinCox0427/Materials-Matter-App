const { exec, execSync } = require('child_process');

// Compiling the build for the server first.
try {
    execSync('tsc');
    execSync('sass styles:dist/public/css');
}
catch(e) {
    console.log(e);
    process.kill(0);
}

// Starting the dev server for the front-end
const vite = exec('vite', {stdio:'inherit'});

// Starting the monitoring script for transpiling the typescript files.
const typescript = exec("nodemon server.ts --exec 'tsc && node dist/server.js' -e ts,tsx --ignore node_modules/ --ignore dist/", {stdio:'inherit'});

// Starting the monitoring script for pre-processing the scss files.
const sass = exec('sass styles:dist/public/css --watch', {stdio:'inherit'});

// Killing the processes on exit.
process.on('exit', () => {
    vite.kill('SIGINT');
    typescript.kill('SIGINT');
    sass.kill('SIGINT');
});