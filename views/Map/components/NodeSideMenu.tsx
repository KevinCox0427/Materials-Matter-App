import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import NodeEditor from "./NodeEditor";
import NodeViewer from "./NodeViewer";

type Props = {
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
 * @param userData (optional) Data of the logged in user.
 */
const NodeSideMenu: FunctionComponent<Props> = (props) => {
    const node = props.map.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]];
    if(!node) return <></>;
    /**
     * State variable to keep track of when the node is being edited
     */
    const [isEditing, setIsEditing] = useState(false);

    /**
     * Event handler to toggle between the editor and viewer.
     */
    function toggleIsEditing() {
        setIsEditing(!isEditing);
        
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
                    urls: node.gallery
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

    return <div className="node">
        <div className="Buttons">
            {isEditing ? 
                <button className="Activated" onClick={toggleIsEditing}>
                    <i className="fa-solid fa-check"></i>
                    Done
                </button>
            :
                <button onClick={toggleIsEditing}>
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit
                </button>
            }
            <button onClick={deleteNode}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        {isEditing ? 
            <NodeEditor
                map={props.map}
                setMap={props.setMap}
                sideMenuData={props.sideMenuData}
                userData={props.userData}
                setNotification={props.setNotification}
            ></NodeEditor>
        :
            <NodeViewer
                node={node}
            ></NodeViewer>
        }
    </div>
}

export default NodeSideMenu;