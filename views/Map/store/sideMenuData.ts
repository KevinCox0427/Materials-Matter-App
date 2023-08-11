import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SideMenuData = {
    type: 'node' | 'comment' | 'sessions' | 'tags' | 'closed',
    dataPointer: [number, number]
}

export const sideMenuDataSlice = createSlice({
    name: 'sideMenuData',
    initialState: {
        type: 'closed',
        dataPointer: [0, 0]
    } as SideMenuData,
    reducers: {
        setNode: (state, action:PayloadAction<{
            nodeIndex: number,
            rowIndex: number
        }>) => {
            return {
                type: 'node',
                dataPointer: [action.payload.rowIndex, action.payload.nodeIndex]
            };
        },

        setComment: (state, action:PayloadAction<{
            sessionIndex: number,
            commentIndex: number
        }>) => {
            return {
                type: 'comment',
                dataPointer: [action.payload.sessionIndex, action.payload.commentIndex]
            }
        },

        setSessions: (state) => {
            return {
                type: 'sessions',
                dataPointer: [0, 0]
            }
        },

        setTags: (state) => {
            return {
                type: 'tags',
                dataPointer: [0, 0]
            }
        },

        /**
         * An event handler to close the side menu when a node isn't clicked.
         * @param e The click event.
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