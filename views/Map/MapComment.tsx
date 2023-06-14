import React, { FunctionComponent } from "react";

type Props = {
    commentData: CommentDoc,
    setSideMenuData: React.Dispatch<React.SetStateAction<{
        type: 'node' | 'comment';
        id: [number, number];
    } | null>>,
    sessionIndex: number, 
    commentIndex: number
}

const MapComment: FunctionComponent<Props> = (props) => {
    function handleOpenComment() {
        console.log(props.sessionIndex, props.commentIndex)
        props.setSideMenuData({
            type: 'comment',
            id: [props.sessionIndex, props.commentIndex]
        })
    }
    
    return <button className="Comment" onClick={handleOpenComment} style={{
        //backgroundImage: `url("${props.commentData.image}")`,
        left: `${props.commentData.x}%`,
        top: `${props.commentData.y}%`
    }}>
        {props.commentData.firstName.charAt(0)}{props.commentData.lastName.charAt(0)}
    </button>
}

export default MapComment;