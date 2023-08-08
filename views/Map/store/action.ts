import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type Action = 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '';

export const actionSlice = createSlice({
    name: 'action',
    initialState: '' as Action,
    reducers: {
        setAction: (state, action: PayloadAction<Action>) => {
            state = action.payload;
        }
    }
}); 

export const { setAction } = actionSlice.actions;