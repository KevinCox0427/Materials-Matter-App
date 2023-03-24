import express from 'express';

/**
 * Setting up a router for our index route.
 */
const index = express.Router();

/**
 * Setting up a GET endpoint to serve the homepage React file.
 */
index.route('/')
    .get((req, res) => {

    })

export default index;