import React, { FunctionComponent } from "react";

type Props = {
    session: FullSessionDoc
}

const SessionOption: FunctionComponent<Props> = (props) => {
    return <div className="SessionOption">
        <div className="Row">
            <button>
                <i className="fa-solid fa-check"></i>
                Select
            </button>
            <button>
                <i className="fa-solid fa-pen-to-square"></i>
                Edit
            </button>
            <button>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        <div className="Row">
            <h3>{props.session.name}</h3>
        </div>
        <div className="Row">
            <div className="Column">
                <p>Starts:</p>
                <p>
                    {(new Date(props.session.start)).toLocaleString().split(', ')[0]},
                    <br></br>
                    {(new Date(props.session.start)).toLocaleString().split(', ')[1]}
                </p>
            </div>
            <div className="Column">
                <p>Ends:</p>
                <p>
                    {(new Date(props.session.expires)).toLocaleString().split(', ')[0]},
                    <br></br>
                    {(new Date(props.session.expires)).toLocaleString().split(', ')[1]}
                </p>
            </div>
        </div>
    </div>
}

export default SessionOption;