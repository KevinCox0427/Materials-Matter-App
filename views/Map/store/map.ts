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
        changeMapName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },

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

        setNodeThumbnail: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number,
            image: string
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].thumbnail = action.payload.image;
        },

        removeNodeThumbnail: (state, action:PayloadAction<{
            rowIndex: number,
            nodeIndex: number
        }>) => {
            state.rows[action.payload.rowIndex].nodes[action.payload.nodeIndex].thumbnail = '';
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
                id: state.idCounters.tag,
                name: action.payload.name,
                mapId: action.payload.mapId
            });

            // Updating the incremental ids
            state.idCounters.tag--;
        },

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

export const { changeMapName, insertRow, changeRowName, removeRow, moveRowDown, moveRowUp, insertNode, moveNode, removeNode, changeNodeContent, changeNodeName, setNodeThumbnail, removeNodeThumbnail, setTagName, addTag, removeTag, addTagToNode, removeTagFromNode, changeNodeAction, changeNodeFilter } = mapSlice.actions;