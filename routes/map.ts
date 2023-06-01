import express from 'express';
import serveHTML from '../utils/serveHTML';
import { isAuth } from '../utils/authentication';
import index from '.';

/**
 * Setting up a router for our index route.
 */
const map = express.Router();

/**
 * Setting up a GET endpoint to serve the map page React file.
 */
map.route('/:id')
    .get(isAuth, (req, res) => {

        const serverProps:ServerPropsType = {
            mapPageProps: {
                map: {
                    name: 'The best map',
                    id: 1,
                    rows: [{
                        id: 1,
                        name: 'Paintings',
                        index: 0,
                        mapId: 1,
                        nodes: [{
                            id: 1,
                            name: 'Node 1',
                            index: 0,
                            gallery: ['https://placehold.co/600x400'],
                            htmlContent: '',
                            rowId: 1
                        },
                        {
                            id: 2,
                            name: 'Node 2',
                            index: 1,
                            gallery: ['https://placehold.co/600x400'],
                            htmlContent: '',
                            rowId: 1
                        },
                        {
                            id: 3,
                            name: 'Node 3',
                            index: 2,
                            gallery: ['https://placehold.co/600x400'],
                            htmlContent: '',
                            rowId: 1
                        },]
                    }, {
                        id: 2,
                        name: 'Pigment',
                        index: 0,
                        mapId: 1,
                        nodes: [{
                            id: 4,
                            name: 'Red Ochre',
                            index: 0,
                            gallery: ['https://placehold.co/600x400'],
                            htmlContent: '',
                            rowId: 2
                        }]
                    }, {
                        id: 3,
                        name: 'Process',
                        index: 0,
                        mapId: 1,
                        nodes: [{
                            id: 5,
                            name: 'Powder',
                            index: 0,
                            gallery: ['https://placehold.co/600x400'],
                            htmlContent: '',
                            rowId: 3
                        }]
                    }]
                },
                sessions: [{
                    id: 1,
                    start: Date.now().toString(),
                    expires: (Date.now() + 10000).toString(),
                    mapId: 1,
                    comments: []
                }, {
                    id: 2,
                    start: (Date.now() - 20000).toString(),
                    expires: (Date.now() - 10000).toString(),
                    mapId: 1,
                    comments: []
                }]
            }
        }

        res.status(200).send(serveHTML('Map', serverProps));
    });

export default map;