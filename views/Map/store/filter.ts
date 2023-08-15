import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const filterSlice = createSlice({
    name: 'filter',
    initialState: null as number | null,
    reducers: {
        setFilter: (state, action: PayloadAction<number>) => {
            return action.payload;
        },
        removeFilter: (state) => {
            return null;
        }
    }
}); 

export const { setFilter, removeFilter } = filterSlice.actions;