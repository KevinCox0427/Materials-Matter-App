import { resolve } from 'path';
import { spawn, execSync, ChildProcess } from 'child_process';
import { readdirSync, watch, readFileSync, writeFileSync, lstatSync, existsSync, mkdirSync } from 'fs';

/**
 * Keeping track of when the node server started and is running.
 */
let currentCompileTimestamp = Date.now();
let currentNodeProcess:ChildProcess | null = null;

try {
    /**
     * Running the typescript, webpack and sass CLI commands to start the build.
     */
    process.stdout.write(`${redText('Compiling...')}  ${redText('X')} Typescript ${redText('X')} Sass ${redText('X')} Webpack`);

    execSync('tsc');
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${redText('Compiling...')}  ${greenText('\u2713')} Typescript ${redText('X')} Sass ${redText('X')} Webpack`);

    execSync('sass styles:dist/public/css');
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${redText('Compiling...')}  ${greenText('\u2713')} Typescript ${greenText('\u2713')} Sass ${redText('X')} Webpack`);

    execSync('webpack');
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${redText('Compiling...')}  ${greenText('\u2713')} Typescript ${greenText('\u2713')} Sass ${greenText('\u2713')} Webpack`);

    /**
     * Copying assets from the public directory.
     */
    copyPublicFiles('public');

    /**
     * Recursively watching each folder for changes.
     */
    watchDirectory();
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${greenText('Watching!')}  ${greenText('\u2713')} Typescript ${greenText('\u2713')} Sass ${greenText('\u2713')} Webpack\n`);

    /**
     * Starting node process
     */
    currentNodeProcess = spawn('node', [resolve('dist/server.js')], {stdio: 'inherit'});
} catch (e:any) {
    /**
     * If there are errors from the intial commands, log them.
     * The filtering is for cleaning up the error messages.
     */
    if(Array.isArray(e.output)) {
        process.stdout.write(
            e.output
                .filter((err:any) => err instanceof Buffer)
                .map((buffer:Buffer) => {
                    return `Error:\n\n${buffer.toString()}`
                })
                .filter((errStr:string) => errStr.length > 'Error:\n\n '.length)
                .join('\n')
            + '\n'
        );
    }

    process.kill(0);
}

/**
 * A function that recursively reads directories and sets event listeners to run CLI commands when a user saves.
 * @param folder The root folder to start with. Default is the root folder.
 */
function watchDirectory(folder:string = '.') {
    /**
     * Recursive callback for sub-folders.
     */
    readdirSync(folder).forEach(file => {
        if(lstatSync(`${folder}/${file}`).isDirectory() && folder !== 'node_modues') {
            watchDirectory(`${folder}/${file}`);
        }
    });
    /**
     * Adding an event to fire when a user saves anything in this directory with fs's watch()
     */
    watch(folder === '.' ? './' : folder, (_, file) => {
        if(!(file && existsSync(`${folder}/${file}`))) return;

        /**
         * If it's a newly created folder, then we'll watch it.
         */
        if(lstatSync(`${folder}/${file}`).isDirectory()) {
            watchDirectory(`${folder}/${file}`);
        }

        /**
         * If it's in the public folder, that means it's an asset and we'll copy + paste it.
         */
        if(folder.startsWith('./public')) {
            writeFileSync(`${folder}/${file}`, readFileSync(`${folder}/${file}`));
        }
        /**
         * If it's in the 'pages' directory, then it's a React file and it needs to be bundled.
         */
        if(folder.startsWith('./views')) {
            runProcess('tsc && webpack', file);
        }
        /**
         * For Sass.
         */
        if(file.endsWith('.scss')) {
            runProcess('sass styles:dist/public/css', file);
        }
        /**
         * For Typescript.
         */
        if(file.endsWith('.ts') || file.endsWith('tsx')) {
            runProcess('tsc', file);
        }
    });
}

/**
 * A function to run a CLI command. If it succeeds, it'll restart the node server.
 * 
 * @param command The CLI command to run
 * @param fileName The file name to print.
 */
