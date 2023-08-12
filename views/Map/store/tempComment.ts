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
            const date = new Date();
            return {
                ...action.payload.userData!,
                id: -1,
                commentsessionId: action.payload.sessionId,
                replyId: action.payload.replyId,
                timestamp: `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
                content: '',
                x: action.payload.position ? action.payload.position[0] : null,
                y: action.payload.position ? action.payload.position[1] : null,
            }
        },

        removeTempComment: (state) => {
            return null;
        },
        
        setCommentMessage: (state, action: PayloadAction<string>) => {
            if(!state) return state;
            state.content = action.payload;
        }
    }
});

export const { addNewComment, removeTempComment, setCommentMessage } = tempCommentSlice.actions;