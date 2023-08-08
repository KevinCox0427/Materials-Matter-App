import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const mapSlice = createSlice({
    name: 'map',
    initialState: window.ServerProps.mapPageProps!.map as FullMapDoc,
    reducers: {
        changeMapName: (state, action: PayloadAction<string>) => {
            state = {...state,
                name: action.payload
            }
        },

        insertNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            // Inserting node
            state.rows[action.payload.rowIndex].nodes.splice(action.payload.nodeIndex, 0, {
                id: -1,
                rowId: state.rows[action.payload.rowIndex].id,
                name: 'New Node',
                index: action.payload.nodeIndex,
                gallery: [],
                htmlContent: '',
                tags: [],
                action: 'content',
                filter: null    
            });

            // Updating the nodes' indeces since they will be wrong
            state.rows[action.payload.rowIndex].nodes = state.rows[action.payload.rowIndex].nodes.map((node, i) => {
                return {...node,
                    index: i
                }
            });
        },

        moveNode: (state, action: PayloadAction<{
            nodeData: NodeDoc,
            fromRowIndex: number,
            fromNodeIndex: number,
            toRowIndex: number,
            toNodeIndex: number
        }>) => {
            // Removing node
            state.rows[action.payload.fromRowIndex].nodes.splice(action.payload.fromNodeIndex, 1);
            // Inserting the new node.
            state.rows[action.payload.toRowIndex].nodes.splice(action.payload.toNodeIndex, 0, action.payload.nodeData);

            // Updating the nodes' indeces since they will be wrong
            state.rows[action.payload.fromRowIndex].nodes = state.rows[action.payload.fromRowIndex].nodes.map((node, i) => {
                return {...node,
                    index: i
                }
            });
            state.rows[action.payload.toRowIndex].nodes = state.rows[action.payload.toRowIndex].nodes.map((node, i) => {
                return {...node,
                    index: i
                }
            });
        },

        insertRow: (state, action: PayloadAction<number>) => {
            state.rows.splice(action.payload, 0, {
                id: -1,
                mapId: state.id,
                index: action.payload,
                name: 'New Row',
                nodes: []
            });

            // Updating row indeces after splice
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },
    }
});

export const { changeMapName, insertNode, moveNode, insertRow } = mapSlice.actions;