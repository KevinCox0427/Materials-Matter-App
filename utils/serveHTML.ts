/**
 * Declaration merging the Server Props to the Window object.
 */
declare global {
    interface Window {
        ServerProps:ServerPropsType;
    }
}

/**
 * This is our HTML document that will be rendered.
 * First we are setting an appropriate document head to fetch the CSS and JS files.
 * Then, we are using React's renderToString() to render our React element inside the "root" div.
 * Finally, using webpack, we hydrate the "root" div by sending the client a bundled JS file via the document head.
 * This is the exact process that Create-React-App does, but instead we're doing it on our own Node server.
 * 
 * @param fileName The name of the CSS and JS files to be sent to the client (should be the same).
 * @param ServerProps (Optional) Allows us to pass any properties from the server to the client. This is done by parsing it into a JSON string and attaching it to the client's window. This is a technique used by full-stack frameworks like Next.js or Remix.js.
 * @param seoOptions (Optional) Decides how to render the meta tags in the header for SEO purposes.
 */
function serveHTML(fileName:string, inputServerProps:ServerPropsType = {}, seoOptions: {
    title: string,
    url: string,
    description: string,
    name: string,
    image: string
} = {
    title: '',
    url: '',
    description: '',
    name: '',
    image: ''
}){
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${seoOptions.title}</title>
            <meta property="og:title" content="${seoOptions.title}">
            <meta name="description" content="${seoOptions.description}">
            <meta property="og:description" content="${seoOptions.description}">
            <meta property="og:site_name" content="${seoOptions.name}">
            <meta property="og:url" content="${seoOptions.url}">
            <meta property="og:image" content="${seoOptions.image}">
            <link rel="canonical" href="${seoOptions.url}">
            <link rel="icon" href="#" />
            <link rel="stylesheet" type="text/css" href="/public/css/${fileName}.css">
            <link rel="stylesheet" type="text/css" href="/public/css/globals.css">
            <link rel="stylesheet" href="/public/css/fontawesome.css" />
            <script type="module" src="/public/js/client.js"></script>
            <script src="/public/js/quill.js"></script>
            <link href="/public/css/quill.css" rel="stylesheet" />
            <script>window.ServerProps=${JSON.stringify(inputServerProps)}</script>
        </head>
        <body>
            <div id="root"></div>
            <script type="module" src="/public/js/${fileName}.js"></script>
            <noscript>JavaScript must be enabled for this app to run.</noscript>
        </body>
        </html>
    `;
}

export default serveHTML;