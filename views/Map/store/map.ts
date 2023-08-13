import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const mapSlice = createSlice({
    name: 'map',
    initialState: window.ServerProps.mapPageProps!.map as FullMapDoc,
    reducers: {
        changeMapName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
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

        changeRowName: (state, action: PayloadAction<{
            rowIndex: number,
            name: string
        }>) => {
            state.rows[action.payload.rowIndex].name = action.payload.name
        },

        moveRowUp: (state, action: PayloadAction<{
            rowIndex: number
        }>) => {
            if(action.payload.rowIndex === 0) return state;
            // Removing row.
            const currentRow = state.rows.splice(action.payload.rowIndex, 1)[0];
            // Inserting row.
            state.rows.splice(action.payload.rowIndex - 1, 0, currentRow);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },

        moveRowDown: (state, action: PayloadAction<{
            rowIndex: number
        }>) => {
            if(action.payload.rowIndex >= state.rows.length - 1) return state;
            // Removing row.
            const currentRow = state.rows.splice(action.payload.rowIndex, 1)[0];
            // Inserting row.
            state.rows.splice(action.payload.rowIndex + 1, 0, currentRow);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },

        removeRow: (state, action: PayloadAction<{
            rowIndex: number
        }>) => {
            state.rows.splice(action.payload.rowIndex, 1);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
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
            fromRowIndex: number,
            fromNodeIndex: number,
            toRowIndex: number,
            toNodeIndex: number
        }>) => {
            // Removing node
            const currentNode = state.rows[action.payload.fromRowIndex].nodes.splice(action.payload.fromNodeIndex, 1)[0];
            // Inserting the new node.
            state.rows[action.payload.toRowIndex].nodes.splice(action.payload.toNodeIndex, 0, currentNode);

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

        removeNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            state.rows[action.payload.rowIndex].nodes.splice(action.payload.nodeIndex, 1);
        },

        changeNodeName: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            name: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].name = action.payload.name;
        },

        changeNodeContent: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            content: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].htmlContent = action.payload.content;
        },

        addImageToNode: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            image: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.push(action.payload.image);
        },

        removeImageFromNode: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            imageIndex: number
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.splice(action.payload.imageIndex, 1);
        },

        moveImageUp: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            imageIndex: number
        }>) => {
            if(action.payload.imageIndex <= 0) return state;
            // Removing image
            const currentImage = state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.splice(action.payload.imageIndex, 1)[0];
            // Inserting image up an index.
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.splice(action.payload.imageIndex - 1, 0, currentImage);
        },

        moveImageDown: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            imageIndex: number
        }>) => {
            if(action.payload.imageIndex >= state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.length - 1) return state;
            // Removing image
            const currentImage = state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.splice(action.payload.imageIndex, 1)[0];
            // Inserting image down an index.
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].gallery.splice(action.payload.imageIndex + 1, 0, currentImage);
        },

        setTagName: (state, action: PayloadAction<{
            tagIndex: number,
            name: string
        }>) => {
            state.tags[action.payload.tagIndex].name = action.payload.name;
        },

        addTag: (state, action: PayloadAction<{
            name: string,
            mapId: number
        }>) => {
            state.tags.push({
                id: -1,
                name: action.payload.name,
                mapId: action.payload.mapId,
                nodeIds: []
            })
        },

        removeTag: (state, action: PayloadAction<number>) => {
            if(action.payload < 0 || action.payload >= state.tags.length) return state;
            state.tags.splice(action.payload, 1);
        },

        addNodeToTag: (state, action: PayloadAction<{
            nodeId: number,
            tagIndex: number
        }>) => {
            if(!state.tags[action.payload.tagIndex].nodeIds.includes(action.payload.nodeId)) {
                state.tags[action.payload.tagIndex].nodeIds.push(action.payload.nodeId);
            }
        },

        removeNodeFromTag: (state, action: PayloadAction<{
            nodeId: number,
            tagIndex: number
        }>) => {
            const nodeIndex = state.tags[action.payload.tagIndex].nodeIds.indexOf(action.payload.nodeId);
            if(nodeIndex !== -1) {
                state.tags[action.payload.tagIndex].nodeIds.splice(nodeIndex, 1);
            }
        },

        changeNodeAction: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            action: "filter" | "content"
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].action = action.payload.action;
        },

        changeNodeFilter: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            tagId: number | null
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].filter = action.payload.tagId;
        }
    }
});

export const { changeMapName, insertRow, changeRowName, removeRow, moveRowDown, moveRowUp, insertNode, moveNode, removeNode, changeNodeContent, changeNodeName, addImageToNode, moveImageDown, moveImageUp, removeImageFromNode, setTagName, addTag, removeTag, addNodeToTag, removeNodeFromTag, changeNodeAction, changeNodeFilter } = mapSlice.actions;