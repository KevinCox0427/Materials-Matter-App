import React, { Fragment, FunctionComponent } from "react";
import Node from "./Node";

type Props = {
    rowIndex: number,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    setSideMenuData: React.Dispatch<React.SetStateAction<null | {
        type: 'node' | 'comment';
        id: [number, number];
    }>>
}

/**
 * The React component that renders a row on the map.
 * 
 * @param rowIndex The index of the row this node belongs to.
 * @param map The state variable representing all the map's data.
 * @param setMap The set state function for the map to change the row's data.
 * @param setSideMenuData The set state function for the side menu's data to point it to this node's data upon a user's click.
 */
const Row: FunctionComponent<Props> = (props) => {
    const rowData = props.map.rows[props.rowIndex];

    /**
     * An event handler to change the name of the row.
     * @param e The change event of the Input element
     */
    function handleNameChange(e:React.ChangeEvent<HTMLInputElement>) {
        props.setMap(oldMap => {
            const oldRows = [...oldMap.rows];

            oldRows[props.rowIndex] = {...oldRows[props.rowIndex],
                name: e.target.value
            }

            return {...oldMap,
                rows: oldRows
            }
        })
    }

    /**
     * An event handler to move the row up an index.
     */
    function handleMoveUp() {
        if(props.rowIndex === 0) return;

        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            const currentRow = oldMap.rows[props.rowIndex];

            newRows.splice(props.rowIndex, 1);
            newRows.splice(props.rowIndex - 1, 0, currentRow);

            return {...oldMap,
                rows: newRows
            }
        })
    }

    /**
     * An event handler to remove the row from the map.
     */
    function handleDelete() {
        props.setMap(oldMap => {
            const oldRows = [...oldMap.rows];
            oldRows.splice(props.rowIndex, 1);

            return {...oldMap,
                rows: oldRows
            }
        });
    }

    /**
     * An event handler to move the row down an index.
     */
    function handleMoveDown() {
        if(props.rowIndex >= props.map.rows.length - 1) return;

        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            const currentRow = oldMap.rows[props.rowIndex];

            newRows.splice(props.rowIndex, 1);
            newRows.splice(props.rowIndex + 1, 0, currentRow);

            return {...oldMap,
                rows: newRows
            }
        })
    }
    
    return <div className="Row">
        <div className="Name">
            <input value={rowData.name} onChange={handleNameChange}></input>
        </div>
        <div className="Bottom">
            <div className="LeftButtons">
                <button onClick={handleMoveUp}>
                    <i className="fa-solid fa-arrow-up"></i>
                </button>
                <button onClick={handleDelete}>
                    <i className="fa-solid fa-trash-can"></i>
                </button>
                <button onClick={handleMoveDown}>
                    <i className="fa-solid fa-arrow-down"></i>
                </button>
            </div>
            <div className="Nodes" id={'' + props.rowIndex}>
                {rowData.nodes.map((node, i) => {
                    return <Fragment key={i}>
                        <Node nodeData={node} nodeIndex={i} rowIndex={props.rowIndex} setSideMenuData={props.setSideMenuData}></Node>
                    </Fragment>
                })}
            </div>
        </div>
    </div>
}

export default Row;