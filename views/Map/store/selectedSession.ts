import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * A redux slice representing which comment session is currently being viewed.
 */
export const selectedSessionSlice = createSlice({
    name: 'selectedSession',
    initialState: 0 as number,
    reducers: {
        /**
         * A reducer function to set the selected comment session to view with.
         * @param action The index of the comment session to set.
         */
        setSelectedSession: (state, action:PayloadAction<number>) => {
            return action.payload;
        },

        /**
         * A reducer function to deselect all comment sessions.
         */
        removeSelectedSession: (state) => {
            return -1;
        }
    }
});

export const { setSelectedSession, removeSelectedSession } = selectedSessionSlice.actions;