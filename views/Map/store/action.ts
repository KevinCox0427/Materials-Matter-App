import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type Action = 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '';

/**
 * A Redux slice representing the action selected by the user from the toolbar.
 */
export const actionSlice = createSlice({
    name: 'action',
    initialState: '' as Action,
    reducers: {
        /**
         * A reducer function that overwrites the current action that's selected.
         * @param action The action to overwrite with.
         */
        setAction: (state, action: PayloadAction<Action>) => {
            return action.payload;
        }
    }
}); 

export const { setAction } = actionSlice.actions;