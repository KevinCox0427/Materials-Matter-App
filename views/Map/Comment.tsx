import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from "react";
import { socket } from './Map';

type Props = {
    comment: CommentDoc | undefined,
    sessions: FullSessionDoc[],
    selectedSession: number,
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    tempComment: {
        replyId: number;
        commentIndex: number;
    } | null
    setTempComment:  React.Dispatch<React.SetStateAction<Props['tempComment']>>,
    setNotification: React.Dispatch<React.SetStateAction<string>>,
    marginLeft: number,
    userData?: {
        userId: number,
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

const Comment: FunctionComponent<Props> = (props) => {
    if(!props.comment) return <></>;

    /**
     * State variables to keep track of a comment's content and whether its replies are visible.
     */
    const [showReplies, setShowReplies] = useState(true);
    const [commentMessage, setCommentMessage] = useState('');

    /**
     * Event handler to toggle whether the replies are visible or not.
     */
    function toggleReplies() {
        setShowReplies(!showReplies);
    }

    /**
     * Event handler to change the text of a comment.
     */
    function changeMessage(e:React.ChangeEvent<HTMLTextAreaElement>) {
        setCommentMessage(e.target.value);
        /**
         * Making text area wrap content.
         */
        e.target.style.height = '0px';
        e.target.style.height = e.target.scrollHeight + 'px';
    }

    /**
     * Event handler to create an empty reply comment.
     */
    function reply() {
        /**
         * A user must be logged in to reply
         */
        if(!props.userData) {
            props.setNotification('You must be logged in to comment.');
            return;
        }

        const newSessions = [...props.sessions];

        /**
         * If the reply array doesn't exist in the session, create one.
         */
        if(!newSessions[props.selectedSession].comments["" + props.comment!.id]) {
            newSessions[props.selectedSession].comments = {...newSessions[props.selectedSession].comments,
                [props.comment!.id]: []
            }
        }

        /**
         * If the user is already replying, remove it from the session.
         */
        if(props.tempComment) {
            newSessions[props.selectedSession].comments[props.tempComment.replyId].splice(props.tempComment.commentIndex, 1);
        }

        /**
         * Setting the temp comment state variable.
         */
        props.setTempComment({
            replyId: props.comment!.id,
            commentIndex: 0
        })

        /**
         * Adding a temporary comment at the first index into the reply array.
         */
        newSessions[props.selectedSession].comments["" + props.comment!.id].splice(0, 0, {
            ...props.userData,
            id: -1,
            commentsessionId: newSessions[props.selectedSession].id,
            replyId: props.comment!.id,
            timestamp: (new Date()).toLocaleString().split(', ')[0],
            content: '',
            x: null,
            y: null
        })
        props.setSessions(newSessions);
    }

    /**
     * Event handler to send the comment to the server to be stored in the database.
     */
    function post() {
        socket.emit("postComment", {
            content: commentMessage,
            x: props.comment!.x,
            y: props.comment!.y,
            userId: props.comment!.userId,
            commentsessionId: props.comment!.commentsessionId,
            replyId: props.comment!.replyId
        });
    }

    /**
     * If the comment has a textarea element, then we'll focus it when this comment is created.
     */
    const commentEl = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!commentEl.current) return;
        const textarea = commentEl.current.getElementsByTagName('textarea')[0];
        if(textarea) textarea.focus();
    }, [commentEl])

    return <>
        <div className="Comment" ref={commentEl} style={{
            marginLeft: `${props.marginLeft}em`
        }}>
            <div className="Top">
                <h3>{props.comment.firstName} {props.comment.lastName}</h3>
                {props.comment.id === -1 ? 
                    <button className="Reply" onClick={post}>post</button>
                :
                    <button className="Reply" onClick={reply}>reply</button>
                }
                <p>{new Date(props.comment.timestamp).toLocaleString().split(', ')[0]}</p>
            </div>
            {props.comment.id === -1 ? 
                <textarea className="EditContent" placeholder="Enter your comment..." value={commentMessage} onChange={changeMessage}></textarea>
            :
                <p className="Content">{props.comment.content}</p>
            }
            {props.comment.replyId !== null && typeof props.sessions[props.selectedSession].comments[props.comment.id] !== 'undefined' && props.sessions[props.selectedSession].comments[props.comment.id].length > 0 ?
                <button className={`HideReplies ${showReplies ? ' ' : 'Activated'}`} onClick={toggleReplies}>
                    <div className="Triangle"></div>
                </button>
            :   
                <></>
            }
        </div>
        {showReplies && typeof props.sessions[props.selectedSession].comments[props.comment.id] !== 'undefined' ?
            props.sessions[props.selectedSession].comments[props.comment.id].map((reply, i) => {
                return <Fragment key={i}>
                    <Comment
                        comment={reply}
                        sessions={props.sessions}
                        selectedSession={props.selectedSession}
                        setSessions={props.setSessions}
                        tempComment={props.tempComment}
                        setTempComment={props.setTempComment}
                        setNotification={props.setNotification}
                        marginLeft={props.marginLeft + 3}
                        userData={props.userData}
                    ></Comment>
                </Fragment>
            })
        :
            <></>
        }
    </>
}

export default Comment;