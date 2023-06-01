import { resolve } from 'path';
import { spawn, execSync, ChildProcess } from 'child_process';
import { readdirSync, watch, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

watchScript();

function watchScript() {
    console.log('Compiling...\n');

    try {
        execSync('tsc');
        execSync('sass styles:dist/public/css');
        execSync('webpack');
    } catch (e:any) {
        if(Array.isArray(e.output)) {
            console.log(
                e.output
                    .filter((err:any) => err instanceof Buffer)
                    .map((buffer:Buffer) => {
                        return `Error:\n\n${buffer.toString()}`
                    })
                    .filter((errStr:string) => errStr.length > 'Error:\n\n '.length)
                    .join('\n')
            );
        }
        return;
    }

    copyPublicFiles('public');

    let compileTimestamp = Date.now();
    let node = spawn('node', [resolve('dist/server.js')], {stdio: 'inherit'});

    watchDirectory('.', '');
    readDirectorys('.');
    console.log('Watching!\n');

    function watchDirectory(folder:string, pointer:string) {
        if(!existsSync(`${folder}/${pointer}`)) return;

        watch(`${folder}/${pointer}`, (x, file) => {
            if(!existsSync(`${folder}/${pointer}/${file}`)) return;
            
            if((pointer === 'public' || folder.includes('public')) && !folder.includes('dist')) copyPublicFiles('public');

            if((pointer == 'pages' || folder.includes('pages'))) runProcess('Webpack', file);

            if(file.endsWith('.scss')) runProcess('Sass', file);

            if(file.endsWith('.ts') || file.endsWith('tsx')) runProcess('Typescript', file);

            if(!file.includes('.') || file.split('.')[1].length == 0) watchDirectory(`${folder}/${pointer}`, file);
        });
    }

    function readDirectorys(folder:string) {
        readdirSync(folder).forEach(pointer => {
            if(pointer.includes('.') || pointer == 'node_modules' || pointer == 'dist') return;

            watchDirectory(folder, pointer);
            readDirectorys(`${folder}/${pointer}`);
        }); 
    }

    function runProcess(command: string, fileName: string) {
        if(Date.now() - compileTimestamp < 200) return;

        node.kill('SIGTERM');

        const processTimestamp = Date.now();

        compileTimestamp = processTimestamp;
        console.log(`\nCompiling: ${fileName} (${command})`);
        
        let compiler:ChildProcess | null = null;
        
        switch(command){
            case 'Webpack':
                compiler = spawn('tsc', {shell: true});
                compiler = spawn('webpack', {shell: true});
                break;
            case 'Sass':
                compiler = spawn('sass', ['styles:dist/public/css'], {shell: true});
                break;
            case 'Typescript':
                compiler = spawn('tsc', {shell: true});
                break;
        }

        if(!compiler) return;

        let compilerMessage = '';

        if(compiler.stderr) compiler.stderr.on('data', (data) => {
            compilerMessage = data.toString();
        })
        if(compiler.stdout) compiler.stdout.on('data', (data) => {
            compilerMessage = data.toString();
        })

        compiler.on('exit', code => {
            if(processTimestamp != compileTimestamp) return;

            if(code !== 0 && compilerMessage) {
                if(command === 'Webpack') {
                    const errorArray = compilerMessage.split('ERROR');
                    errorArray.splice(0, 1);
                    compilerMessage = 'ERROR' + errorArray.join('\n\nERROR').split('\nwebpack ')[0];
                }
                console.log(`\nError:\n\n${compilerMessage}\n\nWaiting for changes...\n`);
                return;
            }
            
            console.log('Done!\n');
            node = spawn('node', [resolve('dist/server.js')], {stdio: 'inherit'});
        });
    }

    function copyPublicFiles(dirName:string) {
        if(!existsSync(`./${dirName}`)) return;

        if(!existsSync(`./dist/${dirName}`)) mkdirSync(`./dist/${dirName}`);

        readdirSync(`./${dirName}`).forEach(file => {
            if(!file.includes('.')) {
                copyPublicFiles(`${dirName}/${file}`);
                return;
            }

            if(existsSync(`./dist/${dirName}/${file}`)) return;
            writeFileSync(`./dist/${dirName}/${file}`, readFileSync(`./${dirName}/${file}`));
        });
    }   
}