function runProcess(command: string, fileName: string) {
    /**
     * Since fs's watch event is called several times when a file is saved, we'll apply a 200ms buffer to each time this is called.
     * Also adding some fun styling.
     */
    if(Date.now() - currentCompileTimestamp < 200) return;
    process.stdout.write(`\n${redText('Compiling:')} ${yellowHighlight(fileName)}  ${italic(`> ${command}`)}`);

    /**
     * Kills the current node process to run the CLI .
     */
    if(currentNodeProcess) currentNodeProcess.kill('SIGTERM');
    
    /**
     * Running the command.
     */
    let compiler = spawn(command, {shell: true});
    let compilerMessage = '';

    /**
     * Setting event listeners to store outgoing messages
     */
    if(compiler.stderr) compiler.stderr.on('data', data => {
        compilerMessage = data.toString();
    });
    if(compiler.stdout) compiler.stdout.on('data', data => {
        compilerMessage = data.toString();
    });

    /**
     * Recording this process's start timestamp.
     * Then we'll assign it to the global variable to compare it when it's finished.
     */
    const processTimestamp = Date.now();
    currentCompileTimestamp = processTimestamp;

    /**
     * Callback function to check the success of the process when it finishes.
     */
    compiler.on('exit', code => {
        /**
         * If the global timestamp is different than this one, then that means this process is stale.
         */
        if(processTimestamp != currentCompileTimestamp) return;

        /**
         * If fails, then print it's error message and return.
         */
        if(code !== 0 && compilerMessage) {
            /**
             * Since Webpack error messages are ugly.
             */
            if(command === 'Webpack') {
                const errorArray = compilerMessage.split('ERROR');
                errorArray.splice(0, 1);
                compilerMessage = 'ERROR' + errorArray.join('\n\nERROR').split('\nwebpack ')[0];
            }
            process.stdout.write(`\n\n${redHighlight('Error')}\n\n${compilerMessage}\n${greenText('Waiting for changes...')}\n`);
            return;
        }
        
        /**
         * Otherwise if sucessful, start a new node process.
         */
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`${greenText('Done!')} ${yellowHighlight(fileName)}  ${italic(`> ${command}`)}\n`);
        currentNodeProcess = spawn('node', [resolve('dist/server.js')], {stdio: 'inherit'});
    });
}

/**
 * A function that recursively copys a directory into the distributable directory.
 * 
 * @param startingDir The directory that the recursion starts at.
 */
function copyPublicFiles(startingDir: string) {
    if(!existsSync(`./${startingDir}`)) return;

    /**
     * Making a directory in the distributable directory to copy + paste into if it doesn't already exist.
     */
    if(!existsSync(`./dist/${startingDir}`)) {
        mkdirSync(`./dist/${startingDir}`);
    }

    readdirSync(startingDir).forEach(pointer => {
        if(!existsSync(`./${startingDir}/${pointer}`)) return;

        /**
         * If it's a folder, then call this function recusively.
         */
        if(lstatSync(`${startingDir}/${pointer}`).isDirectory()) {
            copyPublicFiles(`${startingDir}/${pointer}`);
        }
        /**
         * Otherwise, copy + paste the file into the distrabutable directory.
         */
        else {
            writeFileSync(`./dist/${startingDir}/${pointer}`, readFileSync(`./${startingDir}/${pointer}`));
        }
    })
} 

/**
 * Styling functions for console logs.
 */

function redText(text:string) {
    return `\x1b[95m\x1b[1m${text}\x1b[0m`;
}

function greenText(text:string) {
    return `\x1b[92m\x1b[1m${text}\x1b[0m`;
}

function redHighlight(text:string) {
    return `\n\x1b[41m\x1b[30m\x1b[1m ${text} \x1b[0m`
}

function yellowHighlight(text:string) {
    return `\x1b[43m\x1b[1m\x1b[30m ${text} \x1b[0m`
}

function italic(text:string) {
    return `\x1b[3m\x1b[2m${text}\x1b[0m`
}