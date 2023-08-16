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
            if(sessionIndex === -1) return state;

            // If the array to reply to this comment doesn't exist, add it.
            if(!state[sessionIndex].comments['' + action.payload.replyId]) {
                state[sessionIndex].comments = {...state[sessionIndex].comments,
                    ['' + action.payload.replyId]: []
                }
            }

            // Checking to see if its already been added.
            if (state[sessionIndex].comments['' + action.payload.replyId].some(comment => comment.id === action.payload.id)) {
                return state;
            }

            // Adding the comment to the comment hashmap.
            state[sessionIndex].comments['' + action.payload.replyId].push(action.payload);
        },

        saveSession: (state, action: PayloadAction<FullSessionDoc>) => {
            // Finding the session's index given its id.
            const sessionIndex = state.reduce((previousIndex, session, currentIndex) => {
                return session.id === action.payload.id ? currentIndex : previousIndex;
            }, -1);

            // If not found, push the new session
            if(sessionIndex === -1) {
                state.push({...action.payload,
                    comments: {}
                });
            }
            // Otherwise overwrite the previous one.
            else {
                action.payload = {...action.payload,
                    comments: state[sessionIndex].comments ? state[sessionIndex].comments : {}
                }
                state[sessionIndex] = action.payload;
            }
        },

        removeSession: (state, action: PayloadAction<number>) => {
            if(action.payload < 0 || action.payload >= state.length - 1) return state;
            state.splice(action.payload, 1);
        }
    }
});

export const { addComment, saveSession, removeSession } = sessionsSlice.actions;