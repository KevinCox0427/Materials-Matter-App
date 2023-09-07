import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * A redux slice representing what nodes are being filtered.
 * This is decided by what tags are attached to the node.
 */
export const filterSlice = createSlice({
    name: 'filter',
    initialState: null as TagDoc | null,
    reducers: {
        /**
         * A reducer function to overwrite the tag that's being currently filtered.
         * @param action The tag to filter with.
         */
        setFilter: (state, action: PayloadAction<TagDoc>) => {
            return action.payload;
        },

        /**
         * A reducer function to remove the filter.
         */
        removeFilter: (state) => {
            return null;
        }
    }
}); 

export const { setFilter, removeFilter } = filterSlice.actions;