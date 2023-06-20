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
 * Some regex strings so I don't have to repeat them.
 */
const textRegex = /^[\d\w\s!@#$%^&*()_+-=,.\/;'<>?:"]{1,2000}/;
const numberRegex = /^[0-9]{1,5}/;
const idRegex = /^-1|[0-9]{1,5}/;
const dateRegex = /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\ [0-9]{1,2}:[0-9]{1,2}:[0-9]{2}/;
const htmlRegex = /^(<(li|p|h3|ul|ol|span|strong|em|sub|sup|br|u|s|a)( ?(style|class)=\\?"[\w|\s|\d\-:;]+\\?")*>|[\w\s\d.,!@#$%^&*()\-_+\"\';:,.|\/?=<>]*|<\/(p|h3||li|ul|ol|span|strong|em|sub|sup|br|u|s|a)>)+/g;
const imageRegex = new RegExp(`${process.env.awsUrl}[0-9]{1,10}.(jpg|jpeg|png|gif|webp|svg)`);

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const mapRegex = new RegexTester({
    name: textRegex,
    id: idRegex,
    rows: {
        id: idRegex,
        mapId: idRegex,
        name: textRegex,
        index: numberRegex,
        nodes: {
            id: idRegex,
            name: textRegex,
            index: numberRegex,
            rowId: idRegex,
            gallery: imageRegex,
            htmlContent: htmlRegex
        }
    }
});

/**
 * Helper function to convert the SQL response into a map object.
 * @param nodeList The SQL response of all the nodes in a map
 * @returns A map object.
 */
function nodeListToFullMapDoc(nodeList: MapNodeList[]) {
    if(nodeList.length === 0) {
        return {
            id: -1,
            name: '',
            rows: []
        };
    }

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
        // Running the regex test to see if we have a valid request body.
        const regexResult = mapRegex.runTest(req.body);
        if(typeof regexResult === 'string') {
            res.send(400).send(regexResult);
            return;
        }

        // Creating the map in teh database.
        const mapData = regexResult as FullMapDoc;
        const newMapId = await Maps.create({
            name: mapData.name
        });
    
        // Guard clause on failure.
        if(!newMapId) {
            res.status(500).send({
                success: false,
                message: 'Map failed to be created in the database.'
            });
            return;
        }
    
        // Looping through each row to insert in the data base.
        const mapDataResult = (await Promise.all(mapData.rows.map(async (row, i) => {
            const rowResult = await Rows.create({
                name: row.name,
                index: i,
                mapId: newMapId
            });
    
            if(!rowResult) return false;
    
            // Looping through each node to enter in the database.
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
    
        // Getting the new map by its ID and returning the result.
        if(mapDataResult) {
            const newMap = await Maps.getById(newMapId);
            
            if(newMap) res.status(200).send({
                success: true,
                message: nodeListToFullMapDoc(newMap)
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
        // Guard clause to make sure the id is a number.
        if(!req.params.id || isNaN(parseInt(req.params.id))) {
            res.status(400).send('Invalid Id.');
            return;
        }

        // Getting the map from the database.
        const map = await Maps.getById(parseInt(req.params.id));

        // If the map wasn't found, return error.
        if(!map) {
            res.status(400).send('Invalid Id.');
            return;
        }

        // Getting the comment sessions from the database.
        const sessions = await CommentSessions.get({
            mapId: map[0].id
        });

        // And filling the sessions with their comments from the database.
        const fullSessions:FullSessionDoc[] = await Promise.all(
            sessions.map(async (session) => {
                let comments = await Comments.get({
                    commentsessionId: session.id
                });
            
                // Using a table of ids to store the replies
                let commentMap:{
                    [replyId: string]: CommentDoc[]
                } = {}

                // Adding each comment to the table based on its reply id.
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
        // Running a regex rest to make sure its a valid request body.
        const regexResult = mapRegex.runTest(req.body);
        if(typeof regexResult === 'string') {
            res.send(400).send(regexResult);
            return;
        }

        // Getting the previous map to compare against.
        // This will remove data from the previous map once the operations are success, and anything that remains will be deleted.
        const mapData = regexResult as FullMapDoc;
        const previousMap = await Maps.getById(mapData.id);

        // Guard clause if not found.
        if(!previousMap) {
            res.status(400).send({
                success: false,
                message: 'Invalid Id.'
            });
            return;
        }

        // Updating map metadata.
        Maps.update(mapData.id, {
            name: mapData.name
        });

        /**
         * WARNING: this save function is ugly and inefficient. Hoping to come back to this with a fresher mind.
         * Comparing a joined SQL table to a nested object to find which SQL rows to add, update and delete was brutal.
         * This really should have just been done with noSQL.
         */

        // Looping through each node and row to see what query needs to be performed.
        const updateResult = (await Promise.all(mapData.rows.map(async (row) => {
            let rowId = row.id;

            // If it has an id of -1, that means it's new and needs to be inserted.
            if(rowId === -1) {
                const newRowId = await Rows.create({
                    name: row.name,
                    index: row.index,
                    mapId: mapData.id
                });

                if(newRowId) rowId = newRowId;
                else return false;
            }
            // Otherwise if it does have an id, it needs to be updated.
            else {
                const result = await Rows.update(rowId, {
                    name: row.name,
                    index: row.index,
                    mapId: mapData.id
                });

                if(!result) return false;

                // Then if the previous row was empty, it needs to be removed from the previousMap object, as its nodes won't do so.
                const previousRowIndex = previousMap.findIndex(mapItem => mapItem.rowId === rowId);
                if(previousRowIndex !== -1 && previousMap[previousRowIndex].nodeId === null) {
                    previousMap.splice(previousRowIndex, 1);
                }
            }        

            // Now looping through the nodes.
            return (await Promise.all(row.nodes.map(async (node) => {
                // If its id is -1, it's a new node and needs to be inserted.
                if(node.id === -1) {
                    return (await Nodes.create({
                        name: node.name,
                        index: node.index,
                        rowId: rowId,
                        gallery: node.gallery,
                        htmlContent: node.htmlContent
                    }));
                }
                // Otherwise if it has an id, then it needs to be updated.
                else {
                    // Removing it from the previous map so it isn't deleted.
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

        // Now going through each remaining node on the previous map and removing it.
        const deleteResult = (await Promise.all(previousMap.map(async (mapItem) => {
            // If it has a node id, we can remove the node.
            if(mapItem.nodeId) {
                // If we can't find the row, that means the whole row has been delete, and we must delete both the node and row from the db.
                if(mapItem.rowId && mapData.rows.findIndex(row => row.id === mapItem.rowId) === -1) {
                    return (await Nodes.delete(mapItem.nodeId)) && (await Rows.delete(mapItem.rowId));
                }
                // Otherwise just delete the node.
                else {
                    return (await Nodes.delete(mapItem.nodeId));
                }
            }
            // Otherwise that means it's an empty row, and just delete the row.
            else {
                if(mapItem.rowId) {
                    return (await Rows.delete(mapItem.rowId));
                }
            }
        }))).every(result => result);

        // Sending the result.
        res.status(200).send({
            success: updateResult && deleteResult,
            message: updateResult && deleteResult ? 'Successfully saved!' : 'Error during save.'
        });
    })
    .delete(isAuth, async (req, res) => {
        // Guard clause to make sure the id is a number
        if(isNaN(parseInt(req.params.id))) {
            res.status(400).send({
                success: false,
                message: 'Invalid id.'
            });
            return;
        }

        // Making the DELETE query on the Maps object.
        const result = await Maps.delete(parseInt(req.params.id));

        // Returning the result.
        if(result) {
            res.status(200).send({
                success: true,
                message: true
            });
        }
        else {
            res.status(400).send({
                success: false,
                message: 'Invalid id.'
            });
        }
    })

/**
 * Creating a socket.io connection to post and recieve comments.
 */
io.on("connect", (socket) => {
    /**
     * Socket for posting a new comment
     */
    socket.on("postComment", async (requestData) => {
        const newComment = await createComment(requestData);

        if(typeof newComment === 'string') socket.emit("recieveComment", newComment);
        else io.emit("recieveComment", newComment);
    });

    /**
     * Socket for saving a new session
     */
    socket.on("saveSession", async (requestData) => {
        const newSession = await editSession(requestData);

        if(typeof newSession === 'string') socket.emit("recieveSession", newSession);
        else io.emit("recieveSession", newSession);
    });

    /**
     * Socket for deleting sesions.
     */
    socket.on("deleteSession", async (requestData) => {
        if(typeof requestData !== 'number') {
            socket.emit("recieveDeleteSession", 'Comment session id must be a number.');
            return;
        }

        const deleteResult = await CommentSessions.delete(requestData);
        if(deleteResult) io.emit("recieveDeleteSession", requestData);
        else socket.emit("recieveDeleteSession", 'Invalid comment session id.');
    })
});

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const commentRegex = new RegexTester({
    content: textRegex,
    x: numberRegex,
    y: numberRegex,
    userId: numberRegex,
    commentsessionId: numberRegex,
    replyId: numberRegex
});

const sessionRegex = new RegexTester({
    id: idRegex,
    mapId: numberRegex,
    name: textRegex,
    start: dateRegex,
    expires: dateRegex,
});

/**
 * Function to create a comment from a Socket.io request.
 * @param requestData The request recieved in socket.io
 * @returns The new comment object that was just created
 */
async function createComment(requestData:any) {
    // Running the regex test to make sure its valid data.
    const regexResult = commentRegex.runTest(requestData);
    if(typeof regexResult === 'string') {
        return regexResult;
    }
    // Creating the comment in the db.
    const createResult = await Comments.create(requestData as CommentType);

    // Returning the results.
    if(!createResult) {
        return 'Comment failed to be inserted into the database';
    }

    const newComment = await Comments.getById(createResult);
    return newComment ? newComment : 'Comment failed to be retrieved from the database';
}

/**
 * A function to edit a session from a socket.io request.
 * @param requestData The request from socket.io.
 * @returns The new session object just editted.
 */
async function editSession(requestData: any) {
    // Running a regex test to make sure the data is valid.
    const regexResult = sessionRegex.runTest(requestData);
    if(typeof regexResult === 'string') {
        return regexResult;
    }

    // If the session's id is -1, that means it's a new session and must be created in the db.
    if(regexResult.id === -1) {
        // Creating in db.
        const createResult = await CommentSessions.create({
            mapId: regexResult.mapId,
            name: regexResult.name,
            start: regexResult.start,
            expires: regexResult.expires,
        });
        
        // Returning the result.
        if(!createResult) return 'Failed to create comment session.';
        const getResult = await CommentSessions.getById(createResult);
        return getResult ? getResult : 'Failed to retrieve new comment session.'
    }
    // Otherwise if it has an id, that means it must be updated.
    else {
        // Updating in db.
        const updateResult = await CommentSessions.update(regexResult.id, {
            mapId: regexResult.mapId,
            name: regexResult.name,
            start: regexResult.start,
            expires: regexResult.expires,
        });

        // Returning the result.
        if(!updateResult) return 'Failed to update comment session.';
        const getResult = await CommentSessions.getById(regexResult.id);
        return getResult ? getResult : 'Failed to retrieve updated comment session.'
    }
}

export default map;