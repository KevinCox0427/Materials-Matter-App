import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from 'react-redux';
import { store, useSelector} from './store/store';

// Importing Components.
import Row from "./components/Row";
import MapComment from "./components/MapComment";
import Header from "./components/Header";
import Comment from "./components/Comment";
import SessionOption from "./components/SessionOption";
import NodeSideMenu from "./components/NodeSideMenu";
import TagsEditor from "./components/TagsEditor";

// Setting up the socket.io server.
import io from "socket.io-client";
import { setNotification } from "./store/notification";
import { addComment } from "./store/sessions";
import { closeSideMenu } from "./store/sideMenuData";
import SideMenu from "./components/SideMenu";
export const socket = io("localhost:3000");

/**
 * Declaring globally what properties this page should inherited from the server under "MapPageProps".
 */
declare global {
    type MapPageProps = {
        map: FullMapDoc,
        sessions: FullSessionDoc[],
        userData: UserData
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
 */
const Map: FunctionComponent<Props> = (props) => {
    // Making sure we inherit the properties from the server.
    const pageProps = props.ServerProps.mapPageProps;
    if(!pageProps) return <></>;

    const map = useSelector(state => state.map);
    const selectedSession = useSelector(state => state.selectedSession);
    const sessions = useSelector(state => state.sessions);

    const action = useSelector(state => state.action);
    const notification = useSelector(state => state.notification);

    // Callback function to remove the temp comment if it wasn't posted when the side menu or comment session changes.
    // Also will remove temp session if it wasn't finished being saved.
    // useEffect(() => {
    //     const newSessions = [...sessions];

    //     // Removing temp session if it exists.
    //     if(
    //         newSessions[newSessions.length-1] &&
    //         newSessions[newSessions.length-1].id === -1 && (
    //             !sideMenuData || (
    //                 sideMenuData &&
    //                 sideMenuData.type !== 'sessions'
    //             )
    //         )
    //     ) {
    //         newSessions.splice(newSessions.length-1, 1);
    //     }

    //     // If we're not editting the temp comment, remove it.
    //     if(
    //         newSessions[selectedSession] &&
    //         tempComment && (
    //             !sideMenuData || (
    //                 sideMenuData && (
    //                     sideMenuData.type !== 'comment' ||
    //                     sideMenuData.dataPointer[0] !== tempComment.replyId ||
    //                     sideMenuData.dataPointer[1] !== tempComment.commentIndex
    //                 )
    //             )
    //         )
    //     ) {
    //         newSessions[selectedSession].comments[tempComment.replyId].splice(tempComment.commentIndex, 1);
    //         setTempComment(null);
    //     }

    //     setSessions(newSessions);
    // }, [sideMenuData, selectedSession]);

    // Automatically closing the notification after 10s.
    const notificationTimeout = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if(notificationTimeout.current) clearTimeout(notificationTimeout.current);
        notificationTimeout.current = setTimeout(() => setNotification(''), 10000);
    }, [notification]);

    /**
     * Event handler to cancel a notification instantly
     */
    function handleCancelNotificaiton() {
        if(notificationTimeout.current) clearTimeout(notificationTimeout.current);
        setNotification('');
    }

    // Callback function for when the client recieves a new comment from the server.
    useEffect(() => {
        socket.on('recieveComment', addServerComment);
    }, [socket]);

    /**
     * Helper function to add a new comment to the correct session from the server.
     * @param newComment The comment or error message from the server.
     */
    function addServerComment(newComment: CommentDoc | string)  {
        // If it's a string, that means it's an error message.
        if(typeof newComment === 'string') {
            setNotification(newComment);
            return;
        }

        // Adding comment to the session
        addComment(newComment);
    }

    /**
     * An event handler to close the side menu.
     */
    function toggleSideMenu (e:React.MouseEvent | React.TouchEvent) {
        if((e.target as HTMLElement).classList.contains('Node') || (e.target as HTMLElement).classList.contains('Comment')) return;
        closeSideMenu();
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
                onMouseDown={toggleSideMenu}
                onTouchStart={toggleSideMenu}
                style={{
                    cursor: action !== '' 
                        ? action === 'MoveNode' 
                            ? 'grabbing' 
                            : 'copy' 
                        : 'auto'
                }}
            >
                <div className="Body">
                    <div className="Rows">
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
                    {selectedSession > -1 && sessions[selectedSession].comments['0'] ? sessions[selectedSession].comments['0'].map((comment, i) => {
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

/**
 * Rendering our react element to the root element.
 */
const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <Map ServerProps={window.ServerProps} />
        </Provider>
    </React.StrictMode>
);

export default Map;