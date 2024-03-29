import React, { Fragment, FunctionComponent, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from 'react-redux';
import { store, useSelector } from './store/store';

// Importing Components.
import Row from "./components/Row";
import MapComment from "./components/MapComment";
import Header from "./components/Header";

// Importing Redux reducers
import { setNotification } from "./store/notification";
import { addComment, removeSession, saveSession } from "./store/sessions";
import { closeSideMenu } from "./store/sideMenuData";
import SideMenu from "./components/SideMenu";
import { removeNewSession } from "./store/tempSession";
import { removeSelectedSession } from "./store/selectedSession";

// Setting up the socket.io server.
import io from "socket.io-client";
export const socket = io(window.ServerProps.mapPageProps!.originUrl);

/**
 * Declaring globally what properties this page should inherited from the server under "MapPageProps".
 */
declare global {
    type MapPageProps = {
        map: FullMapDoc,
        sessions: FullSessionDoc[],
        userData: UserData,
        originUrl: string
    }

    type UserData = {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    } | undefined
}

type Props = {
    ServerProps: ServerPropsType
}

/**
 * A React page that will render the contents of the map and its comments.
 * 
 * @param map The configuration of the map to render its content appropriately.
 * @param sessions All available comment sessions to view and their content.
 * @param userData (optional) Data of the logged in user.
 * @param originUrl The url for the Socket.io connection.
 */
const Map: FunctionComponent<Props> = (props) => {
    // Making sure we inherit the properties from the server.
    const pageProps = props.ServerProps.mapPageProps;
    if(!pageProps) return <></>;

    const dispatch = useDispatch();

    // Getting the map data, session data, any new sesions or comments, the selected user's action, any new notifications, and whether the map is in preview mode from the store.
    const map = useSelector(state => state.map);
    const selectedSession = useSelector(state => state.selectedSession);
    const sessions = useSelector(state => state.sessions);
    const tempSession = useSelector(state => state.tempSession);
    const tempComment = useSelector(state => state.tempComment);
    const action = useSelector(state => state.action);
    const notification = useSelector(state => state.notification);
    const preview = useSelector(state => state.preview);

    // Automatically closing the notification after 10s.
    const notificationTimeout = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if(notificationTimeout.current) clearTimeout(notificationTimeout.current);
        notificationTimeout.current = setTimeout(() => dispatch(setNotification('')), 10000);
    }, [notification]);

    /**
     * Event handler to cancel a notification instantly
     */
    function handleCancelNotificaiton() {
        if(notificationTimeout.current) clearTimeout(notificationTimeout.current);
        dispatch(setNotification(''));
    }

    // Callback function for when the client recieves a new comment from the server.
    useEffect(() => {
        socket.on('recieveComment', message => addServerComment(message));
        socket.on('recieveSession', message => addSession(message));
        socket.on('recieveDeleteSession', message => confirmDeleteSession(message));
    }, [socket, addServerComment, addSession, confirmDeleteSession]);

    /**
     * Helper function to add a new comment to the correct session from the server.
     * @param newComment The comment or error message from the server.
     */
    function addServerComment(newComment: CommentDoc | string)  {
        // If it's a string, that means it's an error message.
        if(typeof newComment === 'string') {
            dispatch(setNotification(newComment));
            return;
        }

        // Adding comment to the session
        dispatch(addComment(newComment));
    }

    /**
     * Helper function to add or edit the session recieved from Socket.io
     * @param newSession The data representing the new or editted session, or a string error message.
     */
    function addSession(newSession: FullSessionDoc | string) {
        // If it's a string, that means it's an error message.
        if(typeof newSession === 'string') {
            dispatch(setNotification(newSession));
            if(tempSession) dispatch(removeNewSession());
            return;
        }
        else {
            dispatch(saveSession(newSession));
            // If the temp session has the same name, we'll just assume that's what was saved, and we'll remove it.
            if(tempSession && tempSession.name === newSession.name) {
                dispatch(removeNewSession());
            }
        }
    }

    /**
     * Helper function to remove the comment session at a given id from Socket.io.
     * @param id The id of the session to be removed.
     */
    function confirmDeleteSession(id:number | string) {
        // If it's a string, that means it's an error message.
        if(typeof id === 'string') {
            dispatch(setNotification(id));
        }
        else {
            // Getting the index of the session by its id.
            const index = sessions.reduce((previousIndex, session, currentIndex) => {
                return session.id === id ? currentIndex : previousIndex;
            }, -1);
            // Removing the session
            dispatch(removeSession(index));
            // If it's currently being selected, deselect it.
            if(selectedSession === index) {
                dispatch(removeSelectedSession());
            } 
        }
    }

    /**
     * An event handler to close the side menu.
     */
    function toggleSideMenu (e:React.MouseEvent | React.TouchEvent) {
        if((e.target as HTMLElement).classList.contains('Node') || (e.target as HTMLElement).classList.contains('Comment')) return;
        dispatch(closeSideMenu());
    }

    return <main id="Map">
        <div className={`Notification ${notification ? 'Activated' : ' '}`}>
            <p>{notification}</p>
            <button onClick={handleCancelNotificaiton}>
                <i className="fa-solid fa-x"></i>
            </button>
        </div>
        <Header
            userData={pageProps.userData}
        ></Header>
        <div className="MenuSplit">
            <div
                className="BodyScroll"
                onMouseDown={e => toggleSideMenu(e)}
                onTouchStart={e => toggleSideMenu(e)}
                style={{
                    cursor: action !== '' 
                        ? action === 'MoveNode' 
                            ? 'grabbing' 
                            : 'copy' 
                        : 'auto'
                }}
            >
                <div className="Body">
                    <div className={`Rows ${preview ? 'Preview' : ''}`}>
                        {map.rows.length > 0 ?
                            map.rows.map((_, i) => {
                                return <Fragment key={i}>
                                    <Row rowIndex={i} />
                                </Fragment>
                            })
                        :
                            <p className="StartText">Start by adding your first row...</p>
                        }
                    </div>
                    {tempComment && tempComment.replyId === 0
                        ? <MapComment
                            commentData={tempComment}
                            commentIndex={-1}
                        ></MapComment> 
                        : <></>}
                    {selectedSession > -1 && sessions[selectedSession] && sessions[selectedSession].comments['0'] ? sessions[selectedSession].comments['0'].map((comment, i) => {
                        return <Fragment key={i}>
                            <MapComment
                                commentData={comment}
                                commentIndex={i}
                            ></MapComment>
                        </Fragment>
                    }) : <></>}
                </div>
            </div>
            <SideMenu
                userData={pageProps.userData}
            />
        </div>
    </main>
}

// Rendering our react element to the root element.
const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <Map ServerProps={window.ServerProps} />
        </Provider>
    </React.StrictMode>
);

export default Map;