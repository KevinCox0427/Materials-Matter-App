import { createSlice, PayloadAction, Reducer } from '@reduxjs/toolkit';
import { PageLimit } from 'aws-sdk/clients/directoryservice';

type SideMenuData = null | {
    type: 'node' | 'comment' | 'sessions' | 'tags',
    dataPointer: [number, number]
}

const initialState: SideMenuData = null;

export const sideMenuDataSlice = createSlice({
    name: 'sideMenuData',
    initialState: initialState as SideMenuData,
    reducers: {
        setNode: (state, action:PayloadAction<{
            nodeIndex: number,
            rowIndex: number
        }>) => {
            state = {
                type: 'node',
                dataPointer: [action.payload.rowIndex, action.payload.nodeIndex]
            }
        },

        setComment: (state, action:PayloadAction<{
            sessionIndex: number,
            commentIndex: number
        }>) => {
            state = {
                type: 'comment',
                dataPointer: [action.payload.sessionIndex, action.payload.commentIndex]
            }
        },

        setSessions: (state) => {
            state = {
                type: 'sessions',
                dataPointer: [0, 0]
            }
        },

        setTags: (state) => {
            state = {
                type: 'tags',
                dataPointer: [0, 0]
            }
        },

        /**
         * An event handler to close the side menu when a node isn't clicked.
         * @param e The click event.
         */
        closeSideMenu: (state:SideMenuData) => {
            state = null;
        }
    }
});

export const { setNode, setSessions, setComment, setTags, closeSideMenu } = sideMenuDataSlice.actions;