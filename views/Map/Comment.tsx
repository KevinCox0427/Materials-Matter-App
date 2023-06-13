import React, { FunctionComponent } from "react";

type Props = {
    commentData: CommentDoc,
    setSideMenuData: React.Dispatch<React.SetStateAction<{
        type: 'node' | 'comment';
        id: [number, number];
    } | null>>
}

const Comment: FunctionComponent<Props> = (props) => {

    function handleOpenComment() {
        props.setSideMenuData({
            type: 'comment',
            id: [props.commentData.commentsessionId, props.commentData.id]
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

export default Comment;