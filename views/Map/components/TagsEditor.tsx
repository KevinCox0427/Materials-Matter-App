import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "../store/store";
import { addTag, removeTag, setTagName } from "../store/map";
import { removeFilter } from "../store/filter";

const TagsEditor: FunctionComponent = () => {
    const dispatch = useDispatch();
    const tags = useSelector(state => state.map.tags);
    const map = useSelector(state => state.map);
    const filter = useSelector(state => state.filter);

    /**
     * Event handler for deleting a tag from the map.
     * @param i 
     */
    function handleRemoveTag(i: number) {
        // If it's set as the current filter, then remove it.
        if(filter && filter.id === tags[i].id) dispatch(removeFilter());
        dispatch(removeTag(i));
    }
    
    return <div className="tags">
        <h2>Tags:</h2>
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
                <button onClick={() => handleRemoveTag(i)}>
                    <i className="fa-solid fa-trash-can"></i>
                </button>
            </div>
        })}
    </div>
}

export default TagsEditor;