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
import NodesToTags from '../models/nodesToTags';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * Some regex strings so I don't have to repeat them.
 */
export const regexStrings = {
    text: /^[\d\w\s!@#$%^&*()_+-=,.\/;'<>?:"]{1,2000}/,
    number: /^[0-9]{1,6}/,
    id: /^[\-0-9]{1,6}/,
    date: /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}\ [0-9]{1,2}:[0-9]{1,2}:[0-9]{2}/,
    html:/^(<(li|p|h3|ul|ol|span|strong|em|sub|sup|br|u|s|a|img|iframe)( ?(style|class)=\\?"[\w|\s|\d\-:;]+\\?")*>|[\w\s\d.,!@#$%^&*()\-_+\"\';:,.|\\\/?=<>]*|<\/(p|h3||li|ul|ol|span|strong|em|sub|sup|br|u|s|a|img|iframe)>)+/,
    image: /^\/public\/assets\/[0-9]{1,10}.(jpg|jpeg|png|gif|webp|svg)|^$/
};

/**
 * A utility class to test the incoming request objects against an object of regex.
 * See utils/regexTester.ts for more info.
 */
const mapRegex = new RegexTester({
    name: regexStrings.text,
    id: regexStrings.id,
    tags: {
        id: regexStrings.id,
        name: regexStrings.text,
        mapId: regexStrings.id
    },
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
            thumbnail: regexStrings.image,
            htmlContent: regexStrings.html,
            action: /^(filter|content)$/,
            filter: /^[\-0-9]{1,6}|null/,
            tags: {
                id: regexStrings.id,
                name: regexStrings.text,
                mapId: regexStrings.id
            }
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
                } : undefined,
                originUrl: process.env.originUrl || 'http://localhost:3000'
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

        // Forming the map data into arrays for insertion.
        const newTags: TagDoc[] = mapData.tags;
        const newRows: RowDoc[] = [];
        const newNodes: NodeDoc[] = [];
        const newNodesToTags: NodesToTags[] = [];

        // Creating some hashmaps to link the temporary ids to the newly created ones by the database.
        // This is so all our data has accurate foreign keys.
        let addedDataHashMap: {
            rows: { [tempId: number]: number },
            nodes: { [tempId: number]: number },
            tags: { [tempId: number]: number },
        } = {
            rows: {},
            nodes: {},
            tags: {}
        };

        // Filling in the arrays.
        for(let i = 0; i < mapData.rows.length; i++) {
            newRows.push({
                id: mapData.rows[i].id,
                name: mapData.rows[i].name,
                index: mapData.rows[i].index,
                mapId: newMapId
            });

            for(let j = 0; j < mapData.rows[i].nodes.length; j++) {
                newNodes.push({
                    id: mapData.rows[i].nodes[j].id,
                    name: mapData.rows[i].nodes[j].name,
                    index: mapData.rows[i].nodes[j].index,
                    rowId: mapData.rows[i].nodes[j].rowId,
                    thumbnail: mapData.rows[i].nodes[j].thumbnail,
                    htmlContent: mapData.rows[i].nodes[j].htmlContent,
                    action: mapData.rows[i].nodes[j].action,
                    filter: mapData.rows[i].nodes[j].filter,
                });

                for(let k = 0; k < mapData.rows[i].nodes[j].tags.length; k++) {
                    newNodesToTags.push({
                        tagId: mapData.rows[i].nodes[j].tags[k].id,
                        nodeId: mapData.rows[i].nodes[j].id
                    });
                }
            }
        }

        // Adding the tags to the database.
        if(newTags.length > 0) {
            const firstInsertedTagId = await Tags.create(newTags.map(tag => {
                return {
                    name: tag.name,
                    mapId: newMapId
                }
            }));

            if(!firstInsertedTagId) {
                res.status(500).send({
                    success: false,
                    message: 'Tags failed to be created in the database.'
                });
                return;
            }

            // Now we'll add the tag ids to the hashmap.
            for(let i = 0; i < newTags.length; i++) {
                addedDataHashMap.tags = {...addedDataHashMap.tags,
                    [newTags[i].id]: firstInsertedTagId + i
                }
            }
        }
    
        // Inserting the rows into the database.
        if(newRows.length > 0) {
            const firstInsertedRowId = await Rows.create(newRows.map(row => {
                return {
                    index: row.index,
                    mapId: newMapId,
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

            // Now we'll add the row ids to the hashmap.
            for(let i = 0; i < newRows.length; i++) {
                addedDataHashMap.rows = {...addedDataHashMap.rows,
                    [newRows[i].id]: firstInsertedRowId + i
                }
            }
        }

        // Then adding the new nodes.
        if(newNodes.length > 0) {   
            const firstInsertedNodeId = await Nodes.create(newNodes.map((node, i) => {
                return {
                    name: node.name,
                    index: node.index,
                    rowId: node.rowId < 0 ? addedDataHashMap.rows[node.rowId]: node.rowId,
                    thumbnail: node.thumbnail,
                    htmlContent: node.htmlContent,
                    action: node.action,
                    filter: node.filter ? node.filter < 0 ? addedDataHashMap.tags[node.filter] : node.filter : node.filter
                }
            }));

            if(!firstInsertedNodeId) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be created in the database.'
                });
                return;
            }

            // Now we'll add the node ids to the hashmap.
            for(let i = 0; i < newNodes.length; i++) {
                addedDataHashMap.nodes = {...addedDataHashMap.nodes,
                    [newNodes[i].id]: firstInsertedNodeId + i
                }
            }
        }

        // Finally adding the new nodes-to-tags links.
        if(newNodesToTags.length > 0) {   
            const firstInsertedNodeToTagId = await NodesToTags.create(newNodesToTags.map(nodeToTag => {
                return {
                    tagId: nodeToTag.tagId < 0 ? addedDataHashMap.tags[nodeToTag.tagId] : nodeToTag.tagId,
                    nodeId: nodeToTag.nodeId < 0 ? addedDataHashMap.nodes[nodeToTag.nodeId] : nodeToTag.nodeId
                }
            }));

            if(!firstInsertedNodeToTagId) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes-To-Tags links failed to be created in the database.'
                });
                return;
            }
        }
    
        // Returning the new maps ID so the page can redirect.
        res.status(200).send({
            success: true,
            message: newMapId
        });
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
                } : undefined,
                originUrl: process.env.originUrl || 'http://localhost:3000'
            }
        }

        // Serving the react page.
        res.status(200).send(serveHTML('Map', serverProps));
    })
    .post(async (req, res) => {
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

        // Finding out what tags need to be added, deleted, and updated.
        const edits = compareMaps(previousMap, mapData);

        // Creating some hashmaps to link the temporary ids to the newly created ones by the database.
        // This is so all our data has accurate foreign keys.
        let addedDataHashMap: {
            rows: { [tempId: number]: number },
            nodes: { [tempId: number]: number },
            tags: { [tempId: number]: number },
        } = {
            rows: {},
            nodes: {},
            tags: {}
        };

        // First we'll create the new data to fill the hashmaps.
        // The ids that are returned by MySQL will only be the first one that was inserted.

        // First doing tags.
        if(edits.tags.add.length > 0) {
            const firstInsertedTagId = await Tags.create(edits.tags.add.map(tag => {
                return {
                    name: tag.name,
                    mapId: tag.mapId
                }
            }));

            if(!firstInsertedTagId) {
                res.status(500).send({
                    success: false,
                    message: 'Tags failed to be created in the database.'
                });
                return;
            }

            // Now we'll add the tag ids to the hashmap.
            for(let i = 0; i < edits.tags.add.length; i++) {
                addedDataHashMap.tags = {...addedDataHashMap.tags,
                    [edits.tags.add[i].id]: firstInsertedTagId + i
                }
            }
        }

        // Moving on to adding the rows.
        if(edits.rows.add.length > 0) {
            const firstInsertedRowId = await Rows.create(edits.rows.add.map(row => {
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

            // Now we'll add the row ids to the hashmap.
            for(let i = 0; i < edits.rows.add.length; i++) {
                addedDataHashMap.rows = {...addedDataHashMap.rows,
                    [edits.rows.add[i].id]: firstInsertedRowId + i
                }
            }
        }

        // Then adding the new nodes.
        if(edits.nodes.add.length > 0) {   
            const firstInsertedNodeId = await Nodes.create(edits.nodes.add.map((node, i) => {
                return {
                    name: node.name,
                    index: node.index,
                    rowId: node.rowId < 0 ? addedDataHashMap.rows[node.rowId]: node.rowId,
                    thumbnail: node.thumbnail,
                    htmlContent: node.htmlContent,
                    action: node.action,
                    filter: node.filter ? node.filter < 0 ? addedDataHashMap.tags[node.filter] : node.filter : node.filter
                }
            }));

            if(!firstInsertedNodeId) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be created in the database.'
                });
                return;
            }

            // Now we'll add the node ids to the hashmap.
            for(let i = 0; i < edits.nodes.add.length; i++) {
                addedDataHashMap.nodes = {...addedDataHashMap.nodes,
                    [edits.nodes.add[i].id]: firstInsertedNodeId + i
                }
            }
        }

        // Finally adding the new nodes-to-tags links.
        if(edits.nodesToTags.add.length > 0) {   
            const firstInsertedNodeId = await NodesToTags.create(edits.nodesToTags.add.map(nodeToTag => {
                return {
                    tagId: nodeToTag.tagId < 0 ? addedDataHashMap.tags[nodeToTag.tagId] : nodeToTag.tagId,
                    nodeId: nodeToTag.nodeId < 0 ? addedDataHashMap.nodes[nodeToTag.nodeId] : nodeToTag.nodeId
                }
            }));

            if(!firstInsertedNodeId) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes-To-Tags links failed to be created in the database.'
                });
                return;
            }
        }

        // Updating previous tags
        if(edits.tags.update.length > 0) {
            if(!(await Promise.all(edits.tags.update.map(async tag => {
                return await Tags.update(tag.id, tag);
            }))).every(rowSuccess => rowSuccess)) {
                res.status(500).send({
                    success: false,
                    message: 'Tags failed to be updated in the database.'
                });
                return;
            }
        }

        // Updating previous rows
        if(edits.rows.update.length > 0) {
            if(!(await Promise.all(edits.rows.update.map(async row => {
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
        if(edits.nodes.update.length > 0) {
            if(!(await Promise.all(edits.nodes.update.map(async node => {
                return await Nodes.update(node.id, {...node,
                    rowId: node.rowId < 0 ? addedDataHashMap.rows[node.rowId]: node.rowId
                });
            }))).every(nodeSuccess => nodeSuccess)) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be updated in the database.'
                });
                return;
            }
        }

        // Deleteing previous tags
        if(edits.tags.delete.length > 0) {
            if(!(await Tags.delete(edits.tags.delete.map(tag => tag.id)))) {
                res.status(500).send({
                    success: false,
                    message: 'Tags failed to be deleted in the database.'
                });
                return;
            }
        }

        // Deleteing previous rows
        if(edits.rows.delete.length > 0) {
            if(!(await Rows.delete(edits.rows.delete.map(row => row.id)))) {
                res.status(500).send({
                    success: false,
                    message: 'Rows failed to be deleted in the database.'
                });
                return;
            }
        }

        // Deleteing previous nodes
        if(edits.nodes.delete.length > 0) {
            if(!(await Nodes.delete(edits.nodes.delete.map(node => node.id)))) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes failed to be deleted in the database.'
                });
                return;
            }
        }

        // Deleteing previous nodes-to-tags links
        if(edits.nodesToTags.delete.length > 0) {
            if(!(await NodesToTags.delete(edits.nodesToTags.delete))) {
                res.status(500).send({
                    success: false,
                    message: 'Nodes-To-Tags links failed to be deleted in the database.'
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
            message: 'Successfully Saved!'
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
 * @returns An object containing all the data that needs to be added, updated, and deleted from the database.
 */
function compareMaps(previousMap:FullMapDoc, currentMap:FullMapDoc) {
    const returnObject: {
        rows: {add: RowDoc[], update: RowDoc[], delete: RowDoc[]}
        nodes: {add: NodeDoc[], update: NodeDoc[], delete: NodeDoc[]}
        nodesToTags: {add: NodesToTags[], delete: NodesToTags[]}
        tags: {add: TagDoc[], update: TagDoc[], delete: TagDoc[]}
    } = {
        rows: {
            add: [],
            update: [],
            delete: []
        },
        nodes: {
            add: [],
            update: [],
            delete: []
        },
        nodesToTags: {
            add: [],
            delete: []
        },
        tags: {
            add: [],
            update: [],
            delete: []
        }
    }

    // Creating arrays of all the previous data types to determine which ones needs to be removed.
    const previousRows: RowDoc[] = [];
    const previousNodes: NodeDoc[] = [];
    const previousNodesToTags: NodesToTags[] = [];
    const previousTags: TagDoc[] = [...previousMap.tags];

    // Looping through all the nodes and filling in the previous arrays.
    for(let i = 0; i < previousMap.rows.length; i++) {
        // Only pushing the row and not the nodes.
        previousRows.push({
            id: previousMap.rows[i].id,
            name: previousMap.rows[i].name,
            index: previousMap.rows[i].index,
            mapId: previousMap.rows[i].mapId,
        });

        for(let j = 0; j < previousMap.rows[i].nodes.length; j++) {
            // Only pushing the node and not the tags.
            previousNodes.push({
                id: previousMap.rows[i].nodes[j].id,
                name: previousMap.rows[i].nodes[j].name,
                index: previousMap.rows[i].nodes[j].index,
                rowId: previousMap.rows[i].nodes[j].rowId,
                thumbnail: previousMap.rows[i].nodes[j].thumbnail,
                htmlContent: previousMap.rows[i].nodes[j].htmlContent,
                action: previousMap.rows[i].nodes[j].action,
                filter: previousMap.rows[i].nodes[j].filter,
            });
            previousNodesToTags.push.apply(previousNodesToTags, previousMap.rows[i].nodes[j].tags.map(tag => {
                return {
                    nodeId: previousMap.rows[i].nodes[j].id,
                    tagId: tag.id
                }
            }))
        }
    }

    // Looping through each tag to see if it needs to be added or updated.
    for(let i = 0; i < currentMap.tags.length; i++) {
        // If it has an id that's less than 0, that means it's not in the database yet.
        if(currentMap.tags[i].id < 0) {
            returnObject.tags.add.push(currentMap.tags[i]);
        }
        // If the tag was found in the previous ones, then it needs an update.
        else {
            for(let j = 0; j < previousTags.length; j++) {
                if(currentMap.tags[i].id === previousTags[j].id) {
                    returnObject.tags.update.push(currentMap.tags[i]);
                    previousTags.splice(j, 1);
                    break;
                }
            }
        }
    }

    // Looping through each row to see if it needs to be added or updated.
    for(let i = 0; i < currentMap.rows.length; i++) {
        // If it has an id that's less than 0, that means it's not in the database yet.
        if(currentMap.rows[i].id < 0) {
            // Only pushing the row and not the nodes.
            returnObject.rows.add.push({
                id: currentMap.rows[i].id,
                name: currentMap.rows[i].name,
                index: currentMap.rows[i].index,
                mapId: currentMap.rows[i].mapId,
            });
        }
        else {
            // If the row was found in the previous ones, then it needs an update.
            for(let j = 0; j < previousRows.length; j++) {
                if(currentMap.rows[i].id === previousRows[j].id) {
                    // Only pushing the row and not the nodes.
                    returnObject.rows.update.push({
                        id: currentMap.rows[i].id,
                        name: currentMap.rows[i].name,
                        index: currentMap.rows[i].index,
                        mapId: currentMap.rows[i].mapId,
                    });
                    previousRows.splice(j, 1);
                    break;
                }
            }
        }

        // Now looping through each node to see if it needs to be added or updated.
        for(let j = 0; j < currentMap.rows[i].nodes.length; j++) {
            // If it has an id that's less than 0, that means it's not in the database yet.
            if(currentMap.rows[i].nodes[j].id < 0) {
                returnObject.nodes.add.push({
                    id: currentMap.rows[i].nodes[j].id,
                    name: currentMap.rows[i].nodes[j].name,
                    index: currentMap.rows[i].nodes[j].index,
                    rowId: currentMap.rows[i].nodes[j].rowId,
                    thumbnail: currentMap.rows[i].nodes[j].thumbnail,
                    htmlContent: currentMap.rows[i].nodes[j].htmlContent,
                    action: currentMap.rows[i].nodes[j].action,
                    filter: currentMap.rows[i].nodes[j].filter,
                });
            }
            else {
                // If the new row was found in the previous ones, then it needs an update.
                for(let k = 0; k < previousNodes.length; k++) {
                    if(currentMap.rows[i].nodes[j].id === previousNodes[k].id) {
                        returnObject.nodes.update.push({
                            id: currentMap.rows[i].nodes[j].id,
                            name: currentMap.rows[i].nodes[j].name,
                            index: currentMap.rows[i].nodes[j].index,
                            rowId: currentMap.rows[i].nodes[j].rowId,
                            thumbnail: currentMap.rows[i].nodes[j].thumbnail,
                            htmlContent: currentMap.rows[i].nodes[j].htmlContent,
                            action: currentMap.rows[i].nodes[j].action,
                            filter: currentMap.rows[i].nodes[j].filter,
                        });
                        previousNodes.splice(k, 1);
                        break;
                    }
                }
            }

            // Now moving on to the nodes-to-tags links.
            // We only need to see if it still exists, since otherwise it will always be added.
            for(let k = 0; k < currentMap.rows[i].nodes[j].tags.length; k++) {
                let nodeToTagWasFound = false;

                for(let l = 0; l < previousNodesToTags.length; l++) {
                    if(
                        previousNodesToTags[l].tagId === currentMap.rows[i].nodes[j].tags[k].id && 
                        previousNodesToTags[l].nodeId === currentMap.rows[i].nodes[j].id
                    ) {
                        nodeToTagWasFound = true;
                        previousNodesToTags.splice(l, 1);
                        break;
                    }
                }

                if(!nodeToTagWasFound) {
                    returnObject.nodesToTags.add.push({
                        tagId: currentMap.rows[i].nodes[j].tags[k].id,
                        nodeId: currentMap.rows[i].nodes[j].id
                    });
                }
            } 
        }
    }

    // Any remaing data that was not included in the new ones needs to be deleted.
    returnObject.rows.delete = previousRows;
    returnObject.nodes.delete = previousNodes;
    returnObject.nodesToTags.delete = previousNodesToTags;
    returnObject.tags.delete = previousTags;

    return returnObject;
}