import express from 'express';
import serveHTML from '../utils/serveHTML';
import Maps from '../models/maps';
import CommentSessions from '../models/commentSessions';
import Comments from '../models/comments';
import { io } from '../utils/socketIO';
import RegexTester from '../utils/regexTester';
import Rows from '../models/rows';
import Nodes from '../models/nodes';
import { isAuth } from '../utils/authentication';

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const mapRegex = new RegexTester({
    
});

function nodeListToFullMapDoc(nodeList: MapNodeList[]) {
    /**
     * Now we'll structure all these SQL rows into a JSON object.
     */
    let map:FullMapDoc = {
        id: nodeList[0].id,
        name: nodeList[0].name,
        rows: []
    }

    /**
     * Looping through each node in the list and adding it to the correct row.
     */
    nodeList.forEach(node => {
        /**
         * If the row id is null, that means there are no rows, and we can just return the empty map.
         */
        if(!node.rowId) {
            return;
        }
        /**
         * If the node id is null, that means it's an empty row
         */
        if(!node.nodeId) {
            map.rows.push({
                id: node.rowId!,
                mapId: node.id!,
                index: node.rowIndex!,
                name: node.rowName!,
                nodes: []
            });
        }
        /**
         * Otherwise the row exists. If it isn't made yet then push a row.
         */
        else {
            if(!map.rows[node.rowIndex!]) {
                map.rows.push({
                    id: node.rowId!,
                    mapId: node.id!,
                    index: node.rowIndex!,
                    name: node.rowName!,
                    nodes: []
                });
            }
            /**
             * And push the node.
             */
            map.rows[node.rowIndex!].nodes.push({
                id: node.nodeId!,
                rowId: node.rowId!,
                index: node.nodeIndex!,
                name: node.nodeName!,
                htmlContent: node.nodeHtmlContent!,
                gallery: JSON.parse(node.nodeGallery!)
            })
        }
    });

    return map;
}

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
    })
    .post(isAuth, async (req, res) => {
        const mapData = req.body as FullMapDoc;

        const newMapId = await Maps.create({
            name: mapData.name
        });
    
        if(!newMapId) {
            res.status(500).send({
                success: false,
                message: 'Map failed to be created in the database.'
            });
            return;
        }
    
        const mapDataResult = (await Promise.all(mapData.rows.map(async (row, i) => {
            const rowResult = await Rows.create({
                name: row.name,
                index: i,
                mapId: newMapId
            });
    
            if(!rowResult) return false;
    
            return (await Promise.all(row.nodes.map(async (node, j) => {
                return await Nodes.create({
                    name: node.name,
                    index: j,
                    rowId: rowResult,
                    gallery: node.gallery,
                    htmlContent: node.htmlContent
                })
            }))).every(nodeResult => nodeResult);
        }))).every(rowResult => rowResult);
    
        if(mapDataResult) {
            const newMap = await Maps.getById(newMapId);
            
            if(newMap) res.status(200).send({
                success: true,
                message: await Maps.getById(newMapId)
            });
            else res.status(500).send({
                success: false,
                message: 'Map failed to be retrieved from the database.'
            })
        }
        else {
            res.status(500).send({
                success: false,
                message: 'Map\'s data failed to save in the database.'
            });
        }
    })

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
            mapId: map[0].id
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
                map: nodeListToFullMapDoc(map),
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
    })
    .post(isAuth, async (req, res) => {
        const mapData = req.body as FullMapDoc;
        const previousMap = await Maps.getById(mapData.id);

        if(!previousMap) {
            res.status(400).send({
                success: false,
                message: 'Invalid Id.'
            });
            return;
        }

        Maps.update(mapData.id, {
            name: mapData.name
        });

        const updateResult = (await Promise.all(mapData.rows.map(async (row) => {
            let rowId = row.id;

            if(rowId === -1) {
                const newRowId = await Rows.create({
                    name: row.name,
                    index: row.index,
                    mapId: mapData.id
                });

                if(newRowId) rowId = newRowId;
                else return false;
            }
            else {
                const result = await Rows.update(rowId, {
                    name: row.name,
                    index: row.index,
                    mapId: mapData.id
                });

                if(!result) return false;
            }
            
            if(row.nodes.length === 0) {
                previousMap.splice(previousMap.findIndex(mapItem => mapItem.rowId === rowId), 1);
            }

            return (await Promise.all(row.nodes.map(async (node) => {
                if(node.id === -1) {
                    return (await Nodes.create({
                        name: node.name,
                        index: node.index,
                        rowId: rowId,
                        gallery: node.gallery,
                        htmlContent: node.htmlContent
                    }));
                }
                else {
                    previousMap.splice(previousMap.findIndex(mapItem => mapItem.nodeId === node.id), 1);
                    return (await Nodes.update(node.id, {
                        name: node.name,
                        index: node.index,
                        rowId: rowId,
                        gallery: node.gallery,
                        htmlContent: node.htmlContent
                    }));
                }
            }))).every(result => result);
        }))).every(result => result);

        const deleteResult = (await Promise.all(previousMap.map(async (mapItem) => {
            if(mapItem.nodeId) {
                return await Nodes.delete(mapItem.nodeId);
            }
            else {
                if(mapItem.rowId) {
                    return await Rows.delete(mapItem.rowId);
                }
            }
        }))).every(result => result);

        res.status(200).send({
            success: updateResult && deleteResult,
            message: updateResult && deleteResult ? 'Successfully saved!' : 'Error during save.'
        });
    })

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const commentRegex = new RegexTester({
    content: /^[\d\w\s!@#$%^&*()_+-=,.\/;'<>?:"]{1,2000}/,
    x: /^[0-9]{1,5}/,
    y: /^[0-9]{1,5}/,
    userId: /^[0-9]{1,5}/,
    commentsessionId: /^[0-9]{1,5}/,
    replyId: /^[0-9]{1,5}/
});

/**
 * Creating a socket.io connection to post and recieve comments.
 */
io.on("connect", (socket) => {
    socket.on("postComment", async (requestData) => {
        const newComment = await createComment(requestData);

        if(typeof newComment === 'string') socket.to(socket.id).emit(newComment);
        else io.sockets.emit("recieveComment", newComment);
    });
});

async function createComment(requestData:any) {
    const regexResult = commentRegex.runTest(requestData);

    if(typeof regexResult === 'string') {
        return regexResult;
    }

    const createResult = await Comments.create(requestData as CommentType);

    if(!createResult) {
        return 'Comment failed to be inserted into the database';
    }

    const newComment = await Comments.getById(createResult);

    return newComment ? newComment : 'Comment failed to be retrieved from the database';
}

export default map;