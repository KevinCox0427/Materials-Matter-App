import { createSlice } from "@reduxjs/toolkit";

type Notification = string;

export const notificationSlice = createSlice({
    name: 'notification',
    initialState: 0,
    reducers: {
        
    }
});

export default notificationSlice.reducer;