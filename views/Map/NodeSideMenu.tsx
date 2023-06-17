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
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    },
    setNotification: React.Dispatch<React.SetStateAction<string>>
}

/**
 * The React component for the side menu to be able to edit and view nodes.
 * 
 * @param sideMenuData A pointer to the contents data that's being editted.
 * @param setSideMenuData The set state function to change what data is being pointed to.
 * @param map The state variable representing all the map's data.
 * @param setMap The set state function for the map to change the data that's being editted in the side menu.
 * @param sessions The state variable controlling all the comments and their sessions.
 * @param setSession The setter to edit target comments.
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
        if(isMoving) setIsMoving(false);
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
     * State variable keeping track whether the user is currently moving the node.
     */
    const [isMoving, setIsMoving] = useState(false);

    /**
     * Setting event listeners when the user is moving the node.
     */
    useEffect(() => {
        if(!isMoving) return;
        (document.getElementById('Map') as HTMLDivElement).addEventListener('touchend', moveNode);
        (document.getElementById('Map') as HTMLDivElement).addEventListener('mouseup', moveNode);
    }, [isMoving])

    /**
     * A function to add a node to the map based on mouse position.
     * 
     * @param target The element that is being hovered over.
     * @param x The x coordinate of the mouse position.
     */
    function moveNode(e:MouseEvent | TouchEvent) {
        /**
         * Getting the target element that the cursor was on when mouse up.
         * This could be the map or a row.
         */
        let target = e.target as HTMLElement;
        while(target.id !== 'Map' && !target.classList.contains('Row')) {
            /**
             * If the header button is being clicked, ignore.
             */
            if(target.classList.contains('MoveButton')) return;
            target = target.parentElement as HTMLElement;
        }

        /**
         * Getting the mouse position.
         */
        const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        
        /**
         * If the target doesn't have a number id, that means it's not a row, and we can just return.
         */
        if(isNaN(parseInt(target.id))) return;

        /**
         * Finding the index position of the new node based on the X position of the cursor.
         * Since the wrapper has "space-around" for its justify-content, the space inbetween the nodes are not even.
         */
        const newMap = {...props.map}

        // Gettitng reference to the element responsible for wrapping the nodes and having a horiozontal scroll.
        const scrollElement = target.getElementsByClassName('Nodes')[0] as HTMLDivElement
        // Percent of the cursor's X position relative to the row, 0 is left side and 100 is right side.
        const xPercent = ((x - scrollElement.getBoundingClientRect().left + scrollElement.scrollLeft) / scrollElement.scrollWidth) * 100;
        // Percent of the spacing inbetween nodes for "space-around." This will be twice the length of the array.
        const indexPercent = 100 / (props.map.rows[parseInt(target.id)].nodes.length * 2);

        // Finding the mouse position in one of these spacing columns. This will be used to find the index of the new node.
        let nodeIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);
        const rowIndex = parseInt(target.id);

        // Adjusting node index if we're moving on the same row.
        if(rowIndex === props.sideMenuData.dataPointer[0] && nodeIndex > props.sideMenuData.dataPointer[1]) {
            nodeIndex--;
        }

        /**
         * Deleting the node at its current spot and adding it to its new spot.
         */
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes.splice(props.sideMenuData.dataPointer[1], 1);
        newMap.rows[rowIndex].nodes.splice(nodeIndex, 0, {...node});

        /**
         * Updating state to reflect changes.
         */
        props.setMap(newMap);

        /**
         * Opening side menu to enter content.
         */
        props.setSideMenuData({
            type: 'node',
            dataPointer: [rowIndex, nodeIndex] 
        });

        setIsMoving(false);

        (document.getElementById('Map') as HTMLDivElement).removeEventListener('touchend', moveNode);
        (document.getElementById('Map') as HTMLDivElement).removeEventListener('mouseup', moveNode);
    }

    /**
     * Event handler to remove this node from the row.
     */
    function deleteNode() {
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
                <button onClick={handleSave}>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save
                </button>
            :
                <button className={`MoveButton ${isMoving ? 'Activated' : ' '}`} onMouseDown={() => setIsMoving(true)} onTouchStart={() => setIsMoving(true)}>
                    <i className="fa-solid fa-arrows-up-down-left-right"></i>
                    Move
                </button>
            }
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