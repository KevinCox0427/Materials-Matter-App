import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export const sessionsSlice = createSlice({
    name: 'sessions',
    initialState: window.ServerProps.mapPageProps!.sessions as FullSessionDoc[],
    reducers: {
        addComment: (state, action:PayloadAction<CommentDoc>) => {
            // Finding the session for the new comment.
            const sessionIndex = state.reduce((previousIndex, session, i) => {
                return action.payload.commentsessionId === session.id ? i : previousIndex;
            }, -1);
            if(sessionIndex === -1) return;

            // If the array to reply to this comment doesn't exist, add it.
            if(!state[sessionIndex].comments[action.payload.id]) {
                state[sessionIndex].comments = {...state[sessionIndex].comments,
                    ['' + action.payload.id]: []
                }
            }

            // Checking to see if we've already added it since useEffect fires twice.
            // if(newSessions[sessionIndex].comments[replyId][newSessions[sessionIndex].comments[replyId].length - 1] && newSessions[sessionIndex].comments[replyId][newSessions[sessionIndex].comments[replyId].length - 1].id === newComment.id) {
            //     return;
            // }

            // Adding the comment to the comment hashmap.
            const replyId = action.payload.replyId ? action.payload.replyId : 0;
            state[sessionIndex].comments[replyId].push(action.payload);
        }
    }
});

export const { addComment } = sessionsSlice.actions;