import { createSlice } from "@reduxjs/toolkit";

export const sessionsSlice = createSlice({
    name: 'sessions',
    initialState: window.ServerProps.mapPageProps!.sessions,
    reducers: {
        
    }
});

export default sessionsSlice.reducer;