import express from 'express';
import serveHTML from '../utils/serveHTML';
import Maps from '../models/maps';
import CommentSessions from '../models/commentSessions';
import Comments from '../models/comments';
import RegexTester from '../utils/regexTester';
import Rows from '../models/rows';
import Nodes from '../models/nodes';
import { isAuth } from '../utils/authentication';
import Tags from '../models/tags';

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * Some regex strings so I don't have to repeat them.
 */
export const regexStrings = {
    text: /^[\d\w\s!@#$%^&*()_+-=,.\/;'<>?:"]{1,2000}/,
    number: /^[0-9]{1,5}/,
    id: /^-1|[0-9]{1,5}/,
    date: /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\ [0-9]{1,2}:[0-9]{1,2}:[0-9]{2}/,
    html:/^(<(li|p|h3|ul|ol|span|strong|em|sub|sup|br|u|s|a)( ?(style|class)=\\?"[\w|\s|\d\-:;]+\\?")*>|[\w\s\d.,!@#$%^&*()\-_+\"\';:,.|\\\/?=<>]*|<\/(p|h3||li|ul|ol|span|strong|em|sub|sup|br|u|s|a)>)+/,
    image: new RegExp(`${process.env.awsUrl}[0-9]{1,10}.(jpg|jpeg|png|gif|webp|svg)`)
};

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const mapRegex = new RegexTester({
    name: regexStrings.text,
    id: regexStrings.id,
    tags: regexStrings.text,
    rows: {
        id: regexStrings.id,
        mapId: regexStrings.id,
        name: regexStrings.text,
        index: regexStrings.number,
        nodes: {
            id: regexStrings.id,
            name: regexStrings.text,
            index: regexStrings.number,
            rowId: regexStrings.id,
            gallery: regexStrings.image,
            htmlContent: regexStrings.html,
            action: /^(filter|content)$/,
            tags: regexStrings.text
        }
    }
});

/**
 * Setting up a GET endpoint to serve the map page React file.
 */
map.route('/new')
    .get(async (req, res) => {
        // Loading the server properties to pass to the client.
        const serverProps:ServerPropsType = {
            mapPageProps: {
                map: {
                    id: -1,
                    name: 'New Map',
                    tags: [],
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

        // Serving the react page.
        res.status(200).send(serveHTML('Map', serverProps));
    })
    .post(isAuth, async (req, res) => {
        // Running the regex test to see if we have a valid request body.
        const regexResult = mapRegex.runTest(req.body);
        if(typeof regexResult === 'string') {
            res.status(400).send({
                success: false,
                message: regexResult
            });
            return;
        }

        // Creating the map in the database.
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

        // Creating the tags in the database
        if(! (await Tags.create(mapData.tags.map(tag => {
            return {
                name: tag.name,
                mapId: newMapId
            }
        })))) {
            res.status(500).send({
                success: false,
                message: 'Tags failed to be created in the database.'
            });
            return;
        }
    
        // Inserting the rows into the database.
        if(mapData.rows.length > 0) {   
            if(!(await Rows.create(mapData.rows))) {
                res.status(500).send({
                    success: false,
                    message: 'Rows failed to save in the database.'
                });
                return;
            };
        }

        // Getting the nodes from each row.
        const newNodes:NodeDoc[] = [];
        mapData.rows.forEach(row => {
            newNodes.push.apply(newNodes, row.nodes);
        });

        // Inserting the nodes into the database.
        if(newNodes.length > 0) {
            if(!(await Nodes.create(newNodes))) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to save in the database.'
                });
                return;
            };
        }
    
        // Returning the new maps ID so the page can redirect.
        res.status(200).send({
            success: true,
            message: newMapId
        });
    })

/**
 * A POST route to get map data for debugging
 */
map.post('/props/:id', async (req, res) => {
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
        mapId: map.id
    });

    // And filling the sessions with their comments from the database.
    const fullSessions:FullSessionDoc[] = await Promise.all(
        sessions.map(async (session) => {
            let comments = await Comments.get({
                commentsessionId: session.id
            });
        
            // Using a table of ids to store the replies
            let commentMap: {
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

    // Sending the server properties to pass to the client.
    res.status(200).send({
        mapPageProps: {
            map: map,
            sessions: fullSessions,
            userData: {
                userId: 1,
                firstName: "Kevin",
                lastName: "Cox",
                image: "",
                isAdmin: true
            }
        }
    });
});


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
            mapId: map.id
        });

        // And filling the sessions with their comments from the database.
        const fullSessions:FullSessionDoc[] = await Promise.all(
            sessions.map(async (session) => {
                let comments = await Comments.get({
                    commentsessionId: session.id
                });
            
                // Using a map of ids to store the replies
                // 0 should always exist since that represents comments on the map.
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
                });

                return {...session,
                    comments: commentMap
                }
            })
        );

        // Loading the server properties to pass to the client.
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

        // Serving the react page.
        res.status(200).send(serveHTML('Map', serverProps));
    })
    .post(isAuth, async (req, res) => {
        // Running the regex test to see if we have a valid request body.
        const regexResult = mapRegex.runTest(req.body);
        if(typeof regexResult === 'string') {
            res.status(400).send({
                success: false,
                message: regexResult
            });
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

        // Finding out what rows need to be added, deleted, and updated
        const rowEdits = compareRows(previousMap, mapData);

        // First creating the new rows so their ids will fill and the nodes in the new rows can reference them properly.
        // The id that's returned will only be the first one that was inserted because MySQL is so cool.
        if(rowEdits.add.length > 0) {
            const firstInsertedRowId = await Rows.create(rowEdits.add.map(row => {
                return {
                    index: row.index,
                    mapId: row.mapId,
                    name: row.name
                }
            }));

            if(!firstInsertedRowId) {
                res.status(500).send({
                    success: false,
                    message: 'Rows failed to be created in the database.'
                });
                return;
            }

            // Now we'll update the row data so that the nodes can have proper foreign keys.
            let j = 0;
            for(let i = 0; i < mapData.rows.length; i++) {
                if(mapData.rows[i].id === -1) {
                    mapData.rows[i].id = firstInsertedRowId + j;
                    j++;
                }
            }
        }

        // Finding out what nodes need to be added, deleted, and updated
        const nodeEdits = compareNodes(previousMap, mapData);

        // Then adding the new nodes.
        if(nodeEdits.add.length > 0) {   
            if(!(await Nodes.create(nodeEdits.add.map((node, i) => {
                return {
                    name: node.name,
                    index: node.index,
                    rowId: node.rowId,
                    gallery: node.gallery,
                    htmlContent: node.htmlContent,
                    action: node.action,
                    filter: null
                }
            })))) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be created in the database.'
                });
                return;
            }
        }

        // Updating previous rows
        if(rowEdits.update.length > 0) {
            if(!(await Promise.all(rowEdits.update.map(async (row) => {
                // @ts-ignore
                delete row.nodes;
                return await Rows.update(row.id, row);
            }))).every(rowSuccess => rowSuccess)) {
                res.status(500).send({
                    success: false,
                    message: 'Rows failed to be updated in the database.'
                });
                return;
            }
        }

        // Updating previous nodes
        if(nodeEdits.update.length > 0) {
            if(!(await Promise.all(nodeEdits.update.map(async (node) => {
                return await Nodes.update(node.id, node);
            }))).every(nodeSuccess => nodeSuccess)) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be updated in the database.'
                });
                return;
            }
        }

        // Deleteing previous rows
        if(rowEdits.delete.length > 0) {
            if(!(await Rows.delete(rowEdits.delete.map(row => row.id)))) {
                res.status(500).send({
                    success: false,
                    message: 'Rows failed to be deleted in the database.'
                });
                return;
            }
        }

        // Deleteing previous nodes
        if(nodeEdits.delete.length > 0) {
            if(!(await Nodes.delete(nodeEdits.delete.map(node => node.id)))) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be deleted in the database.'
                });
                return;
            }
        }

        // Updating map metadata.
        if(! (await Maps.update(mapData.id, {
            name: mapData.name
        }))) {
            res.status(500).send({
                success: false,
                message: 'Map failed to be updated in the database.'
            });
            return;
        }

        res.status(200).send({
            success: true,
            message: 'Successfully saved!'
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
    });

