import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from './store';

type TempComment = null | CommentDoc

export const tempCommentSlice = createSlice({
    name: 'tempComment',
    initialState: null as TempComment,
    reducers: {
        addNewComment: (state, action: PayloadAction<{
            replyId: number,
            userData: UserData,
            position?: [number, number]
        }>) => {
            // Getting the current selected session 
            const selectedSessionId = useSelector(state => state.sessions[state.selectedSession].id);

            state = {
                ...action.payload.userData!,
                id: -1,
                commentsessionId: selectedSessionId,
                replyId: action.payload.replyId,
                timestamp: (new Date()).toLocaleString(),
                content: '',
                x: action.payload.position ? action.payload.position[0] : null,
                y: action.payload.position ? action.payload.position[1] : null,
            }
        },

        removeTempComment: (state) => {
            state = null;
        }
    }
});

export const { addNewComment, removeTempComment } = tempCommentSlice.actions;