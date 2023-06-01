import express from 'express';
import passport from 'passport';

/**
 * Setting up a router for our users route.
 */
const users = express.Router();

/**
 * Setting up a GET endpoint to serve the homepage React file.
 */
users.route('/login')
    .get(passport.authenticate('google', { scope: ['email', 'profile'] }));

users.route('/failure')
    .get((req, res) => {
        res.status(401).send('You must have a Binghamton google account to proceed.');
    })

users.route('/callback')
    .get(passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/users/failure'
    }))

export default users;