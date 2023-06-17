import React, { FunctionComponent, useEffect, useState } from "react";

type Props = {
    isSelected: boolean,
    index: number
    sessions: FullSessionDoc[],
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
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
     * Event handler to remove this session from the map.
     */
    function deleteSession() {
        // Only admins can edit, add, or delete sessions
        if(!props.userData || (props.userData && !props.userData.isAdmin)) {
            props.setNotification('You must be an administrator to delete comment sessions.');
            return;
        }

        let newSessions = [...props.sessions];
        newSessions.splice(props.index, 1);
        props.setSessions(newSessions);
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

        let newSessions = [...props.sessions];
        newSessions[props.index] = {...session};
        props.setSessions(newSessions);
        setIsEditing(false);
    }

    /**
     * Event handler to change the start and expiration times based on the time and date input elements.
     * @param key Whether the start or expiration time is being changed
     * @param type Whether the date or time of day is being changed.
     */
    function changeTimes(e:React.ChangeEvent<HTMLInputElement>, key:'start' | 'expires', type:'date' | 'time') {
        const newDate = type === 'date' ? `${e.target.value}T${session[key].split('T')[1]}` : `${session[key].split('T')[0]}T${e.target.value}Z`;
        setSession({...session,
            [key]: newDate
        });
    }

    return <div className="SessionOption" style={{
        order: session.id === -1 ? 1 : 2
    }}>
        <div className="Row">
            <button className={props.isSelected && !isEditing ? 'Activated' : ' '} onClick={() => {
                if(isEditing) {
                    saveSession();
                }
                else {
                    selectSession();
                }
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
            <button onClick={deleteSession}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
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
                        <input value={session.start.split('T')[1].replace('Z', '')} type="time" onChange={e => changeTimes(e, 'start', 'time')}></input>
                        <input value={session.start.split('T')[0]} type="date" onChange={e => changeTimes(e, 'start', 'date')}></input>
                    </>
                :
                    <p>
                        {(new Date(props.sessions[props.index].start)).toLocaleString().split(', ')[1]},
                        <br></br>
                        {(new Date(props.sessions[props.index].start)).toLocaleString().split(', ')[0]}
                    </p>
                }
            </div>
            <div className="Column">
                <p>Ends:</p>
                {isEditing ? 
                    <>
                        <input value={session.expires.split('T')[1].replace('Z', '')} type="time" onChange={e => changeTimes(e, 'expires', 'time')}></input>
                        <input value={session.expires.split('T')[0]} type="date" onChange={e => changeTimes(e, 'expires', 'date')}></input>
                    </>
                :
                    <p>
                        {(new Date(props.sessions[props.index].expires)).toLocaleString().split(', ')[1]},
                        <br></br>
                        {(new Date(props.sessions[props.index].expires)).toLocaleString().split(', ')[0]}
                    </p>
                }
            </div>
        </div>
    </div>
}

export default SessionOption;