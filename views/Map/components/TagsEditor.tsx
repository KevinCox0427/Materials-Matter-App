import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "../store/store";
import { addTag, removeTag, setTagName } from "../store/map";

const TagsEditor: FunctionComponent = () => {
    const dispatch = useDispatch();
    const tags = useSelector(state => state.map.tags);
    const map = useSelector(state => state.map);
    
    return <div className="tags">
        <h2>Tags</h2>
        <button onClick={() => dispatch(addTag({
            name: 'Untitled',
            mapId: map.id
        }))}>+ Add Tag</button>
        {tags.map((tag, i) => {
            return <div key={i} className="Tag">
                <input
                    value={tag.name}
                    onChange={e => dispatch(setTagName({
                        tagIndex: i,
                        name: e.target.value
                    }))}
                ></input>
                <button onClick={() => dispatch(removeTag(i))}>
                    <i className="fa-solid fa-trash-can"></i>
                </button>
            </div>
        })}
    </div>
}

export default TagsEditor;