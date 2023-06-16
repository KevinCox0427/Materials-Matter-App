import express from 'express';
import serveHTML from '../utils/serveHTML';
import { isAuth } from '../utils/authentication';

/**
 * Setting up a router for our index route.
 */
const index = express.Router();

/**
 * Setting up a GET endpoint to serve the homepage React file.
 */
index.route('/')
    .get((req, res) => {
        /**
         * Loading the server properties to pass to the client.
         */
        const serverProps:ServerPropsType = {
            homePageProps: {
                maps: [{
                    id: 1,
                    name: 'The best map'
                }],
                userData: req.user ? {
                    userId: req.user.id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    image: req.user.image
                } : undefined
            }
        }

        /**
         * Serving the react page.
         */
        res.status(200).send(serveHTML('Home', serverProps))
    });

export default index;