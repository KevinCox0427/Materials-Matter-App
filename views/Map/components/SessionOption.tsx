import React, { FunctionComponent, useEffect, useState } from "react";
import { socket } from "../Map";
import { useDispatch, useSelector } from "../store/store";
import { setNotification } from "../store/notification";
import { removeNewSession } from "../store/tempSession";
import { setSelectedSession } from "../store/selectedSession";

type Props = {
    index: number
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

/**
 * A react component to render a comment session in the side menu to be able to edit its conents.
 * @param index. The index of this session in the sessions array. -1 means it's temporary.
 * @param userData (optional) Data of the logged in user.
 */
const SessionOption: FunctionComponent<Props> = (props) => {
    const sessions = useSelector(state => state.sessions);
    const selectedSession = useSelector(state => state.selectedSession);
    const dispatch = useDispatch();

    const [session, setSession] = useState(props.index === -1 ? useSelector(state => state.tempSession!) : sessions[props.index]);

    // State variable keeping track of whether the user is editing, and to keep track of the data on the session.
    const [isEditing, setIsEditing] = useState(sessions[props.index].id === -1);

    // Resetting initial states when inherited props change.
    useEffect(() => {
        setIsEditing(sessions[props.index].id === -1);
        if(props.index !== -1) setSession(sessions[props.index]);
    }, [sessions]);

    /**
     * Event handler to toggle between editing and viewing.
     */
    function toggleIsEditing() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            dispatch(setNotification('You must be an administrator to change comment sessions.'));
            return;
        }

        // This means it's being cancelled.
        if(isEditing) {
            // If it was a temporary session, then we need to delete it.
            if(props.index === -1) {
                dispatch(removeNewSession());
            }
            // Otherwise we'll just reload the initial state.
            else {
                setSession(sessions[props.index]);
            }
        }
        setIsEditing(!isEditing);
    }

    /**
     * Event handler to remove this session from the map.
     */
    function deleteSession() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            dispatch(setNotification('You must be an administrator to delete comment sessions.'));
            return;
        }
        socket.emit("deleteSession", session.id);
    }

    /**
     * Event handler to save the edits done to this session.
     */
    function saveSession() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            dispatch(setNotification('You must be an administrator to change comment sessions.'));
            return;
        }

        // Submitting the new session via Socket.io
        socket.emit("saveSession", {
            id: session.id,
            start: session.start,
            expires: session.expires,
            mapId: session.mapId,
            name: session.name,
        });
        setIsEditing(false);
    }

    /**
     * An event handler to change the value of the session name.
     * @param e The change event on the input
     */
    function changeSessionName(e: React.ChangeEvent<HTMLInputElement>) {
        const newSession = {...session};
        newSession.name = e.target.value;
        setSession(newSession);
    }

    /**
     * An event handler to change the datetime values on the start and end dates of the session.
     * @param e The change event of the input.
     * @param key Whether it's changing the start or end date value.
     * @param type Whether it's changing the date or time value.
     */
    function changeSessionTimes(e: React.ChangeEvent<HTMLInputElement>, key: 'start' | 'expires', type: 'date' | 'time') {
        const newSession = {...session};
        const newDate = type === 'date'
            ? `${e.target.value} ${newSession[key].split(' ')[1]}`
            : `${newSession[key].split(' ')[0]} ${e.target.value}`;

        newSession[key] = newDate;
        setSession(newSession);
    }

    /**
     * A helper function to convert HH:MM:SS to HH:MM:SS AM/PM.
     * @param time The inputted time string.
     */
    function toLocalTime(time:string) {
        return time.split(':').map((value, i) => Math.abs(parseInt(value) - (i === 0 && (parseInt(value) > 12 || parseInt(value) === 0) ? 12 : 0)).toString().padStart(2, '0')).join(':') + (parseInt(time.substring(0, 2)) >= 12 ? ' PM' : ' AM')
    }
    /**
     * A helper function to convert YYYY-MM-DD to MM:DD:YYYY
     * @param time The inputted date string.
     */
    function toLocalDate(date:string) {
        const dateArray = date.split('-');
        dateArray.push(dateArray.shift()!);
        return dateArray.map(value => parseInt(value)).join('/');
    }

    return <div className="SessionOption" style={{
        order: session.id === -1 ? 1 : 2
    }}>
        <div className="Row">
            <button
                className={props.index === selectedSession && !isEditing ? 'Activated' : ' '}
                onClick={() => {
                    if(isEditing) saveSession();
                    else dispatch(setSelectedSession(props.index === selectedSession ? -1 : props.index));
                }}
            >
                {isEditing 
                    ? <>
                        <i className="fa-solid fa-floppy-disk"></i>
                        Save
                    </> 
                    : props.index === selectedSession 
                        ? <>
                            <i className="fa-solid fa-x"></i>
                            Deselect
                        </> 
                        : <>
                            <i className="fa-solid fa-check"></i>
                            Select
                        </>}
            </button>
            <button className={isEditing ? 'Activated' : ' '} onClick={toggleIsEditing}>
                {isEditing 
                    ? <>
                        <i className="fa-solid fa-x"></i>
                        Cancel
                    </>
                    : <>
                        <i className="fa-solid fa-pen-to-square"></i>
                        Edit
                    </>}
            </button>
            {session.id !== -1 ? 
                <button onClick={deleteSession}>
                    <i className="fa-solid fa-trash-can"></i>
                    Delete
                </button> 
            : <></>}
        </div>
        <div className="Row">
            {isEditing ?
                <input
                    className="TitleInput"
                    value={session.name}
                    onChange={changeSessionName}
                ></input>
            :
                <h3>{session.name}</h3>
            }
        </div>
        <div className="Row">
            <div className="Column">
                <p>Starts:</p>
                {isEditing ?
                    <>
                        <input
                            value={session.start.split(' ')[1]}
                            type="time"
                            onChange={e => changeSessionTimes(e, 'start', 'time')}
                        ></input>
                        <input
                            value={session.start.split(' ')[0]}
                            type="date"
                            onChange={e => changeSessionTimes(e, 'start', 'date')}
                        ></input>
                    </>
                :
                    <p>
                        {toLocalTime(session.start.split(' ')[1])},
                        <br></br>
                        {toLocalDate(session.start.split(' ')[0])}
                    </p>
                }
            </div>
            <div className="Column">
                <p>Ends:</p>
                {isEditing ? 
                    <>
                        <input
                            value={session.expires.split(' ')[1]}
                            type="time"
                            onChange={e => changeSessionTimes(e, 'expires', 'time')}></input>
                        <input
                            value={session.expires.split(' ')[0]}
                            type="date"
                            onChange={e => changeSessionTimes(e, 'expires', 'date')}
                        ></input>
                    </>
                :
                    <p>
                        {toLocalTime(session.expires.split(' ')[1])},
                        <br></br>
                        {toLocalDate(session.expires.split(' ')[0])}
                    </p>
                }
            </div>
        </div>
    </div>
}

export default SessionOption;