export default map;

/**
 * A function that compares the data of two maps to declare what SQL statements need to be made to reflect the update in the database.
 * @param previousMap The map that is saved in the database.
 * @param currentMap The map that is being updated to the databased.
 * @returns An object containing the row data that needs to be added, updated, and deleted from the database.
 */
function compareRows(previousMap:FullMapDoc, currentMap:FullMapDoc): {add: FullRowDoc[], update: FullRowDoc[], delete: FullRowDoc[]} {
    const returnObject: {add: FullRowDoc[], update: FullRowDoc[], delete: FullRowDoc[]} = {
        add: [],
        update: [],
        delete: []
    }

    // Creating clone of the previous rows since we'll be removing any rows that need to be updated.
    const previousRows = [...previousMap.rows];

    // Looping through each new row to see if it needs to be added or updated.
    for(let i = 0; i < currentMap.rows.length; i++) {
        // If it has an id of -1, that means it's not in the database.
        if(currentMap.rows[i].id === -1) {
            returnObject.add.push(currentMap.rows[i]);
            continue;
        }

        // If the new row was found in the previous ones, then it needs an update.
        for(let j = 0; j < previousRows.length; j++) {
            if(currentMap.rows[i].id === previousRows[j].id) {
                returnObject.update.push(currentMap.rows[i]);
                previousRows.splice(j, 1);
                break;
            }
        }
    }

    // Any remaing rows that were not included in the new ones need to be deleted.
    returnObject.delete = previousRows;
    return returnObject;
}

