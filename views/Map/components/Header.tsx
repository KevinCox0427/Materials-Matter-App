import React, { FunctionComponent, useEffect } from "react";
import { useDispatch, useSelector } from "../store/store";
import { changeMapName, insertNode, insertRow } from "../store/map";
import { setAction } from "../store/action";
import { setNotification } from "../store/notification";
import { closeSideMenu, setComment, setNode, setSessions, setTags } from "../store/sideMenuData";
import { addNewComment } from "../store/tempComment";
import { togglePreview } from "../store/preview";

type Props = {
    userData?: {
        userId: number,
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

/**
 * A component to render the header and all its actions.
 * @param userData (optional) Data of the logged in user.
 */
const Header: FunctionComponent<Props> = (props) => {
    const dispatch = useDispatch();
    const map = useSelector(state => state.map);
    const action = useSelector(state => state.action);
    const preview = useSelector(state => state.preview);
    const sideMenuData = useSelector(state => state.sideMenuData);
    const selectedSessionIndex = useSelector(state => state.selectedSession);
    const selectedSession = useSelector(state => state.sessions[state.selectedSession]);

    /**
     * Adding event listeners the old fashion way becuase I don't want to move all these functions up the component tree.
     */
    useEffect(() => {
        if(!action) return;
        (document.getElementById('Map') as HTMLDivElement).addEventListener('touchend', handleHeaderButtonEnd);
        (document.getElementById('Map') as HTMLDivElement).addEventListener('mouseup', handleHeaderButtonEnd);
    }, [action]);

    /**
     * Event handler to add whatever content is specified by the header button.
     */
    function handleHeaderButtonEnd(e:MouseEvent | TouchEvent) {
        if(!action) return;

        // Getting the target element that the cursor was on when mouse up.
        // This could be the map or a row.
        let target = e.target as HTMLElement;
        while(target.id !== 'Map' && !target.classList.contains('Row')) {
            // If the header button is being clicked, ignore.
            if(target.classList.contains(action)) return;
            target = target.parentElement as HTMLElement;
        }

        // Getting the mouse position.
        const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        // Determining what action to do based on the header button selected.
        switch(action) {
            // If we're adding a node, we'll add one to the row ID found on the target element.
            case 'AddNode':
                addNode(target, x);
                break;
            // If we're adding a row, we need to find the index based on mouse position and add an empty one to the map.
            case 'AddRow':
                addRow(target, y);
                break;
            // If we're just adding a comment, then we'll get the mouse position and just add it to the current session
            case 'AddComment':
                addComment(x, y);
                break;
        }

        // Resetting header button and event listeners.
        dispatch(setAction(''));
        (document.getElementById('Map') as HTMLDivElement).removeEventListener('touchend', handleHeaderButtonEnd);
        (document.getElementById('Map') as HTMLDivElement).removeEventListener('mouseup', handleHeaderButtonEnd);
    }

    /**
     * A function to add a node to the map based on mouse position.
     * @param target The element that is being hovered over.
     * @param x The x coordinate of the mouse position.
     */
    function addNode(target:HTMLElement, x:number) {
        if(isNaN(parseInt(target.id))) return;

        // Gettitng reference to the element responsible for wrapping the nodes and having a horiozontal scroll.
        const scrollElement = target.getElementsByClassName('Nodes')[0] as HTMLDivElement
        // Percent of the cursor's X position relative to the row, 0 is left side and 100 is right side.
        const xPercent = ((x - scrollElement.getBoundingClientRect().left + scrollElement.scrollLeft) / scrollElement.scrollWidth) * 100;
        // Percent of the spacing inbetween nodes for "space-around." This will be twice the length of the array.
        const indexPercent = 100 / (map.rows[parseInt(target.id)].nodes.length * 2);
        // Finding the mouse position in one of these spacing columns. This will be used to find the index of the new node.
        const nodeIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);
        const rowIndex = parseInt(target.id);

        // Adding a new node at the found index.
        dispatch(insertNode({
            nodeIndex: nodeIndex,
            rowIndex: rowIndex
        }));

        // Opening side menu to edit new node.
        dispatch(setNode({
            nodeIndex: nodeIndex,
            rowIndex: rowIndex
        }));
    }

    /**
     * A function to add a row to the map based on mouse position.
     * @param target The element that is being hovered over.
     * @param y The y coordinate of the mouse location.
     */
    function addRow(target:HTMLElement, y: number) {
        // Getting the row's middle in pixels from the top of the screen.
        const targetRect = target.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        const newRowIndex = target.id === 'Map'
            // If the target is the map, then it's either above or below every row.
            ? (y < targetMiddle ? 0 : map.rows.length)
            // Otherwise if the target it a row, then we can add the empty row directly above or below it based on the mouse position relative to the target's center.
            : (y < targetMiddle ? parseInt(target.id) : parseInt(target.id) + 1);

        // Inserting empty row.
        dispatch(insertRow(newRowIndex));

        // Since we're moving the maps content around, there's a chance the current side menu data pointer is incorrect.
        if(sideMenuData.type === 'node' && sideMenuData.dataPointer[0] >= newRowIndex) {
            dispatch(setNode({
                rowIndex: sideMenuData.dataPointer[0] + 1, 
                nodeIndex: sideMenuData.dataPointer[1]
            }));
        }
    }

    /**
     * Function to add a comment to the map based on mouse position.
     * @param x The x coordinate of the mouse location.
     * @param y The y coordinate of the mouse loation.
     */
    function addComment(x:number, y:number) {
        // If there's no current session to add the comment to, notify the user.
        if(!selectedSession) {
            dispatch(setNotification('You must have an active session to comment.'));
            return;
        }

        // If there's no user logged in, then you can't comment.
        if(!props.userData) {
            dispatch(setNotification('You must be logged in to comment.'));
            return;
        }

        const mapBody = document.getElementsByClassName('Body')[0] as HTMLDivElement;

        // Adding an empty comment
        dispatch(addNewComment({
            replyId: 0,
            sessionId: selectedSession.id,
            userData: props.userData,
            position: [
                Math.round((x / mapBody.clientWidth) * 100),
                Math.round(((y - mapBody.getBoundingClientRect().top) / mapBody.clientHeight) * 100)
            ]
        }));

        // Opening side menu to enter comment.
        dispatch(setComment({
            sessionIndex: selectedSessionIndex, 
            commentIndex: -1
        }));
    }

    /**
     * Event handler to toggle opening the comment sessions on the side menu.
     */
    function toggleSessions() {
        if(sideMenuData.type !== 'sessions') dispatch(setSessions());
        else dispatch(closeSideMenu());
    }

    /**
     * Event handler to toggle opening the tags on the side menu.
     */
    function toggleTags() {
        if(sideMenuData.type !== 'tags') dispatch(setTags());
        else dispatch(closeSideMenu());
    }

    /**
     * Function to submit the current map data to the server to be saved.
     */
    async function handleSaveMap() {
        if(props.userData) {
            const result = await (await fetch(`/map/${map.id > -1 ? map.id : 'new'}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(map)
            })).json();
            
            // If the message is a number, then its an id and we'll redirect to that page.
            if(typeof result.message === 'number') window.location.href = `/map/${result.message}`;
            // Otherwise just display the result.
            else dispatch(setNotification(result.message));
        }
        else {
            dispatch(setNotification('You must have a registered Binghamton University account to save.'));
        }
    }
    
    return <header className="Head">
        <div className="Group">
            <a href="/" className="Back">
                <i className="fa-solid fa-backward-step"></i>
                <p>Back</p>
            </a>
            <input value={map.name} onChange={e => dispatch(changeMapName(e.target.value))}></input>
        </div>
        <div className="Group">
            <button className="Preview" onClick={() => dispatch(togglePreview())}>
                {preview ? <i className="fa-solid fa-pen-to-square"></i> : <i className="fa-solid fa-eye"></i>}
                <p>{preview ? 'Edit' : 'Preview'}</p>
            </button>
            <button
                className={`AddComment ${action === 'AddComment' ? 'Activated' : ' '}`}
                onMouseDown={() => dispatch(setAction('AddComment'))}
                onTouchStart={() => dispatch(setAction('AddComment'))}
            >
                <i className="fa-solid fa-comment"></i>
                <p>Add Comment</p>
            </button>
            {preview
                ? <></>
                : <>
                    <button
                        className={`AddNode ${action === 'AddNode' ? 'Activated' : ' '}`}
                        onMouseDown={() => dispatch(setAction('AddNode'))}
                        onTouchStart={() => dispatch(setAction('AddNode'))}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <p>Add Node</p>
                    </button>
                    <button
                        className={`AddRow ${action === 'AddRow' ? 'Activated' : ' '}`} 
                        onMouseDown={() => dispatch(setAction('AddRow'))}
                        onTouchStart={() => dispatch(setAction('AddRow'))}
                    >
                        <i className="fa-solid fa-plus"></i>
                        <p>Add Row</p>
                    </button>
                    <button
                        className={`Tags ${sideMenuData?.type === 'tags' ? 'Activated' : ''}`}
                        onClick={() => toggleTags()}
                    >
                        <i className="fa-solid fa-tag"></i>
                        <p>Edit Tags</p>
                    </button>
                </>}
            <button
                className={`Sessions ${sideMenuData?.type === 'sessions' ? 'Activated' : ''}`}
                onClick={() => toggleSessions()}
            >
                <i className="fa-solid fa-bars"></i>
                <p>Sessions</p>
            </button>
            {preview 
                ? <></>
                    : <button className="Save" onClick={handleSaveMap}>
                    <i className="fa-solid fa-floppy-disk"></i>
                    <p>Save</p>
                </button>}
        </div>
    </header>
}

export default Header;