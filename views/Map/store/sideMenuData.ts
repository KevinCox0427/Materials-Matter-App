import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PageLimit } from 'aws-sdk/clients/directoryservice';

type SideMenuData = null | {
    type: 'node' | 'comment' | 'sessions' | 'tags',
    dataPointer: [number, number]
}

export const sideMenuDataSlice = createSlice({
    name: 'sideMenuData',
    initialState: null,
    reducers: {
        setNode: (state:SideMenuData, action:PayloadAction<[number, number]>) => {
            state = {
                type: 'node',
                dataPointer: action.payload
            }
        },

        setComment: (state:SideMenuData, action:PayloadAction<[number, number]>) => {
            state = {
                type: 'comment',
                dataPointer: action.payload
            }
        },

        setSessions: (state:SideMenuData) => {
            state = {
                type: 'sessions',
                dataPointer: [0, 0]
            }
        },

        setTags: (state:SideMenuData) => {
            state = {
                type: 'tags',
                dataPointer: [0, 0]
            }
        },

        /**
         * An event handler to close the side menu when a node isn't clicked.
         * @param e The click event.
         */
        closeSideMenu: (state:SideMenuData, action:PayloadAction<React.MouseEvent | React.TouchEvent>) => {
            if((action.payload.target as HTMLElement).classList.contains('Node') || (action.payload.target as HTMLElement).classList.contains('Comment')) return;
            state = null;
        }
    }
});

export default sideMenuDataSlice.reducer;
export const { setNode, setSessions, setComment, setTags } = sideMenuDataSlice.actions;