/**
 * A function that compares the data of two rows to declare what SQL statements need to be made to reflect the update in the database.
 * @param previousRow The row that is saved in the database.
 * @param currentRow The row that is being updated to the databased.
 * @returns An object containing the node data that needs to be added, updated, and deleted from the database.
 */
function compareNodes(previousMap:FullMapDoc, currentMap:FullMapDoc): {add: NodeDoc[], update: NodeDoc[], delete: NodeDoc[]} {
    const returnObject: {add: NodeDoc[], update: NodeDoc[], delete: NodeDoc[]} = {
        add: [],
        update: [],
        delete: []
    }

    // Creating clone of the previous rows since we'll be removing any rows that need to be updated.
    const previousNodes: NodeDoc[] = [];
    for(let i = 0; i < previousMap.rows.length; i++) {
        previousNodes.push.apply(previousNodes, previousMap.rows[i].nodes);
    }

    // Looping through each new node to see if it needs to be added or updated.
    for(let i = 0; i < currentMap.rows.length; i++) {
        for(let j = 0; j < currentMap.rows[i].nodes.length; j++) {
            // Making sure the node has the correct foreign key.
            // This is becuase some rows will start out without an id when they're sent from the client.
            currentMap.rows[i].nodes[j].rowId = currentMap.rows[i].id;

            // If it has an id of -1, that means it's not in the database.
            if(currentMap.rows[i].nodes[j].id === -1) {
                returnObject.add.push(currentMap.rows[i].nodes[j]);
                continue;
            }

            // If the new row was found in the previous ones, then it needs an update.
            for(let k = 0; k < previousNodes.length; k++) {
                if(currentMap.rows[i].nodes[j].id === previousNodes[k].id) {
                    returnObject.update.push(currentMap.rows[i].nodes[j]);
                    previousNodes.splice(k, 1);
                    break;
                }
            }
        }
    }

    // Any remaing rows that were not included in the new ones need to be deleted.
    returnObject.delete = previousNodes;
    return returnObject;
}