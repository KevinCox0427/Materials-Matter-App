import React, { FunctionComponent } from "react";
import { useDispatch, useSelector } from "../store/store";
import { addTag, removeTag, setTagName } from "../store/map";
import { removeFilter } from "../store/filter";

/**
 * A React component to render all the tags on the map, as well as an editor to edit, remove, or add tags.
 */
const TagsEditor: FunctionComponent = () => {
    const dispatch = useDispatch();

    // Getting the tag data and any filters applied to the map from the store.
    const tags = useSelector(state => state.map.tags);
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
        <button
            onClick={() => dispatch(addTag('Untitled'))}
        >+ Add Tag</button>
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