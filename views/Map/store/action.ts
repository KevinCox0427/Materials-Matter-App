import { createSlice } from "@reduxjs/toolkit";

type Action = 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '';

export const actionSlice = createSlice({
    name: 'action',
    initialState: '' as Action,
    reducers: {
        
    }
}); 