import { Request, Response, NextFunction } from "express";
import passport from 'passport';
import { app } from '../server';
import { Strategy } from 'passport-google-oauth2';
import dotenv from 'dotenv';
import User from "../models/users";

dotenv.config();

/**
 * Declaration merging the types for our user sessions to add user information.
 * Also doing so for our socket.io server.
 */
declare global {
    namespace Express {
        interface Partial<SessionData> {
            passport?: {
                user?: UserDoc
            }
        }
        interface User extends UserDoc {}
    }
}

/**
 * Intiating the Google oauth2 configuation.
 * Still needs to be register in my google web portal.
 */
passport.use(new Strategy({
        clientID: process.env.googleClientId || '',
        clientSecret: process.env.googleClientSecret || '',
        callbackURL: `${process.env.originURL}/users/callback` || '',
        passReqToCallback: true
    },
    async (request:any, accessToken:any, refreshToken:any, profile:any, done:any) => {
        /**
         * Rejecting any google accounts that don't contain the binghamton.edu domain.
         */
        if(typeof profile._json === 'undefined') return done(null, null);
        if(!profile._json.email_verified || profile._json.domain !== 'binghamton.edu') return done(null, null);

        /**
         * Returning the data we want to store from the logged in user.
         */
        const googleAccount = {
            firstName: profile._json.given_name,
            lastName: profile._json.family_name,
            email: profile._json.email,
            image: profile._json.picture,
            admin: false
        }

        /**
         * Then we search the database to see if it has been stored
         */
        let userDoc:UserDoc[] | UserDoc = await User.get(googleAccount);

        /**
         * If not, create a new one
         */
        if(userDoc.length === 0) {
            const createResult = await User.create(googleAccount);
            if(createResult) {
                // Getting the user doc from the newly created id.
                const getResult = await User.getByID(createResult);
                if(getResult) userDoc = getResult;
                else return done(null, false);
            }
            else return done(null, false);
        }
        /**
         * Otherwise just return the found user.
         */
        else {
            userDoc = userDoc[0];
        }

        return done(null, userDoc);
    }
));

/**
 * Registering it as middleware such that the server checks for user sessions each route.
 */
app.use(passport.initialize());
app.use(passport.session());
/**
 * Serializing function for the user session.
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/**
 * Deserializing function for the user session.
 */
passport.deserializeUser(async (userId:number, done) => {
    const user = await User.getByID(userId);
    done(null, user ? user : null);
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
    else res.status(302).redirect('/users/login');
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
    else res.status(302).redirect('/users/login');
}