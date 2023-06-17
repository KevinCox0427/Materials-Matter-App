import express from 'express';
import serveHTML from '../utils/serveHTML';
import { isAuth } from '../utils/authentication';
import Maps from '../models/maps';
import CommentSessions from '../models/commentSessions';
import Comments from '../models/comments';
import { io } from '../utils/socketIO';

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * Setting up a GET endpoint to serve the map page React file.
 */
map.route('/new')
    .get(async (req, res) => {
        /**
         * Loading the server properties to pass to the client.
         */
        const serverProps:ServerPropsType = {
            mapPageProps: {
                map: {
                    id: -1,
                    name: 'New Map',
                    rows: []
                },
                sessions: [],
                userData: req.user ? {
                    userId: req.user.id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    image: req.user.image,
                    isAdmin: req.user.admin
                } : undefined
            }
        }

        /**
         * Serving the react page.
         */
        res.status(200).send(serveHTML('Map', serverProps));
    });

/**
 * Setting up a GET endpoint to serve the map page React file.
 */
map.route('/:id')
    .get(async (req, res) => {
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
        const fullSessions:FullSessionDoc[] = await Promise.all(
            sessions.map(async (session) => {
                let comments = await Comments.get({
                    commentsessionId: session.id
                });
            
                let commentMap:{
                    [replyId: string]: CommentDoc[]
                } = {}

                comments.forEach(comment => {
                    const key = '' + (comment.replyId ? comment.replyId : 0);

                    if(!Object.keys(commentMap).includes(key)) {
                        commentMap = {...commentMap,
                            [key]: []
                        }
                    }

                    commentMap[key].push(comment);
                })

                return {...session,
                    comments: commentMap
                }
            })
        );

        /**
         * Loading the server properties to pass to the client.
         */
        const serverProps:ServerPropsType = {
            mapPageProps: {
                map: map,
                sessions: fullSessions,
                userData: req.user ? {
                    userId: req.user.id,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    image: req.user.image,
                    isAdmin: req.user.admin
                } : undefined
            }
        }

        /**
         * Serving the react page.
         */
        res.status(200).send(serveHTML('Map', serverProps));
    });

/**
 * Creating a socket.io connection to post and recieve comments.
 */
io.on("connect", (socket) => {
    socket.on("postComment", async (requestData) => {
        const createResult = await Comments.create(requestData as CommentType);

        if(!createResult) {
            socket.to(socket.id).emit('Comment failed to be inserted into the database');
            return
        }

        const newComment = await Comments.getById(createResult);

        if(!newComment) {
            socket.to(socket.id).emit('Comment failed to be retrieved from the database');
            return;
        }

        io.sockets.emit("recieveComment", newComment);
    });
});

export default map;