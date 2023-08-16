import React, { FunctionComponent } from "react";
import parse from "html-react-parser";
import { useSelector } from "../store/store";

/**
 * A react component to render the contents of a node in the side menu.
 * 
 * @param node The contents of the node being viewed.
 */
const NodeViewer: FunctionComponent = () => {
    const sideMenuData = useSelector(state => state.sideMenuData);
    if(sideMenuData.type !== 'node') return <></>;
    const node = useSelector(state => state.map.rows[sideMenuData.dataPointer[0]].nodes[sideMenuData.dataPointer[1]]);
    
    return <div className="node">
        <h2 className="Title">{node.name}</h2>
        {node.tags.length > 0 
            ? <div className="TagsWrapper">
                {node.tags.map((tag, i) => <div key={i} className="Tag">{tag.name}</div>)}
            </div>
            : <></>}
        {node.thumbnail
            ? <div className="Thumbnail">
                <img src={node.thumbnail} alt={`${node.name} Thumbnail Image`}></img>
            </div>
            : <></>}
        {node.htmlContent 
            ? <div className="NodeContent">{
                    // An imported function that will convert HTML strings into React elements.
                    parse(node.htmlContent, {
                        // A callback function to filter only accepted HTML elements.
                        replace: (el) => {
                            const validTags = ['P', 'H3', 'A', 'SPAN', 'EM', 'STRONG', 'SMALL', 'IMAGE'];
                            if(!(el instanceof Element)) return el;
                            if(validTags.includes(el.tagName)) return el;
                            return false;
                        }
                    })
                }</div>
            : <></>}
    </div>
}

export default NodeViewer;