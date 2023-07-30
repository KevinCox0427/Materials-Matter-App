import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync, lstatSync } from 'fs';

export default defineConfig(({ mode }) => {
    // Creating an entry object to bundle the pages that are sent client side.
    let entryObject = {};
    const viewsDirectory = process.env.viewsDirectory || 'views';
    scanDirectory(viewsDirectory);
    
    return {
        build: {
            publicDir: 'public',
            outDir: 'dist/public',
            emptyOutDir: false,
            rollupOptions: {
                input: entryObject,
                output: {
                    entryFileNames: `js/[name].js`,
                    chunkFileNames: `js/[name].js`
                }
            }
        },
        server: {
            hmr: true,
            open: '/index.html',
            port: 3001
        },
        plugins: [
            react({
                include: "**/*.tsx",
            }),
        ],
    }

    /**
     * A function to recursively check the views directory for any views that need bundling.
     * @param directory The entry point to start scanning.
     */
    function scanDirectory(directory) {
        // Looping through each file/folder.
        readdirSync(directory).forEach(pointer => {
            // If the file ends with .tsx and calls the hydrateRoot() function, then we must bundle it.
            if(pointer.endsWith('.tsx') && readFileSync(`${directory}/${pointer}`).includes('createRoot(')) {
                // Adding this file to the entryObject with its file name.
                entryObject = {...entryObject, 
                    [`${pointer.split('.tsx')[0]}`]: `${directory}/${pointer}`
                }
            }
            // Otherwise, if it's a folder, then recursively call this function.
            else if(lstatSync(`${directory}/${pointer}`).isDirectory()) {
                scanDirectory(`${directory}/${pointer}`);
            }
        });
    }
});