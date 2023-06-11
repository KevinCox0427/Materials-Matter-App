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
    .get(isAuth, (req, res) => {
        const serverProps:ServerPropsType = {
            homePageProps: {
                maps: [{
                    name: 'The best map'
                }]
            }
        }

        res.status(200).send(serveHTML('Home', serverProps))
    });

export default index;