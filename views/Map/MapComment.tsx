import React, { FunctionComponent } from "react";

type Props = {
    commentData: CommentDoc,
    setSideMenuData: React.Dispatch<React.SetStateAction<{
        type: 'node' | 'comment' | 'sessions';
        dataPointer: [number, number];
    } | null>>,
    commentIndex: number
}

/**
 * A component that renders a pin for any comment placed on the map.
 * 
 * @param commentData The contents of this comment.
 * @param setSideMenuData A set state function to change what data is being pointed to.
 * @param commentIndex The index of the comment in the session data.
 */
const MapComment: FunctionComponent<Props> = (props) => {
    /**
     * Event handler to open the side menu for the selected comment.
     */
    function openComment() {
        props.setSideMenuData({
            type: 'comment',
            dataPointer: [props.commentData.replyId ? props.commentData.replyId : 0, props.commentIndex]
        })
    }
    
    return <button className="Comment" onClick={openComment} style={{
        //backgroundImage: `url("${props.commentData.image}")`,
        left: `${props.commentData.x}vw`,
        top: `${props.commentData.y}%`
    }}>
        {props.commentData.firstName.charAt(0)}{props.commentData.lastName.charAt(0)}
    </button>
}

export default MapComment;