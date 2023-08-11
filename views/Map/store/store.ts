import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch as dispatch, useSelector as selector } from "react-redux";
import { sideMenuDataSlice } from "./sideMenuData";
import { actionSlice } from "./action";
import { mapSlice } from "./map";
import { notificationSlice } from "./notification";
import { selectedSessionSlice } from "./selectedSession";
import { sessionsSlice } from "./sessions";
import { tempCommentSlice } from "./tempComment";
import { tempSessionSlice } from "./tempSession";

export const store = configureStore({
    reducer: {
        action: actionSlice.reducer,
        map: mapSlice.reducer,
        notification: notificationSlice.reducer,
        selectedSession: selectedSessionSlice.reducer,
        sessions: sessionsSlice.reducer,
        sideMenuData: sideMenuDataSlice.reducer,
        tempComment: tempCommentSlice.reducer,
        tempSession: tempSessionSlice.reducer
    },
});

// Typing the useDispatch and useSelector hooks.
export const useDispatch: () => typeof store.dispatch = dispatch;
export const useSelector: TypedUseSelectorHook<ReturnType<typeof store.getState>> = selector;