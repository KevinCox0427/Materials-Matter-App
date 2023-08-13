import React, { Fragment, FunctionComponent } from "react";
import Node from "./Node";
import { useDispatch, useSelector } from "../store/store";
import { changeRowName, moveRowDown, moveRowUp, removeRow } from "../store/map";

type Props = {
    rowIndex: number,
}

/**
 * The React component that renders a row on the map.
 * @param rowIndex The index of the row this node belongs to.
 */
const Row: FunctionComponent<Props> = (props) => {
    const preview = useSelector(state => state.preview);
    const rowData = useSelector(state => state.map.rows[props.rowIndex]);
    const dispatch = useDispatch();
    
    return <div className="Row" id={'' + props.rowIndex}>
        <div className="Nodes">
            {rowData.nodes.map((node, i) => {
                return <Fragment key={i}>
                    <Node
                        node={node}
                        nodeIndex={i}
                        rowIndex={props.rowIndex}
                    ></Node>
                </Fragment>
            })}
        </div>
        <div className="Name">
            {preview ?
                <h2>{rowData.name}</h2>
                : <input value={rowData.name} onChange={e => dispatch(changeRowName({
                    rowIndex: props.rowIndex,
                    name: e.target.value
                }))}></input>}
        </div>
        {preview ? 
            <></>
            : <div className="LeftButtons">
                <button onClick={() => dispatch(moveRowUp({rowIndex: props.rowIndex}))}>
                    <i className="fa-solid fa-arrow-up"></i>
                </button>
                <button onClick={() => dispatch(removeRow({rowIndex: props.rowIndex}))}>
                    <i className="fa-solid fa-trash-can"></i>
                </button>
                <button onClick={() => dispatch(moveRowDown({rowIndex: props.rowIndex}))}>
                    <i className="fa-solid fa-arrow-down"></i>
                </button>
            </div>}
    </div>
}

export default Row;