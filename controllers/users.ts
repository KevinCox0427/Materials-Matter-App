import express from 'express';
import passport from 'passport';

/**
 * Setting up a router for our users route.
 */
const users = express.Router();

/**
 * Setting up a GET endpoint to log into a user's google account.
 */
users.route('/login')
    .get(passport.authenticate('google', { scope: ['email', 'profile'] }));

/**
 * The callback URI if the google authentication fails
 */
users.route('/failure')
    .get((req, res) => {
        res.status(401).send('You must have a Binghamton google account to proceed.');
    })

/**
 * The callback URI if the google authentication succeeds.
 */
users.route('/callback')
    /**
     * Calling passport.js's Oauth authentication function to create a user session.
     * See utils/authentication.ts for more details.
     */
    .get(passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/users/failure'
    }))

export default users;