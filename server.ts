// Intializing our environmental variables.
import dotenv from 'dotenv';
dotenv.config();


/**
 * Initializing our express server.
 */
import express from "express";
export const app = express();


// Parsing all endpoints to our server in JSON format.
// Encoding all URIs.
// Adding CORS policies
import cors from 'cors';

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended:true, limit: '10mb'}));
app.set('etag', false);
app.use(cors({
    origin: process.env.originURL || 'http://localhost:3000'
}));


// Setting up user sessions via express session.
// Also storing these sessions in a database.
import expressSession from "express-session";
const mySqlStore = require('express-mysql-session')(expressSession);

export const session = expressSession({ 
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
})

app.use(session);


// Importing database schemas.
import './models/__init__';


// Importing the authentication middleware.
import './utils/authentication';


// Declaring server properties types to be passed to the client-side.
declare global { 
    type ServerPropsType = Partial<{
        homePageProps: HomePageProps,
        mapPageProps: MapPageProps
    }>
}


// Declaring the routes
import index from './controllers/index';
import users from './controllers/users';
import map from './controllers/map';
import image from './controllers/image';

app.use('/', index);
app.use('/users', users);
app.use('/map', map);
app.use('/image', image);


// Declaring static files in the public folder.
app.use('/public', express.static('dist/public'));


// Importing the server from the socket.io configuration.
// Listening server to declared port.
import { server } from './controllers/socketIO';
server.listen(process.env.PORT || 3000);