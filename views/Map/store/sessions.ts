import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * A redux slice representing a session for comments to be gropued under.
 * Comments are stored under the session as a hashmap to optimize read times.
 * 
 * The structure of the comments is as follows:
 * comments: {
 *   [0]: Comment[]  -  (for commments that aren't a reply)
 *   [replyId]: Comment[]
 * }
 */
export const sessionsSlice = createSlice({
    name: 'sessions',
    initialState: window.ServerProps.mapPageProps!.sessions as FullSessionDoc[],
    reducers: {
        /**
         * A reducer function to add a comment to a certain session.
         * @param action The ccmment being added with the sessionId to add it under.
         */
        addComment: (state, action:PayloadAction<CommentDoc>) => {
            // Finding the session for the new comment.
            const sessionIndex = state.reduce((previousIndex, session, i) => {
                return action.payload.commentsessionId === session.id ? i : previousIndex;
            }, -1);
            if(sessionIndex === -1) return state;

            // If the reply id is null, then it's stored as '0' in the comment hashmap.
            const replyId = '' + (action.payload.replyId === null ? 0 : action.payload.replyId);

            // If the array to reply to this comment doesn't exist, add it.
            if(!state[sessionIndex].comments[replyId]) {
                state[sessionIndex].comments = {...state[sessionIndex].comments,
                    [replyId]: []
                }
            }

            // Checking to see if its already been added.
            for (let i = 0;  i < state[sessionIndex].comments[replyId].length; i++) {
                if(state[sessionIndex].comments[replyId][i].id === action.payload.id) return state;
            }

            // Adding the comment to the comment hashmap.
            state[sessionIndex].comments[replyId].push(action.payload);
        },

        /**
         * A reducer function to save a new session.
         * If its id is not found, it will be added to the map, otherwise it will overwrite the previous one.
         * @param action The session to add / overwrite with.
         */
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

        /**
         * A reducer function to remove a comment session at a given index.
         * @param action The index of the session to remove.
         */
        removeSession: (state, action: PayloadAction<number>) => {
            if(action.payload < 0 || action.payload > state.length - 1) return state;
            state.splice(action.payload, 1);
        }
    }
});

export const { addComment, saveSession, removeSession } = sessionsSlice.actions;