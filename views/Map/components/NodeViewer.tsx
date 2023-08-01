import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import parse from "html-react-parser";

type Props = {
    node: NodeDoc
}

/**
 * A react component to render the contents of a node in the side menu.
 * 
 * @param node The contents of the node being viewed.
 */
const NodeViewer: FunctionComponent<Props> = (props) => {
    /**
     * State variable and reference to keep track of the gallery slider's position.
     */
    const galleryEl = useRef<HTMLDivElement>(null);
    const [galleryPosition, setGalleryPosition] = useState(0);

    /**
     * Callback function to move the horizontal scrollbar 
     */
    useEffect(adjustGallery, [galleryPosition]);

    /**
     * Buffered callback functions when the screen is resized or a user moves the scrollbar
     */
    const resizeBuffer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if(!galleryEl.current) return;
        
        // Window resize event listener to adjust the scrollbar position to the current gallery's index.
        window.addEventListener('resize', () => {
            if(resizeBuffer.current) clearTimeout(resizeBuffer.current);
            resizeBuffer.current = setTimeout(adjustGallery, 200);
        });

        // Onscroll event listener to snap the scrollbar position to the current image that is showing.
        galleryEl.current.addEventListener('scroll', () => {
            if(resizeBuffer.current) clearTimeout(resizeBuffer.current);
            resizeBuffer.current = setTimeout(snapGallery, 500);
        })
    }, [adjustGallery, galleryEl]);

    /**
     * Helper function to move the gallery scrollbar to the appropriate position to reflect the current gallery index.
     */
    function adjustGallery() {
        if(!galleryEl.current) return;
        // Getting the length of each image.
        const imageLength = Math.round((galleryEl.current.scrollWidth / props.node.gallery.length));
        // Getting how many pixels the total gaps between images will be
        const gapAdjustment = 2 * galleryPosition-1;
        const newPosition = (imageLength * galleryPosition) + gapAdjustment;
        galleryEl.current.scrollTo(newPosition, 0);
    }

    /**
     * Helper function to snap the gallery to an image when the user scrolls inbetween them.
     */
    function snapGallery() {
        if(!galleryEl.current) return;
        const percentScrolled = galleryEl.current.scrollLeft / galleryEl.current.scrollWidth;
        const roundedIndex = Math.round(props.node.gallery.length * percentScrolled);

        // If the rounded index is different, then change the state variable
        if(roundedIndex !== galleryPosition) moveGallery(roundedIndex);
        // Otherwise just move the scrollbar to the current index.
        else adjustGallery();
    }

    /**
     * Event handler to move the gallery based on the image's index
     * @param index The index of the image in the node's gallery array.
     */
    function moveGallery(index: number) {
        setGalleryPosition(index);
    }
    
    
    return <>
        <h2 className="Title">{props.node.name}</h2>
        {props.node.gallery.length > 0 ?
            <div className="GalleryPaginationWrapper">
                <div ref={galleryEl} className="GalleryWrapper">
                    <div className="Gallery">
                        {props.node.gallery.map((image, i) => {
                            return <div key={i} className="ImageWrapper">
                                <img src={image} alt={`${props.node.name} Gallery Image ${i+1}`}></img>
                            </div>
                        })}
                    </div>
                </div>
                {props.node.gallery.length > 1 ?
                    <div className="Pagination">
                        {props.node.gallery.map((_, i) => {
                            return <button key={i} className={galleryPosition === i ? 'Activated' : ' '} onClick={() => moveGallery(i)}></button>
                        })}
                    </div>
                :< ></>}
            </div>
        : <></>}
        {props.node.htmlContent ? 
            <div className="NodeContent">{
                /**
                 * An imported function that will convert HTML strings into React elements
                 */
                parse(props.node.htmlContent, {
                    /**
                     * A callback function to filter only accepted HTML elements.
                     */
                    replace: (node) => {
                        const validTags = ['P', 'H3', 'A', 'SPAN', 'EM', 'STRONG', 'SMALL', 'IMAGE'];
                        if(!(props.node instanceof Element)) return props.node;
                        if(validTags.includes(props.node.tagName)) return props.node;
                        return false;
                    }
                })
            }</div>
        : <></>}
    </>
}

export default NodeViewer;