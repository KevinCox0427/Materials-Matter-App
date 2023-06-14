import React, { Fragment, FunctionComponent, useState } from "react";
import { createRoot } from "react-dom/client";
import Row from "./Row";
import SideMenu from "./SideMenu";
import MapComment from "./MapComment";

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
    const [selectedSession, setSelectedSession] = useState(0);

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

    function handleHeaderButtonDown(name:string) {
        setHeaderButton(name);
    }

    function handleHeaderButtonUp(e:React.MouseEvent | React.TouchEvent) {
        if(headerButton === '') return;

        /**
         * Getting the target element that the cursor was on when mouse up.
         * This could be the map or a row.
         */
        let target = e.target as HTMLElement;
        while(target.id !== 'Map' && !target.classList.contains('Nodes')) {
            if(target.classList.contains(headerButton)) return;
            target = target.parentElement as HTMLElement;
        }

        /**
         * Getting the bounding rectangle of the target element in pixels and the mouse position.
         */
        const targetRect = target.getBoundingClientRect();
        const x = e.nativeEvent instanceof MouseEvent ? e.nativeEvent.clientX : e.nativeEvent.touches[0].clientX;
        const y = e.nativeEvent instanceof MouseEvent ? e.nativeEvent.clientY : e.nativeEvent.touches[0].clientY;

        switch(headerButton) {
            /**
             * If we're adding a node, we'll add one to the row ID found on the target element.
             */
            case 'AddNode':
                if(!isNaN(parseInt(target.id))) {
                    /**
                     * Finding the index position of the new node based on the X position of the cursor.
                     * Since the wrapper has "space-around" for its justify-content, the space inbetween the nodes are not even.
                     */
                    // Percent of the cursor's X position relative to the row, 0 is left side and 100 is right side.
                    const xPercent = ((x - targetRect.left)/target.clientWidth) * 100;
                    // Percent of the spacing inbetween nodes for "space-around." This will be twice the length of the array.
                    const indexPercent = 100 / (map.rows[parseInt(target.id)].nodes.length * 2);
                    // Finding the mouse position in one of these spacing columns. This will be used to find the index of the new node.
                    const newIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);

                    /**
                     * Adding a new node at the found index.
                     */
                    const newMap = {...map}

                    newMap.rows[parseInt(target.id)].nodes.splice(newIndex, 0, {
                        id: -1,
                        rowId: newMap.rows[parseInt(target.id)].id,
                        name: 'New Node',
                        index: newIndex,
                        gallery: [],
                        htmlContent: ''  
                    });

                    /**
                     * Updating state to reflect changes.
                     */
                    setMap(newMap);
                }
                break;
            /**
             * If we're adding a row, 
             */
            case 'AddRow':
                break;
            /**
             * If we're just adding a comment, then we'll get the mouse position and just add it to the current session
             */
            case 'AddComment':
                const mapBody = document.getElementsByClassName('Body')[0] as HTMLDivElement;
                const newSessions = {...sessions};

                newSessions[selectedSession].comments[-1].push({
                    id: -1,
                    userId: -1,
                    replyId: -1,
                    timestamp: Date.now().toLocaleString(),
                    firstName: '',
                    lastName: '',
                    image: '',
                    content: '',
                    commentsessionId: selectedSession,
                    x: (x/mapBody.clientWidth)*100,
                    y: ((y - mapBody.getBoundingClientRect().top)/mapBody.clientHeight)*100
                });

                setSessions(newSessions)
                break;
        }

        setHeaderButton('');
    }

    return <main id="Map" onMouseUp={handleHeaderButtonUp} onTouchEnd={handleHeaderButtonUp}>
        <header className="Head">
            <a href="/" className="Back">
                <i className="fa-solid fa-backward-step"></i>
            </a>
            <input value={map.name} onChange={handleNameChange}></input>
            <div className="Buttons">
                <button className={`Comment ${headerButton === 'AddComment' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonDown('AddComment')}} onTouchStart={e => {handleHeaderButtonDown('AddComment')}}>
                    <i className="fa-solid fa-comment"></i>
                    <p>Add Comment</p>
                </button>
                <button className={`Node ${headerButton === 'AddNode' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonDown('AddNode')}} onTouchStart={e => {handleHeaderButtonDown('AddNode')}}>
                    <i className="fa-solid fa-plus"></i>
                    <p>Add Node</p>
                </button>
                <button className={`Row ${headerButton === 'AddRow' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonDown('AddRow')}} onTouchStart={e => {handleHeaderButtonDown('AddRow')}}>
                    <i className="fa-solid fa-plus"></i>
                    <p>Add Row</p>
                </button>
                <button className="Save">
                    <i className="fa-solid fa-floppy-disk"></i>
                    <p>Save</p>
                </button>
                <button className="Sessions">
                    <i className="fa-solid fa-bars"></i>
                    <p>Sessions</p>
                </button>
            </div>
        </header>
        <div className="MenuSplit">
            <div className="BodyScroll">
                <div className="Body" onClick={handleCloseSideMenu}>
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
                    {sessions[selectedSession].comments['-1'].map((comment, i) => {
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
                        map={map}
                        setMap={setMap}
                        sessions={sessions}
                        selectedSession={selectedSession}
                        setSessions={setSessions}
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