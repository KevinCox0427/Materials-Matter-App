import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const previewSlice = createSlice({
    name: 'preview',
    initialState: false as boolean,
    reducers: {
        togglePreview: (state) => {
            return !state;
        }
    }
}); 

export const { togglePreview } = previewSlice.actions;