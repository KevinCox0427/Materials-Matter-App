import React, { FunctionComponent } from "react";
import { useSelector } from "../store/store";

const TagsEditor: FunctionComponent = () => {
    const tags = useSelector(state => state.map.tags);
    
    return <div className="tags">
        <h2>Tags</h2>
        <button>+ Add Tag</button>
        {tags.map((tag, i) => <div key={i} className="Tag">
            <input value={tag.name}></input>
            <button>
                <i className="fa-solid fa-trash-can"></i>
            </button>
        </div>)}
    </div>
}

export default TagsEditor;