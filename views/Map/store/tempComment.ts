import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TempComment = null | {
    replyId: number,
    message: number
}

export const tempCommentSlice = createSlice({
    name: 'tempComment',
    initialState: null,
    reducers: {
        
    }
});

export default tempCommentSlice.reducer;