import React, { Fragment, FunctionComponent, useState } from "react";
import { createRoot } from "react-dom/client";
import Row from "./Row";
import SideMenu from "./SideMenu";
import Comment from "./Comment";

/**
 * Declaring globally what properties this page should inherited from the server under "MapPageProps".
 */
declare global {
    type MapPageProps = {
        map: FullMapDoc,
        sessions: FullSessionDoc[]
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
    const [selectedSession, setSelectedSession] = useState(sessions[0] ? 0 : -1);

    /**
     * State variable pointing to the data that's being edited in the side menu.
     */
    const [sideMenuData, setSideMenuData] = useState<{
        type: 'node' | 'comment',
        id: [number, number]
    } | null>(null);
    
    /**
     * State variable representing what button on the header is currently selected.
     */
    const [headerButton, setHeaderButton] = useState('');

    /**
     * Event handler to change the name of the map
     * @param e The change event from the HTML input.
     */
    function handleNameChange(e:React.ChangeEvent<HTMLInputElement>) {
        setMap((oldMap) => {
            return {...oldMap,
                name: e.target.value
            }
        })
    }

    /**
     * An event handler to close the side menu when a node isn't clicked.
     * @param e The click event.
     */
    function handleCloseSideMenu(e:React.MouseEvent) {
        if((e.target as HTMLElement).classList.contains('Node') || (e.target as HTMLElement).classList.contains('Comment')) return;
        setSideMenuData(null);
    }

    return <main>
        <header className="Head">
            <div className="Comments">
                <div className="SessionPlaceholder"></div>
                <div className="Sessions">
                    <div className="Selector">
                        <div className="Triangle"></div>
                        <h2>Session History</h2>
                    </div>
                    <div className="Options">
                        {sessions.map((session, i) => <p key={i} className={i === selectedSession ? 'Activated' : ' '} onClick={() => {setSelectedSession(i)}}>
                            {new Date(session.start).toLocaleString()} - {new Date(session.expires).toLocaleString()}
                        </p>)}
                    </div>
                </div>
                <button className="StartSession">Start Session</button>
            </div>
            <input value={map.name} onChange={handleNameChange}></input>
            <div className="Buttons">
                <button className="Comment">
                    <i className="fa-solid fa-comment"></i>
                </button>
                <button className="Node" onMouseDown={e => {setHeaderButton('node')}}>
                    <i className="fa-solid fa-plus"></i>
                </button>
                <button className="Row">
                    <i className="fa-solid fa-plus"></i>
                </button>
                <button className="Save">
                    <i className="fa-solid fa-floppy-disk"></i>
                </button>
            </div>
        </header>
        <div className="Body" onClick={handleCloseSideMenu}>
            <div className="Rows">
                {map.rows.map((_, i) => {
                    return <Fragment key={i}>
                        <Row map={map} setMap={setMap} rowIndex={i} setSideMenuData={setSideMenuData}></Row>
                    </Fragment>
                })}
            </div>
            <div className="Comments">
                {sessions[selectedSession].comments.filter(comment => comment.replyId === null).map((comment, i) => {
                    return <Fragment key={i}>
                        <Comment commentData={comment} setSideMenuData={setSideMenuData}></Comment>
                    </Fragment>
                })}
            </div>
        </div>
        <div className="SideMenuScroll" style={{
            width: sideMenuData ? '25vw' : '0em'
        }}>
            {sideMenuData ?
                <SideMenu sideMenuData={sideMenuData} setSideMenuData={setSideMenuData} map={map} setMap={setMap}></SideMenu> 
            : 
                <></>
            }
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