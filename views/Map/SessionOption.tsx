import React, { FunctionComponent, useEffect, useState } from "react";
import { socket } from "./Map";

type Props = {
    isSelected: boolean,
    index: number
    sessions: FullSessionDoc[],
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    selectedSession: number,
    setSelectedSession: React.Dispatch<React.SetStateAction<number>>,
    setNotification: React.Dispatch<React.SetStateAction<string>>,
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
 * 
 * @param isSelected A boolean representing whether it's been selected by the user.
 * @param index. The index of this session in the sessions array.
 * @param sessions A state varialbe of an array of sessions for all the comments.
 * @param setSessions A set state function to edit the data of the sessions.
 * @param selectedSession A number representing the index of the currently selected session in the sessions array.
 * @param setSelectedSession A set state function to change which session is selected.
 * @param setNotification A set state function to open a pop-up menu to notify the user.
 * @param userData (optional) Data of the logged in user.
 */
const SessionOption: FunctionComponent<Props> = (props) => {
    /**
     * State variable keeping track of whether the user is editing, and to keep track of the data on the session.
     */
    const [isEditing, setIsEditing] = useState(props.sessions[props.index].id === -1);
    const [session, setSession] = useState(props.sessions[props.index]);

    /**
     * Resetting initial states when inherited props change..
     */
    useEffect(() => {
        setIsEditing(props.sessions[props.index].id === -1);
        setSession(props.sessions[props.index]);
    }, [props.sessions]);

    /**
     * Event handler to toggle between editing and viewing.
     */
    function toggleIsEditing() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            props.setNotification('You must be an administrator to change comment sessions.');
            return;
        }

        // This means it's being cancelled.
        if(isEditing) {
            /**
             * If it was a temporary session, then we need to delete it
             */
            if(session.id === -1) {
                const newSessions = [...props.sessions];
                newSessions.splice(newSessions.length-1, 1);
                props.setSessions(newSessions);
            }
            /**
             * Otherwise we'll just reload the initial state.
             */
            else {
                setSession(props.sessions[props.index]);
            }
        }
        setIsEditing(!isEditing);
    }

    /**
     * Event handler to select this session on the map.
     */
    function selectSession() {
        props.setSelectedSession(props.isSelected ? -1 : props.index);
    }

    /**
     * Event handler to change the session's name from the input element.
     */
    function changeName(e:React.ChangeEvent<HTMLInputElement>) {
        setSession({...session,
            name: e.target.value
        })
    }

    /**
     * Event handler to change the start and expiration times based on the time and date input elements.
     * @param key Whether the start or expiration time is being changed
     * @param type Whether the date or time of day is being changed.
     */
    function changeTimes(e:React.ChangeEvent<HTMLInputElement>, key:'start' | 'expires', type:'date' | 'time') {
        const newDate = type === 'date' ? `${e.target.value} ${session[key].split(' ')[1]}` : `${session[key].split(' ')[0]} ${e.target.value}`;

        setSession({...session,
            [key]: newDate
        });
    }

    /**
     * Event handler to remove this session from the map.
     */
    function deleteSession() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            props.setNotification('You must be an administrator to delete comment sessions.');
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
            props.setNotification('You must be an administrator to change comment sessions.');
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
     * Callback funciton when we recieve a new sesison from Socket.io
     */
    useEffect(() => {
        socket.on('recieveSession', addSession);
        socket.on('recieveDeleteSession', confirmDeleteSession);
    }, [socket, addSession, confirmDeleteSession]);

    /**
     * Helper function to add or edit the session recieved from Socket.io
     * @param newSession The data representing the new or editted session, or a string error message.
     */
    function addSession(newSession: FullSessionDoc | string) {
        // If it's a string, that means it's an error message.
        if(typeof newSession === 'string') {
            props.setNotification(newSession);
            return;
        }

        // Finding the session's index given its id.
        const newSessions = [...props.sessions];
        const sessionIndex = newSessions.reduce((previousIndex, session, currentIndex) => {
            return session.id === (newSession as FullSessionDoc).id ? currentIndex : previousIndex;
        }, -1);

        // If not found, push the new session
        if(sessionIndex === -1) {
            newSessions.push({...newSession,
                comments: {}
            });
        }
        // Otherwise overwrite the previous one.
        else {
            newSession = {...newSession,
                comments: newSessions[sessionIndex].comments ? newSessions[sessionIndex].comments : {}
            }
            newSessions[sessionIndex] = newSession
        }

        // Removing any temp sessions.
        const tempSessionIndex = newSessions.reduce((previousIndex, session, currentIndex) => {
            return session.id === -1 ? currentIndex : previousIndex;
        }, -1);
        if(tempSessionIndex > -1) {
            newSessions.splice(tempSessionIndex, 1);
        }
        
        props.setSessions(newSessions);
    }

    /**
     * Helper function to remove the comment session at a given id from Socket.io.
     * @param id The id of the session to be removed.
     */
    function confirmDeleteSession(id:number | string) {
        // If it's a string, that means it's an error message.
        if(typeof id === 'string') {
            props.setNotification(id);
            return;
        }

        // Getting the index of the session by its id.
        const index = props.sessions.reduce((previousIndex, session, currentIndex) => {
            return session.id === id ? currentIndex : previousIndex;
        }, -1);

        if(index === -1) return;

        // If the user currently is selecting this session, unselect it.
        if(props.selectedSession === index) {
            props.setSelectedSession(-1);
        } 

        let newSessions = [...props.sessions];
        newSessions.splice(index, 1);
        props.setSessions(newSessions);
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
            <button className={props.isSelected && !isEditing ? 'Activated' : ' '} onClick={() => {
                if(isEditing) saveSession();
                else selectSession();
            }}>
                {isEditing ? <>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save
                </> :
                    props.isSelected ? <>
                        <i className="fa-solid fa-x"></i>
                        Deselect
                    </> : <>
                        <i className="fa-solid fa-check"></i>
                        Select
                    </> 
            }
            </button>
            <button className={isEditing ? 'Activated' : ' '} onClick={toggleIsEditing}>
                {isEditing ? <>
                    <i className="fa-solid fa-x"></i>
                    Cancel
                </> : <>
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
                <input className="TitleInput" value={session.name} onChange={changeName}></input>
            :
                <h3>{props.sessions[props.index].name}</h3>
            }
        </div>
        <div className="Row">
            <div className="Column">
                <p>Starts:</p>
                {isEditing ?
                    <>
                        <input value={session.start.split(' ')[1]} type="time" onChange={e => changeTimes(e, 'start', 'time')}></input>
                        <input value={session.start.split(' ')[0]} type="date" onChange={e => changeTimes(e, 'start', 'date')}></input>
                    </>
                :
                    <p>
                        {toLocalTime(props.sessions[props.index].start.split(' ')[1])},
                        <br></br>
                        {toLocalDate(props.sessions[props.index].start.split(' ')[0])}
                    </p>
                }
            </div>
            <div className="Column">
                <p>Ends:</p>
                {isEditing ? 
                    <>
                        <input value={session.expires.split(' ')[1]} type="time" onChange={e => changeTimes(e, 'expires', 'time')}></input>
                        <input value={session.expires.split(' ')[0]} type="date" onChange={e => changeTimes(e, 'expires', 'date')}></input>
                    </>
                :
                    <p>
                        {toLocalTime(props.sessions[props.index].expires.split(' ')[1])},
                        <br></br>
                        {toLocalDate(props.sessions[props.index].expires.split(' ')[0])}
                    </p>
                }
            </div>
        </div>
    </div>
}

export default SessionOption;