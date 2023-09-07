import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type TempComment = null | CommentDoc

/**
 * A redux slice representing a new comment that the user uploads.
 */
export const tempCommentSlice = createSlice({
    name: 'tempComment',
    initialState: null as TempComment,
    reducers: {
        /**
         * A reducer function to create a new comment.
         * @param replyId The id of the comment that this is replying too. 0 means it's not a reply.
         * @param sessionId The id of the session that this comment is under.
         * @param userData The data of the user that's commenting this.
         * @param position If this comment isn't a reply and is located on the map, this is the coordinate of the comment. Units are a percentage of the map's height and width.
         */
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

        /**
         * A reducer function to reset the new comment.
         */
        removeTempComment: (state) => {
            return null;
        },
        
        /**
         * A reducer function to edit the message on the new comment.
         * @param action The new message to overwrite with.
         */
        setCommentMessage: (state, action: PayloadAction<string>) => {
            if(!state) return state;
            state.content = action.payload;
        }
    }
});

export const { addNewComment, removeTempComment, setCommentMessage } = tempCommentSlice.actions;