import { createSlice } from "@reduxjs/toolkit";

/**
 * A redux slice representing whether the user is previewing or editing the map.
 */
export const previewSlice = createSlice({
    name: 'preview',
    initialState: false as boolean,
    reducers: {
        /**
         * A reducer funciton to switch the map state between previewing and editing.
         */
        togglePreview: (state) => {
            return !state;
        }
    }
}); 

export const { togglePreview } = previewSlice.actions;