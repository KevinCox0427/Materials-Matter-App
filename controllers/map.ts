import express from 'express';
import serveHTML from '../utils/serveHTML';
import { isAuth } from '../utils/authentication';
import Maps from '../models/maps';
import CommentSessions from '../models/commentSessions';
import Comments from '../models/comments';

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * Setting up a GET endpoint to serve the map page React file.
 */
map.route('/:id')
    .get(isAuth, async (req, res) => {
        /**
         * Guard clause to make sure the id is a number.
         */
        if(!req.params.id || isNaN(parseInt(req.params.id))) {
            res.status(400).send('Invalid Id.');
            return;
        }

        /**
         * Getting the map from the database.
         */
        const map = await Maps.getById(parseInt(req.params.id));

        /**
         * If the map wasn't found, return error.
         */
        if(!map) {
            res.status(400).send('Invalid Id.');
            return;
        }

        /**
         * Getting the comment sessions from the database.
         */
        const sessions = await CommentSessions.get({
            mapId: map.id
        });

        /**
         * And filling the sessions with their comments from the database.
         */
        const fullSessions = await Promise.all(
            sessions.map(async (session) => {
                return {...session,
                    comments: await Comments.get({
                        commentsessionId: session.id
                    })
                }
            })
        );

        /**
         * Loading the server properties to pass to the client.
         */
        const serverProps:ServerPropsType = {
            mapPageProps: {
                map: map,
                sessions: fullSessions
            }
        }

        /**
         * Serving the react page.
         */
        res.status(200).send(serveHTML('Map', serverProps));
    });

export default map;