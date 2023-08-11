import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const selectedSessionSlice = createSlice({
    name: 'selectedSession',
    initialState: 0 as number,
    reducers: {
        setSelectedSession: (state, action:PayloadAction<number>) => {
            return action.payload;
        },

        removeSelectedSession: (state) => {
            return -1;
        }
    }
});

export const { setSelectedSession, removeSelectedSession } = selectedSessionSlice.actions;