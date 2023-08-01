import { configureStore } from "@reduxjs/toolkit";
import { sideMenuDataSlice } from "./sideMenuData";
import { actionSlice } from "./action";
import { mapSlice } from "./map";
import { notificationSlice } from "./notification";
import { selectedSessionSlice } from "./selectedSession";
import { sessionsSlice } from "./sessions";
import { tempCommentSlice } from "./tempComment";

export default configureStore({
    reducer: {
        action: actionSlice.reducer,
        map: mapSlice.reducer,
        notification: notificationSlice.reducer,
        selectedSession: selectedSessionSlice.reducer,
        sessions: sessionsSlice.reducer,
        sideMenuData: sideMenuDataSlice.reducer,
        tempComment: tempCommentSlice.reducer
    }
});

