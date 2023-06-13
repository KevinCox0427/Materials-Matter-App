/**
 * Intializing our environmental variables.
 */
import dotenv from 'dotenv';
dotenv.config();


/**
 * Initializing our express server.
 */
import express from "express";
export const app = express();


/**
 * Parsing all endpoints to our server in JSON format.
 * Also encoding all URIs.
 */
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.set('etag', false);


/**
 * Setting up user sessions via express session.
 * Also storing these sessions in a database.
 */
import session from "express-session";
const mySqlStore = require('express-mysql-session')(session);

app.use(session({ 
    secret: process.env.SessionSecret || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, //change to true when hosting on https server
        maxAge: 24 * 60 * 60 * 1000
    },
    store: new mySqlStore({
        connectionLimit: 10,
        host: process.env.sqlHost,
        port: process.env.sqlPort,
        user: process.env.sqlUser,
        password: process.env.sqlPass,
        database: process.env.sqlDatabase,
        createDatabaseTable: true
    })
}));

/**
 * Import database configuration
 */
import './models/__init__';


/**
 * Importing the authentication configuration.
 */
import './utils/authentication';


/**
 * Declaring server properties types to be passed to the client-side.
 */
declare global { 
    type ServerPropsType = Partial<{
        homePageProps: HomePageProps,
        mapPageProps: MapPageProps
    }>
}


/**
 * Declaring the routes
 */
import index from './controllers/index';
import users from './controllers/users';
import map from './controllers/map';
import image from './controllers/image';

app.use('/', index);
app.use('/users', users);
app.use('/map', map);
app.use('/image', image);


/**
 * Declaring static files in the public folder.
 */
app.use('/assets', express.static('dist/puclic/assets'));
app.use('/css', express.static('dist/public/css'));
app.use('/js', express.static('dist/public/js'));


/**
 * Listening server to declared port.
 */
app.listen(process.env.PORT || 3000);