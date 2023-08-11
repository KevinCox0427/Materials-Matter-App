import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const notificationSlice = createSlice({
    name: 'notification',
    initialState: '' as string,
    reducers: {
        setNotification: (state, action:PayloadAction<string>) => {
            return action.payload;
        }
    }
});

export const { setNotification } = notificationSlice.actions;