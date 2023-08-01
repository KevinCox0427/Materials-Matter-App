import { createSlice } from "@reduxjs/toolkit";

type Action = 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '';

export const actionSlice = createSlice({
    name: 'action',
    initialState: 0,
    reducers: {
        
    }
});

export default actionSlice.reducer;