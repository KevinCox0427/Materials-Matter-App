import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const notificationSlice = createSlice({
    name: 'notification',
    initialState: '',
    reducers: {
        setNotification: (state, action:PayloadAction<string>) => {
            state = action.payload;
        }
    }
});

export const { setNotification } = notificationSlice.actions;