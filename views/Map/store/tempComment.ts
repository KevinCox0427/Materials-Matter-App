import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TempComment = null | CommentDoc

export const tempCommentSlice = createSlice({
    name: 'tempComment',
    initialState: null as TempComment,
    reducers: {
        addNewComment: (state, action: PayloadAction<{replyId: number, userData: UserData}>) => {
            state = {
                ...action.payload.userData,
                id: -1,
                commentsessionId: ,
                replyId: action.payload.replyId,
                timestamp: (new Date()).toLocaleString(),
                content: '',
                x: null,
                y: null
            }
        }
    }
});