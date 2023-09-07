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
    const dispatch = useDispatch();

    // Getting whether the map is in preview mode, the current filter applied to the map, and the row's data from the store.
    const preview = useSelector(state => state.preview);
    const filter = useSelector(state => state.filter);
    const rowData = useSelector(state => state.map.rows[props.rowIndex]);
    
    // Only returing the row if there are no filters applied, or if one is applied, that this row contains nodes with that filter.
    return filter && rowData.nodes.filter(node => node.tags.reduce((previousIndex, tag, i) => {
        if(tag.id === filter.id) return i;
        else return previousIndex;
    }, -1) > -1).length === 0 
        ? <></>
        : <div className="Row" id={'' + props.rowIndex}>
            <div className="Nodes">
                {preview && filter
                    ? rowData.nodes.filter(node => {
                        if(node.action === 'filter') return true;

                        // Seeing if the node has the current filter tag.
                        return node.tags.reduce((previousIndex, tag, i) => {
                            if(tag.id === filter.id) return i;
                            else return previousIndex;
                        }, -1) > -1;
                    }).map((node, i) => {
                        return <Fragment key={i}>
                            <Node
                                node={node}
                                nodeIndex={i}
                                rowIndex={props.rowIndex}
                            ></Node>
                        </Fragment>
                    })
                    : rowData.nodes.map((node, i) => {
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
                {preview
                    ? <h2>{rowData.name}</h2>
                    : <input value={rowData.name} onChange={e => dispatch(changeRowName({
                        rowIndex: props.rowIndex,
                        name: e.target.value
                    }))}></input>}
            </div>
            {preview ? 
                <></>
                : <div className="LeftButtons">
                    <button onClick={() => dispatch(moveRowUp(props.rowIndex))}>
                        <i className="fa-solid fa-arrow-up"></i>
                    </button>
                    <button onClick={() => dispatch(removeRow(props.rowIndex))}>
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                    <button onClick={() => dispatch(moveRowDown(props.rowIndex))}>
                        <i className="fa-solid fa-arrow-down"></i>
                    </button>
                </div>}
        </div>
}

export default Row;