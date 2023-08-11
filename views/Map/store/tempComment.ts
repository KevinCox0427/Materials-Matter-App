import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TempComment = null | CommentDoc

export const tempCommentSlice = createSlice({
    name: 'tempComment',
    initialState: null as TempComment,
    reducers: {
        addNewComment: (state, action: PayloadAction<{
            replyId: number,
            sessionId: number,
            userData: UserData,
            position?: [number, number]
        }>) => {
            return {
                ...action.payload.userData!,
                id: -1,
                commentsessionId: action.payload.sessionId,
                replyId: action.payload.replyId,
                timestamp: (new Date()).toLocaleString(),
                content: '',
                x: action.payload.position ? action.payload.position[0] : null,
                y: action.payload.position ? action.payload.position[1] : null,
            }
        },

        removeTempComment: (state) => {
            return null;
        }
    }
});

export const { addNewComment, removeTempComment } = tempCommentSlice.actions;