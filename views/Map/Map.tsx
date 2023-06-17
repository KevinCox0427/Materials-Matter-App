import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Row from "./Row";
import MapComment from "./MapComment";
import Header from "./Header";
import Comment from "./Comment";
import SessionOption from "./SessionOption";
import NodeSideMenu from "./NodeSideMenu";

/**
 * Setting up the socket.io server.
 */
import io from "socket.io-client";
export const socket = io("localhost:3000");

/**
 * Declaring globally what properties this page should inherited from the server under "MapPageProps".
 */
declare global {
    type MapPageProps = {
        map: FullMapDoc,
        sessions: FullSessionDoc[],
        userData: {
            userId: number
            firstName: string,
            lastName: string,
            image: string,
            isAdmin: boolean
        } | undefined
    }
}

type Props = {
    ServerProps: ServerPropsType
}

/**
 * A React page that will render the map page.
 * 
 * @param map The configuration of the map to render its content appropriately.
 * @param sessions All available comment sessions to view and their content.
 */
const Map: FunctionComponent<Props> = (props) => {
    /**
     * Making sure we inherit the properties from the server.
     */
    const pageProps = props.ServerProps.mapPageProps;
    if(!pageProps) return <></>;

    /**
     * The state variable representing the contents of the map.
     */
    const [map, setMap] = useState(pageProps.map);

    /**
     * State varialbes representing each comment session and the comments' content.
     */
    const [sessions, setSessions] = useState(pageProps.sessions);
    /**
     * State variable representing the index of the currently selected comment session.
     */
    const [selectedSession, setSelectedSession] = useState(pageProps.sessions.reduce((selectedSession, session, i) => {
        return (new Date()) > new Date(session.start) && (new Date()) < new Date(session.expires) ? i : selectedSession
    }, -1));

    useEffect(() => {
        socket.on('recieveComment', (newComment: CommentDoc) => {
            console.log(newComment)

            const sessionIndex = sessions.reduce((previousIndex, session, i) => {
                return newComment.commentsessionId === session.id ? i : previousIndex;
            }, -1);
            if(sessionIndex === -1) return;
            
            const newSessions = [...sessions];
            const replyId = newComment.replyId ? newComment.replyId : 0;

            if(!newSessions[sessionIndex].comments[newComment.id]) {
                newSessions[sessionIndex].comments = {...newSessions[sessionIndex].comments,
                    ['' + newComment.id]: []
                }
            }

            console.log(newSessions[sessionIndex].comments[replyId].length, newSessions[sessionIndex].comments[replyId])
            
            for(let i = 0; i < newSessions[sessionIndex].comments[replyId].length; i++) {
                if(!newSessions[sessionIndex].comments[replyId][i]) {
                    continue;
                }
                if(newSessions[sessionIndex].comments[replyId][i].id === -1) {
                    newSessions[sessionIndex].comments[replyId].splice(i, 1);
                }
                if(newSessions[sessionIndex].comments[replyId][i].id === newComment.id) {
                    return;
                }
            }

            newSessions[sessionIndex].comments[replyId].push(newComment);
            setSessions(newSessions);
        })
    }, [socket]);

    /**
     * State variable pointing to the data that's being edited in the side menu.
     */
    const [sideMenuData, setSideMenuData] = useState<{
        type: 'node' | 'comment' | 'sessions',
        dataPointer: [number, number]
    } | null>(null);

    /**
     * Storing a reference to the temp comment currently being editted.
     */
    const [tempComment, setTempComment] = useState<{
        replyId: number,
        commentIndex: number
    } | null>(null);

    /**
     * Callback function to remove the temp comment if it wasn't posted when the side menu or comment session changes.
     * Also will remove temp session if it wasn't finished being saved.
     */
    useEffect(() => {
        const newSessions = [...sessions];

        /**
         * Removing temp session if it exists.
         */
        if(
            newSessions[newSessions.length-1] &&
            newSessions[newSessions.length-1].id === -1 && (
                !sideMenuData || (
                    sideMenuData &&
                    sideMenuData.type !== 'sessions'
                )
            )
        ) {
            newSessions.splice(newSessions.length-1, 1);
        }

        /**
         * If we're not editting the temp comment, remove it.
         */
        if(
            newSessions[selectedSession] &&
            tempComment && (
                !sideMenuData || (
                    sideMenuData && (
                        sideMenuData.type !== 'comment' ||
                        sideMenuData.dataPointer[0] !== tempComment.replyId ||
                        sideMenuData.dataPointer[1] !== tempComment.commentIndex
                    )
                )
            )
        ) {
            newSessions[selectedSession].comments[tempComment.replyId].splice(tempComment.commentIndex, 1);
            setTempComment(null);
        }

        setSessions(newSessions);
    }, [sideMenuData, selectedSession]);

    /**
     * State variable representing what button on the header is currently selected.
     */
    const [headerButton, setHeaderButton] = useState<'AddComment' | 'AddNode' | 'AddRow' | ''>('');

    /**
     * Setting state for a notification pop-up and a reference to close it.
     */
    const [notification, setNotification] = useState('');
    const notificationTimeout = useRef<NodeJS.Timeout | null>(null)

    /**
     * Automatically closing the notification after 10s.
     */
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
    
    /**
     * An event handler to close the side menu when a node isn't clicked.
     * @param e The click event.
     */
    function handleCloseSideMenu(e:React.MouseEvent | React.TouchEvent) {
        if((e.target as HTMLElement).classList.contains('Node') || (e.target as HTMLElement).classList.contains('Comment')) return;
        setSideMenuData(null);
    }

    /**
     * Event handler to create a new temporary session in the side menu
     */
    function handleNewSession() {
        // Only admins can edit, add, or delete sessions
        if(!pageProps!.userData || (pageProps!.userData && !pageProps!.userData.isAdmin)) {
            setNotification('You must be an administrator to add comment sessions.');
            return;
        }

        const newSessions = [...sessions];

        /**
         * If there's already a temporary session, then delete it.
         */
        if(newSessions[newSessions.length - 1] && newSessions[newSessions.length - 1].id === -1) {
            newSessions.splice(newSessions.length - 1, 1);
        }

        /**
         * Adding an extra day to the expiration date by default.
         */
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 1);

        /**
         * Pushing an empty session and setting state.
         */
        newSessions.push({
            id: -1,
            mapId: map.id,
            name: `New Session - ${(new Date()).toLocaleDateString()}`,
            start: (new Date()).toISOString(),
            expires: expirationDate.toISOString(),
            comments: {}
        });

        setSessions(newSessions);
    }

    return <main id="Map">
        <div className="Notification" style={notification ? {
            opacity: 1,
            pointerEvents: 'all'
        } : {
            opacity: 0,
            pointerEvents: 'none'
        }}>
            <p>{notification}</p>
            <button onClick={handleCancelNotificaiton}>
                <i className="fa-solid fa-x"></i>
            </button>
        </div>
        <Header
            headerButton={headerButton}
            setHeaderButton={setHeaderButton}
            map={map}
            setMap={setMap}
            sessions={sessions}
            selectedSession={selectedSession}
            setSessions={setSessions}
            sideMenuData={sideMenuData}
            setSideMenuData={setSideMenuData}
            tempComment={tempComment}
            setTempComment={setTempComment}
            setNotification={setNotification}
            userData={pageProps.userData}
        ></Header>
        <div className="MenuSplit">
            <div className="BodyScroll" onMouseDown={handleCloseSideMenu} onTouchStart={handleCloseSideMenu} style={{
                cursor: headerButton !== '' ? 'copy' : 'auto'
            }}>
                <div className="Body">
                    <div className="Rows">
                        {map.rows.length > 0 ?
                            map.rows.map((_, i) => {
                                return <Fragment key={i}>
                                    <Row map={map}
                                        setMap={setMap}
                                        rowIndex={i}
                                        setSideMenuData={setSideMenuData}
                                    ></Row>
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
                                setSideMenuData={setSideMenuData}
                                sessionIndex={selectedSession}
                                commentIndex={i}
                            ></MapComment>
                        </Fragment>
                    }) : <></>}
                </div>
            </div>
            <div className={`SideMenuScroll ${sideMenuData ? 'Opened' : ' '}`}>
                {sideMenuData ? <>
                    {sideMenuData.type === 'node' ? 
                        <NodeSideMenu
                            node={map.rows[sideMenuData.dataPointer[0]] ? map.rows[sideMenuData.dataPointer[0]].nodes[sideMenuData.dataPointer[1]] : undefined}
                            map={map}
                            setMap={setMap}
                            sideMenuData={sideMenuData}
                            setSideMenuData={setSideMenuData}
                            sessions={sessions}
                            selectedSession={selectedSession}
                            setSessions={setSessions}
                            userData={pageProps.userData}
                            setNotification={setNotification}
                        ></NodeSideMenu>
                    : <></>}
                    {sideMenuData.type === 'comment' ?
                        <div className="comment">
                            <Comment
                                comment={selectedSession > -1 && sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]] ? 
                                sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]][sideMenuData.dataPointer[1]] : undefined}
                                sessions={sessions}
                                selectedSession={selectedSession}
                                setSessions={setSessions}
                                tempComment={tempComment}
                                setTempComment={setTempComment}
                                setNotification={setNotification}
                                marginLeft={0}
                                userData={pageProps.userData}
                            ></Comment>
                        </div>
                    : <></>}
                    {sideMenuData.type === 'sessions' ? 
                        <div className="sessions">
                            <h2>Comment Sessions:</h2>
                            <button className="AddSession" onClick={handleNewSession}>+ New Session</button>
                            {sessions.map((_, i) => {
                                return <Fragment key={i}>
                                    <SessionOption
                                        index={i}
                                        sessions={sessions}
                                        setSessions={setSessions}
                                        setSelectedSession={setSelectedSession}
                                        isSelected={selectedSession === i}
                                        setNotification={setNotification}
                                        userData={pageProps.userData}
                                    ></SessionOption>
                                </Fragment>
                            })}
                        </div>
                    : <></>}
                </> : <></>}
            </div>
        </div>
    </main>
}

/**
 * Rendering our react element to the root element.
 */
const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(
    <React.StrictMode>
        <Map ServerProps={window.ServerProps}></Map>
    </React.StrictMode>
);

export default Map;