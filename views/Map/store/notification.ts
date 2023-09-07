import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * A redux slice representing the notifications that pop up.
 */
export const notificationSlice = createSlice({
    name: 'notification',
    initialState: '' as string,
    reducers: {
        /**
         * A reducer function to set a notificaiton to pop up.
         * @param action The message of the notificaiton.
         */
        setNotification: (state, action:PayloadAction<string>) => {
            return action.payload;
        }
    }
});

export const { setNotification } = notificationSlice.actions;