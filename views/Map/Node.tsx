import React, { FunctionComponent } from "react";

type Props = {
    rowIndex: number,
    nodeIndex: number,
    nodeData: NodeDoc,
    setSideMenuData: React.Dispatch<React.SetStateAction<null | {
        type: 'node' | 'comment';
        id: [number, number];
    }>>
}

/**
 * The React component that renders a node inside a row on the map.
 * 
 * @param rowIndex The index of the row this node belongs to.
 * @param nodeIndex The index of the node in the row.
 * @param nodeData The content's data for the node.
 * @param setSideMenuData The set state function for the side menu's data to point it to this node's data upon a user's click.
 */
const Node: FunctionComponent<Props> = (props) => {
    /**
     * Event handler to open the side menu to be able to edit the node's content.
     */
    function handleClick() {
        props.setSideMenuData({
            type: 'node',
            id: [props.rowIndex, props.nodeIndex]
        });
    }
    
    return <div className="Node" id={`${props.rowIndex}.${props.nodeIndex}`} onClick={handleClick}>
        {props.nodeData.gallery[0] ? 
            <img src={props.nodeData.gallery[0]}></img>
        : 
            <h3>{props.nodeData.name}</h3>
        }
    </div>
}

export default Node;