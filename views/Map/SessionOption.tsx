import React, { FunctionComponent, useEffect, useState } from "react";

type Props = {
    isSelected: boolean,
    index: number
    sessions: FullSessionDoc[],
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    setSelectedSession: React.Dispatch<React.SetStateAction<number>>
}

const SessionOption: FunctionComponent<Props> = (props) => {
    const [isEditing, setIsEditing] = useState(props.sessions[props.index].id === -1);
    const [session, setSession] = useState(props.sessions[props.index]);

    /**
     * Resetting initial states when inherited props change..
     */
    useEffect(() => {
        setIsEditing(props.sessions[props.index].id === -1);
        setSession(props.sessions[props.index]);
    }, [props.sessions]);

    function toggleIsEditing() {
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

    function toggleSessionSelection() {
        props.setSelectedSession(props.isSelected ? -1 : props.index);
    }

    function handleChangeName(e:React.ChangeEvent<HTMLInputElement>) {
        setSession({...session,
            name: e.target.value
        })
    }

    function handleDeleteSession() {
        let newSessions = [...props.sessions];
        newSessions.splice(props.index, 1);
        props.setSessions(newSessions);
    }

    function handleSaveSession() {
        let newSessions = [...props.sessions];
        newSessions[props.index] = {...session};
        props.setSessions(newSessions);
        setIsEditing(false);
    }

    function handleDateChange(e:React.ChangeEvent<HTMLInputElement>, key:'start' | 'expires', type:'date' | 'time') {
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
                    handleSaveSession();
                }
                else {
                    toggleSessionSelection();
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
            <button onClick={() => {handleDeleteSession()}}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        <div className="Row">
            {isEditing ?
                <input className="TitleInput" value={session.name} onChange={handleChangeName}></input>
            :
                <h3>{props.sessions[props.index].name}</h3>
            }
        </div>
        <div className="Row">
            <div className="Column">
                <p>Starts:</p>
                {isEditing ?
                    <>
                        <input value={session.start.split('T')[1].replace('Z', '')} type="time" onChange={e => handleDateChange(e, 'start', 'time')}></input>
                        <input value={session.start.split('T')[0]} type="date" onChange={e => handleDateChange(e, 'start', 'date')}></input>
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
                        <input value={session.expires.split('T')[1].replace('Z', '')} type="time" onChange={e => handleDateChange(e, 'expires', 'time')}></input>
                        <input value={session.expires.split('T')[0]} type="date" onChange={e => handleDateChange(e, 'expires', 'date')}></input>
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