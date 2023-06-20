import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import NodeEditor from "./NodeEditor";
import NodeViewer from "./NodeViewer";

type Props = {
    node: NodeDoc | undefined,
    sideMenuData: {
        type: 'node' | 'comment' | 'sessions';
        dataPointer: [number, number];
    },
    setSideMenuData: React.Dispatch<React.SetStateAction<Props["sideMenuData"] | null>>,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    sessions: FullSessionDoc[],
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    selectedSession: number,
    setNotification: React.Dispatch<React.SetStateAction<string>>,
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

/**
 * The React component for the side menu to be able to edit and view nodes.
 * 
 * @param node The contents of the node being viewed.
 * @param sideMenuData A pointer to the contents data that's being editted.
 * @param setSideMenuData The set state function to change what data is being pointed to.
 * @param map The state variable representing all the map's data.
 * @param setMap The set state function for the map to change the data that's being editted in the side menu.
 * @param sessions The state variable controlling all the comments and their sessions.
 * @param setSession The setter to edit target comments.
 * @param selectedSession A number representing the index of the currently selected session in the sessions array.
 * @param setNotification A set state function to open a pop-up menu to notify the user.
 * @param userData (optional) Data of the logged in user.
 */
const NodeSideMenu: FunctionComponent<Props> = (props) => {
    if(!props.node) return <></>;

    /**
     * Setting state for the node's content to be editted.
     */
    const [node, setNode] = useState(props.node);
    useEffect(() => {
        setNode(props.node!);
        if(isEditing) toggleIsEditing();
    }, [props.node]);

    /**
     * State variable to keep track of when the node is being edited
     */
    const [isEditing, setIsEditing] = useState(false);

    /**
     * Event handler to toggle between the editor and viewer.
     */
    function toggleIsEditing() {
        setIsEditing(!isEditing);
        setNode(props.node!);
        
        // Removing any toolbars the Quill created.
        const qlToolbars = Array.from(document.getElementsByClassName('ql-toolbar')) as HTMLDivElement[];
        qlToolbars.forEach(toolbar => {
            toolbar.remove();
        })
    }

    /**
     * Event handler to remove this node from the row.
     */
    function deleteNode() {
        /**
         * Making a post call to the server to delete the images on AWS.
         * Doesn't really matter what the response is.
         */
        if(props.userData) {
            fetch('/image', {
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    urls: props.node!.gallery
                })
            });
        }

        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.dataPointer[0]].nodes.splice(props.sideMenuData.dataPointer[1], 1);

            return {...oldMap,
                rows: newRows
            };
        });
        props.setSideMenuData(null);
    }

    /**
     * Event handler to save this this component's state data to the map's state data.
     */
    function handleSave() {
        const newMap = {...props.map};
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]] = {...node};
        props.setMap(newMap);
        toggleIsEditing();
    }

    return <div className="node">
        <div className="Buttons">
            {isEditing ? 
                <button className="Activated" onClick={toggleIsEditing}>
                    <i className="fa-solid fa-x"></i>
                    Cancel
                </button>
            :
                <button onClick={toggleIsEditing}>
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit
                </button>
            }
            {isEditing ? 
                <button onClick={handleSave}>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save
                </button>
            : <></>}
            <button onClick={deleteNode}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        {isEditing ? 
            <NodeEditor
                node={node}
                setNode={setNode}
                setMap={props.setMap}
                sideMenuData={props.sideMenuData}
                userData={props.userData}
                setNotification={props.setNotification}
            ></NodeEditor>
        :
            <NodeViewer
                node={props.node}
            ></NodeViewer>
        }
    </div>
}

export default NodeSideMenu;