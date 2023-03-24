import { Request, Response, NextFunction } from "express";
import passport from 'passport';
import { app } from '../server';
import { Strategy } from 'passport-google-oauth2';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Declaration merging the types for our user sessions to add user information.
 */
declare global {
    namespace Express {
        interface Partial<SessionData> {
            passport?: {
                user?: string
            }
        }
        interface User {
            admin: boolean
        }
    }
}

/**
 * Intiating the Google oauth2 configuation.
 * Still needs to be register in my google web portal.
 */
passport.use(new Strategy({
        clientID: process.env.googleClientId || '',
        clientSecret: process.env.googleClientSecret || '',
        callbackURL: "http://localhost:3000/callback",
        passReqToCallback: true
    },
    function(request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

/**
 * Registering it as middleware such that the server checks for user sessions each route.
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * Serializing function for the user session key.
 */
passport.serializeUser((user, done) => {
    done(null, user);
});
/**
 * Deserializing function for the user session key.
 */
passport.deserializeUser((user:Express.User, done) => {
    done(null, user)
});

/**
 * Function to check whether the user is authenticated
 * 
 * @param req Express request object
 * @param res Express response object.
 * @param next Function to continue express's logic if user is authenicated
 */
export function isAuth ( req:Request, res:Response, next:NextFunction ) {
    if(req.isAuthenticated()) { next() }
    else res.status(302).redirect('/user/login');
};

/**
 * Function to check whether the user is authenticated and is an admin user.
 * 
 * @param req Express request object.
 * @param res Express response object.
 * @param next Function to continue express's logic if the user is authenicated and an admin.
 */
export function isAdmin ( req:Request, res:Response, next:NextFunction ) {
    if(req.isAuthenticated() && req.user.admin) { next() }
    else res.status(302).redirect('/user/login');
}