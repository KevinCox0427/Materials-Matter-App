import React, { FunctionComponent, useEffect, useRef, useState } from "react";

type Props = {
    action: 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '',
    setAction: React.Dispatch<React.SetStateAction<Props["action"]>>,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>
    rowIndex: number,
    nodeIndex: number,
    node: NodeDoc,
    setSideMenuData: React.Dispatch<React.SetStateAction<null | {
        type: 'node' | 'comment' | 'sessions';
        dataPointer: [number, number];
    }>>
}

/**
 * The React component that renders a node inside a row on the map.
 * 
 * @param rowIndex The index of the row this node belongs to.
 * @param nodeIndex The index of the node in the row.
 * @param node The content's data for the node.
 * @param setSideMenuData The set state function for the side menu's data to point it to this node's data upon a user's click.
 */
const Node: FunctionComponent<Props> = (props) => {
    /**
     * Refernce for keeping track of mouse position
     */
    const mousePosition = useRef([-1,-1]);
    const [isMoving, setIsMoving] = useState(false)

    /**
     * Setting event listeners when the user is moving the node.
     */
    function startMoveNode(e:React.MouseEvent | React.TouchEvent) {
        props.setAction('MoveNode');
        setIsMoving(true);
        
        /**
         * Setting the initial mouse coordinates and setting event listeners for when the mouse ends.
         */
        // @ts-ignore      another typescript L
        const x = e.clientX ? e.clientX : e.touches[0].clientX;
        // @ts-ignore
        const y = e.clientY ? e.clientY : e.touches[0].clientY;
        mousePosition.current = [x, y];

        const mapEl = document.getElementById('Map') as HTMLDivElement;
        mapEl.addEventListener('touchend', endMoveNode);
        mapEl.addEventListener('mouseup', endMoveNode);
    }

    /**
     * A function to move a node to the map based on mouse position.
     * 
     * @param target The element that is being hovered over.
     * @param x The x coordinate of the mouse position.
     */
    function endMoveNode(e:MouseEvent | TouchEvent) {
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
        const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        /**
         * If the cursor hasn't traveled more than 10 pixels, then just end here and open the side menu.
         */
        if(Math.abs(mousePosition.current[0]) - x < 10 && Math.abs(mousePosition.current[1] - y) < 10) {
            const mapEl = document.getElementById('Map') as HTMLDivElement;
            mapEl.removeEventListener('touchend', endMoveNode);
            mapEl.removeEventListener('mouseup', endMoveNode);
            props.setAction('');
            setIsMoving(false);

            props.setSideMenuData({
                type: 'node',
                dataPointer: [props.rowIndex, props.nodeIndex]
            });
            
            return;
        }
        
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
        let newNodeIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);
        const newRowIndex = parseInt(target.id);

        // Adjusting node index if we're moving on the same row.
        if(newRowIndex === props.rowIndex && newNodeIndex > props.nodeIndex) {
            newNodeIndex--;
        }

        /**
         * Deleting the node at its current spot and adding it to its new spot.
         */
        newMap.rows[props.rowIndex].nodes.splice(props.nodeIndex, 1);
        newMap.rows[newRowIndex].nodes.splice(newNodeIndex, 0, {...props.node});

        /**
         * Updating the indeces for all nodes
         */
        newMap.rows[props.rowIndex].nodes = newMap.rows[props.rowIndex].nodes.map((node, i) => {
            return {...node,
                index: i
            }
        });
        newMap.rows[newRowIndex].nodes = newMap.rows[newRowIndex].nodes.map((node, i) => {
            return {...node,
                index: i
            }
        });

        /**
         * Updating state to reflect changes.
         */
        props.setMap(newMap);

        const mapEl = document.getElementById('Map') as HTMLDivElement;
        mapEl.removeEventListener('touchend', endMoveNode);
        mapEl.removeEventListener('mouseup', endMoveNode);

        props.setAction('');
        setIsMoving(false);
    }
    
    return <div className="Node" id={`${props.rowIndex}.${props.nodeIndex}`} onMouseDown={e => startMoveNode(e)} onTouchStart={e => startMoveNode(e)} style={{
        opacity: isMoving ? 0.5 : 1,
        backgroundImage: props.node.gallery[0] ? `url("${props.node.gallery[0]}")` : 'none'
    }}>
        <h3>{props.node.name}</h3>
    </div>
}

export default Node;