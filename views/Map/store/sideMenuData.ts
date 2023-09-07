import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SideMenuData = {
    type: 'node' | 'comment' | 'sessions' | 'tags' | 'closed',
    dataPointer: [number, number]
}

/**
 * A redux slice representing a pointer to the data currently being edited / viewed in the side menu.
 * The pointer is an array with two integers. Their values will mean something different based on the "type" of data that's in the side menu.
 * 
 * The dataPointer's representation is as follows:
 * 
 * node: [row index in map, node index in row].
 * comment: [session index in map, index of the comment in the 0th array of the session's hashmap].
 * session: doesn't matter, it's ignored as all sessions are shown.
 * tags: doesn't matter, it's ignored as all tags are shown.
 * close: doesn't matter, no data is being shown.
 */
export const sideMenuDataSlice = createSlice({
    name: 'sideMenuData',
    initialState: {
        type: 'closed',
        dataPointer: [0, 0]
    } as SideMenuData,
    reducers: {
        /**
         * A reducer function to open the side menu to edit / view a node.
         * @param nodeIndex The index of the node in the row.
         * @param rowIndex The index of the row in the map.
         */
        setNode: (state, action:PayloadAction<{
            nodeIndex: number,
            rowIndex: number
        }>) => {
            return {
                type: 'node',
                dataPointer: [action.payload.rowIndex, action.payload.nodeIndex]
            };
        },

        /**
         * A reducer function to open the side menu with a comment from the map.
         * @param sessionIndex The index of the session on the map.
         * @param commentsIndex The index of the comment in the 0th array in the hashmap.
         */
        setComment: (state, action: PayloadAction<{
            sessionIndex: number,
            commentIndex: number
        }>) => {
            return {
                type: 'comment',
                dataPointer: [action.payload.sessionIndex, action.payload.commentIndex]
            }
        },

        /**
         * A reducer function to open the side menu to show available sessions.
         */
        setSessions: (state) => {
            return {
                type: 'sessions',
                dataPointer: [0, 0]
            }
        },

        /**
         * A reducer function to open the side menu to show available tags.
         */
        setTags: (state) => {
            return {
                type: 'tags',
                dataPointer: [0, 0]
            }
        },

        /**
         * A reducer function to close the side menu.
         */
        closeSideMenu: (state) => {
            return {
                type: 'closed',
                dataPointer: [0, 0]
            };
        }
    }
});

export const { setNode, setSessions, setComment, setTags, closeSideMenu } = sideMenuDataSlice.actions;