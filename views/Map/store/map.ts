import { createSlice } from "@reduxjs/toolkit";

export const mapSlice = createSlice({
    name: 'map',
    initialState: window.ServerProps.mapPageProps!.map,
    reducers: {
        
    }
});

export default mapSlice.reducer;