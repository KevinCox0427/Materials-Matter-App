import React, { Fragment, FunctionComponent, useState } from "react";

type Props = {
    comment: CommentDoc,
    selectedSession: FullSessionDoc
    marginLeft: number
}

const Comment: FunctionComponent<Props> = (props) => {
    const [showReplies, setShowReplies] = useState(true);

    function toggleReplies() {
        setShowReplies(!showReplies);
    }

    return <>
        <div className="Comment" style={{
            marginLeft: `${props.marginLeft}em`
        }}>
            <div className="Top">
                <h3>{props.comment.firstName} {props.comment.lastName}</h3>
                <button className="Reply">reply</button>
                <p>{props.comment.timestamp.split('T')[0]}</p>
            </div>
            <p className="Content">{props.comment.content}</p>
            {props.comment.replyId !== null && typeof props.selectedSession.comments[props.comment.id] !== 'undefined' ?
                <button className={`HideReplies ${showReplies ? ' ' : 'Activated'}`} onClick={toggleReplies}></button>
            :   
                <></>
            }
        </div>
        {showReplies && typeof props.selectedSession.comments[props.comment.id] !== 'undefined' ?
            props.selectedSession.comments[props.comment.id].map((reply, i) => {
                return <Fragment key={i}>
                    <Comment
                        comment={reply}
                        selectedSession={props.selectedSession}
                        marginLeft={props.marginLeft + 3}
                    ></Comment>
                </Fragment>
            })
        :
            <></>
        }
    </>
}

export default Comment;