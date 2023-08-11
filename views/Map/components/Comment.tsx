import React, { Fragment, FunctionComponent, useEffect, useRef, useState } from "react";
import { socket } from '../Map';
import { setNotification } from "../store/notification";
import { addNewComment, removeTempComment } from "../store/tempComment";
import { useDispatch, useSelector } from "../store/store";

type Props = {
    comment: CommentDoc | undefined,
    marginLeft: number,
    userData?: {
        userId: number,
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

/**
 * A React component to recursively render a comment on the side menu and all its replies.
 * @param comment The comment's data to start the recursion.
 * @param marginLeft The amount of margin left this comment need.
 * @param userData (optional) Data of the logged in user.
 */
const Comment: FunctionComponent<Props> = (props) => {
    if(!props.comment) return <></>;
    const dispatch = useDispatch();

    // State variables to keep track of a comment's content and whether its replies are visible.
    const [showReplies, setShowReplies] = useState(true);
    const [commentMessage, setCommentMessage] = useState('');
    const selectedSession = useSelector(state => state.sessions[state.selectedSession]);

    /**
     * Event handler to change the text of a comment.
     */
    function changeMessage(e:React.ChangeEvent<HTMLTextAreaElement>) {
        if(e.target.value.charAt(e.target.value.length-1) === '\n') {
            post();
            return;
        }
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
        // A user must be logged in to reply.
        if(!props.userData) {
            dispatch(setNotification('You must be logged in to comment.'));
            return;
        }

        // Setting the temp comment state variable.
        addNewComment({
            userData: props.userData!,
            sessionId: selectedSession.id,
            replyId: props.comment!.id
        });
    }

    /**
     * Event handler to send the comment to the server to be stored in the database.
     */
    function post() {
        socket.emit("postComment", {
            content: commentMessage,
            x: props.comment!.x ? props.comment!.x : -1,
            y: props.comment!.y ? props.comment!.y : -1,
            userId: props.comment!.userId,
            commentsessionId: props.comment!.commentsessionId,
            replyId: props.comment!.replyId ? props.comment!.replyId : -1
        });

        // Deleting the temp comment that was uploaded.
        removeTempComment();
    }

    /**
     * If the comment has a textarea element, then we'll focus it when this comment is created.
     */
    const commentEl = useRef<HTMLDivElement>(null);

    /**
     * Callback function to focus the text area when editing.
     */
    useEffect(() => {
        if(!commentEl.current) return;
        const textarea = commentEl.current.getElementsByTagName('textarea')[0];
        if(textarea) textarea.focus();
    }, [commentEl]);

    /**
     * A helper function to convert YYYY-MM-DD to MM:DD:YYYY
     * @param time The inputted date string.
     */
    function toLocalDate(date:string) {
        const dateArray = date.split('-');
        dateArray.push(dateArray.shift()!);
        return dateArray.map(value => parseInt(value)).join('/');
    }

    return <>
        <div className="Comment" ref={commentEl} style={{
            marginLeft: `${props.marginLeft}em`
        }}>
            <div className="Top">
                <h3>{props.comment.firstName} {props.comment.lastName}</h3>
                {props.comment.id === -1
                    ? <button className="Reply" onClick={post}>post</button>
                    : <button className="Reply" onClick={reply}>reply</button>}
                {props.comment.id === -1
                    ? <button className="Reply" onClick={() => removeTempComment}>cancel</button>
                    : <></>}
                <p>{toLocalDate(props.comment.timestamp.split(' ')[0])}</p>
            </div>
            {props.comment.id === -1
                ? <textarea
                    className="EditContent"
                    placeholder="Enter your comment..."
                    value={commentMessage}
                    onChange={changeMessage}
                ></textarea>
                : <p className="Content">{props.comment.content}</p>}
            {props.comment.replyId !== null && typeof selectedSession.comments[props.comment.id] !== 'undefined' && selectedSession.comments[props.comment.id].length > 0
                ? <button
                    className={`HideReplies ${showReplies ? ' ' : 'Activated'}`}
                    onClick={() => setShowReplies(!showReplies)}
                >
                    <div className="Triangle"></div>
                </button>
                : <></>}
        </div>
        {showReplies && typeof selectedSession.comments[props.comment.id] !== 'undefined'
            ? selectedSession.comments[props.comment.id].map((reply, i) => {
                return <Fragment key={i}>
                    <Comment
                        comment={reply}
                        marginLeft={props.marginLeft + 3}
                        userData={props.userData}
                    ></Comment>
                </Fragment>
            })
            : <></>}
    </>
}

export default Comment;