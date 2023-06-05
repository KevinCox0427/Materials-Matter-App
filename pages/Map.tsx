import React, { FunctionComponent, useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import TextEditor from "./parts/TextEditor";

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
     * An asynchronous helper function to read a file from an input
     * @param file The File object created by the input
     * @returns The base64 data of the file image.
     */
async function readFileAsDataURL(file: File): Promise<string | ArrayBuffer | null> {
    return await new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = e => resolve(fileReader.result);
        fileReader.readAsDataURL(file);
    });
}

const Map: FunctionComponent<Props> = (props) => {
    if(!props.ServerProps.mapPageProps) return <></>;

    const [map, setMap] = useState(props.ServerProps.mapPageProps.map);

    const [sideMenuData, setSideMenuData] = useState<{
        type: 'node' | 'comment',
        id: [number, number]
    } | null>(null);

    const [sessions, setSessions] = useState(props.ServerProps.mapPageProps.sessions);

    const [selectedSession, setSelectedSession] = useState(sessions[0] ? sessions[0].id : -1);
    
    const [headerButton, setHeaderButton] = useState('');
    
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
                        {sessions.map((session, i) => <p key={i} className={i === selectedSession ? 'Activated' : ' '} onClick={() => {
                            setSelectedSession(i);
                        }}>
                            {new Date(session.start).toLocaleString()} - {new Date(session.expires).toLocaleString()}
                        </p>)}
                    </div>
                </div>
                <button className="StartSession">Start Session</button>
            </div>
            <input value={map.name} onChange={(e) => {
                setMap((oldMap) => {
                    return {...oldMap,
                        name: e.target.value
                    }
                })
            }}></input>
            <div className="Buttons">
                <button className="Comment">
                    <i className="fa-solid fa-comment"></i>
                </button>
                <button className="Node" onMouseDown={e => {
                    setHeaderButton('node');
                }}>
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
        <div className="Body" onClick={e => {
            if((e.target as HTMLElement).classList[0] === 'Node') return;
            setSideMenuData(null);
        }}>
            <div className="Rows">
                {map.rows.map((row, i) => <div className="Row" key={i}>
                    <div className="Name">
                        <input value={row.name} onChange={e => {
                            setMap(oldMap => {
                                const oldRows = [...oldMap.rows];

                                oldRows[i] = {...oldRows[i],
                                    name: e.target.value
                                }

                                return {...oldMap,
                                    rows: oldRows
                                }
                            })
                        }}></input>
                    </div>
                    <div className="Bottom">
                        <div className="LeftButtons">
                            <button onClick={() => {
                                if(i === 0) return;
                                setMap(oldMap => {
                                    const oldRows = [...oldMap.rows];
                                    const currentRow = {...oldMap.rows[i]};

                                    oldRows.splice(i, 1);
                                    oldRows.splice(i-1, 0, currentRow);

                                    return {...oldMap,
                                        rows: oldRows
                                    }
                                })
                            }}><i className="fa-solid fa-arrow-up"></i></button>
                            <button onClick={() => {
                                setMap(oldMap => {
                                    const oldRows = [...oldMap.rows];
                                    oldRows.splice(i, 1);

                                    return {...oldMap,
                                        rows: oldRows
                                    }
                                });
                            }}><i className="fa-solid fa-trash-can"></i></button>
                            <button onClick={() => {
                                if(i >= map.rows.length - 1) return;
                                setMap(oldMap => {
                                    const oldRows = [...oldMap.rows];
                                    const currentRow = {...oldMap.rows[i]};

                                    oldRows.splice(i, 1);
                                    oldRows.splice(i+1, 0, currentRow);

                                    return {...oldMap,
                                        rows: oldRows
                                    }
                                })
                            }}><i className="fa-solid fa-arrow-down"></i></button>
                        </div>
                        <div className="Nodes">
                            {map.rows[i].nodes.map((node, j) => <div key={j} className="Node" onClick={() => {
                                setSideMenuData({
                                    type: 'node',
                                    id: [i, j]
                                });
                            }}>
                                <img src={node.gallery[0]}></img>
                            </div>)}
                        </div>
                    </div>
                </div>)}
            </div>
            <div className="Comments">

            </div>
        </div>
        <div className="SideMenuScroll" style={{
            width: sideMenuData ? '25vw' : '0em'
        }}>
            {sideMenuData ? 
                sideMenuData.type === 'node' ? <div className="SideMenu">
                    <div className="Buttons">
                        <button onClick={() => {
                            setMap(oldMap => {
                                const oldRows = [...oldMap.rows];
                                oldRows[sideMenuData.id[0]].nodes.splice(sideMenuData.id[1], 1);

                                return {...oldMap,
                                    rows: oldRows
                                };
                            });
                            setSideMenuData(null);
                        }}><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                    <input className="Title" value={map.rows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].name} onChange={e => {
                        setMap(oldMap => {
                            const oldRows = [...oldMap.rows];
                            oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].name = e.target.value;

                            return {...oldMap,
                                rows: oldRows
                            };
                        })
                    }}></input>
                    <div className="GalleryUpload">
                        <h2>Gallery:</h2>
                        <div className="FileUpload">
                            <input type="file" accept="image/png, image/jpg, image/jpeg, image/webp, image/svg,
                            image/gif" onChange={async (e) => {
                                /**
                                * If it's file size is greater than 1MB, do nothing.
                                */
                                if(e.target.files![0].size > 1048576) {
                                    //setLogoErrorMessage('Image cannot be larger than 1MB.')
                                    return;
                                }
           
                               /**
                                * Parsing the uploaded file into base64
                                */
                               const image = await readFileAsDataURL(e.target.files![0]);
                               
                               /**
                                * If the image is not the correct format, return.
                                */
                               if(!image || (!image.toString().includes('image/png') && !image.toString().includes('image/jpg') && !image.toString().includes('image/jpeg') && !image.toString().includes('image/webp') && !image.toString().includes('image/gif') && !image.toString().includes('image/svg'))) {
                                   //setLogoErrorMessage('Image must be .png, .jpg, .jpeg, .svg, .gif, or .webp');
                                   return;
                               }
           
                                setMap(oldMap => {
                                    const oldRows = [...oldMap.rows];
                                    oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].gallery = [...oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].gallery, image.toString()];

                                    console.log(oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].gallery)

                                    return {...oldMap,
                                        rows: oldRows
                                    }
                                });
                            }}></input>
                            <label>Click or drag to upload +</label>
                        </div>
                        <div className="Gallery">
                            {map.rows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].gallery.map((image, i) => {
                                return <div key={i} className="ImageWrapper">
                                    <img src={image}></img>
                                    <button onClick={() => {
                                        setMap(oldMap => {
                                            const oldRows = [...oldMap.rows];
                                            oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].gallery.splice(i, 1);
                
                                            return {...oldMap,
                                                rows: oldRows
                                            };
                                        });
                                    }}><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                            })}
                        </div>
                    </div>
                    <div className="TextEditorWrapper">
                        <h2>Content:</h2>
                        <TextEditor content={map.rows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].htmlContent} setContent={(newContent: string) => {
                            setMap(oldMap => {
                                const oldRows = [...oldMap.rows];
                                oldRows[sideMenuData.id[0]].nodes[sideMenuData.id[1]].htmlContent = newContent;
    
                                return {...oldMap,
                                    rows: oldRows
                                };
                            });
                        }}></TextEditor>
                    </div>
                </div> : <div className="SideMenu">
                    
                </div> 
            : 
                <></>}
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