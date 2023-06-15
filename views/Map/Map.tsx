import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Row from "./Row";
import SideMenu from "./SideMenu";
import MapComment from "./MapComment";
import Header from "./Header";

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
            image: string
        }
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
    const [selectedSession, setSelectedSession] = useState(0);

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
     */
    useEffect(() => {
        if(!tempComment) return;
        /**
         * If we're currently editting the comment, ignore.
         */
        if(sideMenuData && sideMenuData.type === 'comment' && tempComment.replyId === sideMenuData.dataPointer[0] && tempComment.commentIndex === sideMenuData.dataPointer[1]) return;
        
        const newSessions = [...sessions];
        newSessions[selectedSession].comments[tempComment.replyId].splice(tempComment.commentIndex, 1);
        setSessions(newSessions);

        setTempComment(null);
    }, [sideMenuData, selectedSession]);
    
    /**
     * An event handler to close the side menu when a node isn't clicked.
     * @param e The click event.
     */
    function handleCloseSideMenu(e:React.MouseEvent | React.TouchEvent) {
        if((e.target as HTMLElement).classList.contains('Node') || (e.target as HTMLElement).classList.contains('Comment')) return;
        setSideMenuData(null);
    }

    return <main id="Map">
        <Header
            map={map}
            setMap={setMap}
            sessions={sessions}
            selectedSession={selectedSession}
            setSessions={setSessions}
            sideMenuData={sideMenuData}
            setSideMenuData={setSideMenuData}
            tempComment={tempComment}
            setTempComment={setTempComment}
            userData={pageProps.userData}
        ></Header>
        <div className="MenuSplit">
            <div className="BodyScroll">
                <div className="Body" onMouseDown={handleCloseSideMenu} onTouchStart={handleCloseSideMenu}>
                    <div className="Rows">
                        {map.rows.map((_, i) => {
                            return <Fragment key={i}>
                                <Row map={map}
                                    setMap={setMap}
                                    rowIndex={i}
                                    setSideMenuData={setSideMenuData}
                                ></Row>
                            </Fragment>
                        })}
                    </div>
                    {sessions[selectedSession].comments['0'].map((comment, i) => {
                        return <Fragment key={i}>
                            <MapComment
                                commentData={comment}
                                setSideMenuData={setSideMenuData}
                                sessionIndex={selectedSession}
                                commentIndex={i}
                            ></MapComment>
                        </Fragment>
                    })}
                </div>
            </div>
            <div className="SideMenuScroll" style={{
                flexBasis: sideMenuData ? 'clamp(15em, 30vw, 30em)' : '0em'
            }}>
                {sideMenuData ?
                    <SideMenu
                        sideMenuData={sideMenuData}
                        setSideMenuData={setSideMenuData}
                        tempComment={tempComment}
                        setTempComment={setTempComment}
                        map={map}
                        setMap={setMap}
                        sessions={sessions}
                        selectedSession={selectedSession}
                        setSessions={setSessions}
                        userData={pageProps.userData}
                    ></SideMenu>
                : 
                    <></>
                }
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