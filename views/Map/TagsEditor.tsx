import React, { FunctionComponent } from "react";

type Props = {
    tags: TagDoc[]
}

const TagsEditor: FunctionComponent<Props> = (props) => {
    
    return <div className="tags">
        <h2>Tags</h2>
        <button>+ Add Tag</button>
        {props.tags.map((tag, i) => <div key={i}>
            <input value={tag.name}></input>
            <button>
                <i className="fa-solid fa-trash-can"></i>
            </button>
        </div>)}
    </div>
}

export default TagsEditor;