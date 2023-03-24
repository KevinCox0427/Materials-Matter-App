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
import session, { MemoryStore } from "express-session";
app.use(session({ 
    secret: process.env.SessionSecret || 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, //change to true when hosting on https server
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: true
    },
    store: new MemoryStore()
}));


/**
 * Importing the authentication configuration.
 */
import './utils/authentication';


/**
 * Declaring server properties types to be passed to the client-side.
 */
declare global { 
    type ServerPropsType = Partial<{
        
    }>
}


/**
 * Declaring the routes
 */
import index from './routes/index';

app.use('/', index);


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