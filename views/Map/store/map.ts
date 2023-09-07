import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Extending the type to keep track of the incremental ids in the negative direction when making new content.
 */
interface EditableFullMapDoc extends FullMapDoc {
    idCounters: {
        row: number,
        node: number,
        tag: number
    }
}

/**
 * A redux slice representing the current state of all of the rows, nodes, and tags for the map that's currently being editted.
 */
export const mapSlice = createSlice({
    name: 'map',
    initialState: {...window.ServerProps.mapPageProps!.map,
        idCounters: {
            row: -1,
            node: -1,
            tag: -1
        }
    } as EditableFullMapDoc,
    reducers: {
        /**
         * A reducer function to change the name of the map.
         * @param action The name to overwrite with.
         */
        changeMapName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },

        /**
         * A reducer function to insert a row on the map at a given index.
         * @param action The index to add the row after.
         */
        insertRow: (state, action: PayloadAction<number>) => {
            state.rows.splice(action.payload, 0, {
                id: state.idCounters.row,
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

            // Updating the incremental ids
            state.idCounters.row--;
        },

        /**
         * A reducer function to change the name of a row at given index.
         * @param rowIndex The index of the row that's being edited.
         * @param name The name to overwrite with. 
         */
        changeRowName: (state, action: PayloadAction<{
            rowIndex: number,
            name: string
        }>) => {
            state.rows[action.payload.rowIndex].name = action.payload.name
        },

        /**
         * A reducer function to move a row up an index.
         * @param action The index of the row being moved.
         */
        moveRowUp: (state, action: PayloadAction<number>) => {
            if(action.payload === 0) return state;
            // Removing row.
            const currentRow = state.rows.splice(action.payload, 1)[0];
            // Inserting row.
            state.rows.splice(action.payload - 1, 0, currentRow);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },

        /**
         * A reducer function to move a row down on an index.
         * @param action The index of the row being moved
         */
        moveRowDown: (state, action: PayloadAction<number>) => {
            if(action.payload >= state.rows.length - 1) return state;
            // Removing row.
            const currentRow = state.rows.splice(action.payload, 1)[0];
            // Inserting row.
            state.rows.splice(action.payload + 1, 0, currentRow);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },

        /**
         * A reducer function to remove a row at a specified index.
         * @param action The index of the row being removed.
         */
        removeRow: (state, action: PayloadAction<number>) => {
            state.rows.splice(action.payload, 1);
            // Reassigning the row's indeces since they will be wrong
            state.rows = state.rows.map((row, i) => {
                return {...row,
                    index: i
                }
            });
        },

        /**
         * A reducer function to insert a new node at a specified index.
         * @param rowIndex The index of the row to insert the node into.
         * @param nodeIndex The index of the node to insert the node into.
         */
        insertNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            // Inserting node
            state.rows[action.payload.rowIndex].nodes.splice(action.payload.nodeIndex, 0, {
                id: state.idCounters.node,
                rowId: state.rows[action.payload.rowIndex].id,
                name: 'New Node',
                index: action.payload.nodeIndex,
                thumbnail: '',
                htmlContent: '',
                action: 'content',
                filter: null,
                tags: []
            });

            // Updating the nodes' indeces since they will be wrong
            state.rows[action.payload.rowIndex].nodes = state.rows[action.payload.rowIndex].nodes.map((node, i) => {
                return {...node,
                    index: i
                }
            });

            // Updating the incremental ids
            state.idCounters.node--;
        },

        /**
         * A reducer function to move a node across the map.
         * @param fromRowIndex The index of the row that the node's in.
         * @param fromNodeIndex The index of the node.
         * @param toRowIndex The destination row index for the node.
         * @param toNodeIndex The destination index of the node.
         */
        moveNode: (state, action: PayloadAction<{
            fromRowIndex: number,
            fromNodeIndex: number,
            toRowIndex: number,
            toNodeIndex: number
        }>) => {
            // Removing node
            const currentNode = state.rows[action.payload.fromRowIndex].nodes.splice(action.payload.fromNodeIndex, 1)[0];
            // Inserting the new node.
            state.rows[action.payload.toRowIndex].nodes.splice(action.payload.toNodeIndex, 0, {...currentNode,
                rowId: state.rows[action.payload.toRowIndex].id
            });

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

        /**
         * A reducer function to remove a node at a given index.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node.
         */
        removeNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            state.rows[action.payload.rowIndex].nodes.splice(action.payload.nodeIndex, 1);
        },

        /**
         * A reducer function to change the name of a specified node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node.
         * @param name The name to overwrite with.
         */
        changeNodeName: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            name: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].name = action.payload.name;
        },

        /**
         * A reducer function to change the content of a specified node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node.
         * @param content The content to overwrite with.
         */
        changeNodeContent: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            content: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].htmlContent = action.payload.content;
        },

        /**
         * A reducer function to change the thumbnail of a specified node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node.
         * @param image The url to overwrite with.
         */
        setNodeThumbnail: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            image: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].thumbnail = action.payload.image;
        },

        /**
         * A reducer function to remove the thumbnail on a specified node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node.
         */
        removeNodeThumbnail: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].thumbnail = '';
        },

        /**
         * A reducer function to add a new tag to the map.
         * @param action The name of the new tag.
         */
        addTag: (state, action: PayloadAction<string>) => {
            state.tags.push({
                id: state.idCounters.tag,
                name: action.payload,
                mapId: state.id
            });

            // Updating the incremental ids
            state.idCounters.tag--;
        },

        /**
         * A reducer function to change the name of a tag.
         * @param tagIndex The index of the tag that's being edited.
         * @param name The name to overwrite with. 
         */
        setTagName: (state, action: PayloadAction<{
            tagIndex: number,
            name: string
        }>) => {
            state.tags[action.payload.tagIndex].name = action.payload.name;
        },

        /**
         * A reducer function to remove a tag at a given index.
         * @param action The index of the tag being removed.
         */
        removeTag: (state, action: PayloadAction<number>) => {
            if(action.payload < 0 || action.payload >= state.tags.length) return state;
            const tag = state.tags.splice(action.payload, 1)[0];

            // Now going through all the nodes to remove this tag from them.
            for(let i = 0; i < state.rows.length; i++) {
                for(let j = 0; j < state.rows[i].nodes.length; j++) {
                    // If this node is filtering with this tag, remove it.
                    if(state.rows[i].nodes[j].filter === tag.id) state.rows[i].nodes[j].filter = null;

                    // Finding the index of the tag in the node's array
                    const tagIndex = state.rows[i].nodes[j].tags.reduce((previousIndex, nodeTag, i) => {
                        if(nodeTag.id === tag.id) return i;
                        else return previousIndex;
                    }, -1);

                    // If found, remove.
                    if(tagIndex > -1) state.rows[i].nodes[j].tags.splice(tagIndex, 1);
                }
            }

        },

        /**
         * A reducer function to add a tag to a node.
         * @param rowIndex The index of the row that the node's in.
         * @param nodeIndex The index of the node in the row.
         * @param tag The tag that's being added. 
         */
        addTagToNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            tag: TagDoc
        }>) => {
            // Getting the index of the tag in the node.
            const tagIndex = state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].tags.reduce((previousIndex, tag, i) => {
                if(tag.id === action.payload.tag.id) return i;
                else return previousIndex;
            }, -1);

            if(tagIndex < 0) {
                state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].tags.push(action.payload.tag);
            }
        },

        /**
         * A reducer function to remove a tag from a node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node in the row.
         * @param tag The Tag that's being removed. 
         */
        removeTagFromNode: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            tag: TagDoc
        }>) => {
            // Getting the index of the tag in the node.
            const tagIndex = state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].tags.reduce((previousIndex, tag, i) => {
                if(tag.id === action.payload.tag.id) return i;
                else return previousIndex;
            }, -1);

            if(tagIndex > -1) {
                state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].tags.splice(tagIndex, 1);
            }
        },

        /**
         * A reducer function to change the action of a node.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node in the row.
         * @param action The action to overwrite with.
         */
        changeNodeAction: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            action: "filter" | "content"
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].action = action.payload.action;
        },

        /**
         * A reducer function to change the tag that a node filters.
         * @param rowIndex The index of the row that the node is in.
         * @param nodeIndex The index of the node in the row.
         * @param tagId The id of the tag to filter with.
         */
        changeNodeFilter: (state, action: PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            tagId: number | null
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].filter = action.payload.tagId;
        }
    }
});

export const { changeMapName, insertRow, changeRowName, removeRow, moveRowDown, moveRowUp, insertNode, moveNode, removeNode, changeNodeContent, changeNodeName, setNodeThumbnail, removeNodeThumbnail, setTagName, addTag, removeTag, addTagToNode, removeTagFromNode, changeNodeAction, changeNodeFilter } = mapSlice.actions;