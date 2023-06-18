import React, { FunctionComponent, useEffect } from "react";

type Props = {
    action: 'AddComment' | 'AddNode' | 'MoveNode' | 'AddRow' | '',
    setAction: React.Dispatch<React.SetStateAction<Props["action"]>>,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    sessions: FullSessionDoc[],
    selectedSession: number,
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    sideMenuData: {
        type: 'node' | 'comment' | 'sessions',
        dataPointer: [number, number]
    } | null,
    setSideMenuData: React.Dispatch<React.SetStateAction<Props["sideMenuData"]>>,
    tempComment: {
        replyId: number;
        commentIndex: number;
    } | null
    setTempComment: React.Dispatch<React.SetStateAction<Props['tempComment']>>,
    setNotification: React.Dispatch<React.SetStateAction<string>>
    userData?: {
        userId: number,
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

const Header: FunctionComponent<Props> = (props) => {
    /**
     * Event handler to change the name of the map
     * @param e The change event from the HTML input.
     */
    function handleNameChange(e:React.ChangeEvent<HTMLInputElement>) {
        props.setMap((oldMap) => {
            return {...oldMap,
                name: e.target.value
            }
        })
    }

    /**
     * Function to start the header button's event listeners to the map.
     * @param name The header button to start.
     */
    function handleHeaderButtonStart(name:'AddComment' | 'AddNode' | 'AddRow' | '') {
        props.setAction(name);
    }

    /**
     * Adding event listeners the old fashion way becuase I don't want to move all these functions up the component tree.
     */
    useEffect(() => {
        if(!props.action) return;
        (document.getElementById('Map') as HTMLDivElement).addEventListener('touchend', handleHeaderButtonEnd);
        (document.getElementById('Map') as HTMLDivElement).addEventListener('mouseup', handleHeaderButtonEnd);
    }, [props.action]);

    /**
     * Event handler to add whatever content is specified by the header button.
     */
    function handleHeaderButtonEnd(e:MouseEvent | TouchEvent) {
        if(!props.action) return;

        /**
         * Getting the target element that the cursor was on when mouse up.
         * This could be the map or a row.
         */
        let target = e.target as HTMLElement;
        while(target.id !== 'Map' && !target.classList.contains('Row')) {
            /**
             * If the header button is being clicked, ignore.
             */
            if(target.classList.contains(props.action)) return;
            target = target.parentElement as HTMLElement;
        }

        /**
         * Getting the mouse position.
         */
        const x = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

        /**
         * Determining what action to do based on the header button selected.
         */
        switch(props.action) {
            /**
             * If we're adding a node, we'll add one to the row ID found on the target element.
             */
            case 'AddNode':
                addNode(target, x);
                break;
            /**
             * If we're adding a row, we need to find the index based on mouse position and add an empty one to the map.
             */
            case 'AddRow':
                addRow(target, y);
                break;
            /**
             * If we're just adding a comment, then we'll get the mouse position and just add it to the current session
             */
            case 'AddComment':
                addComment(x, y);
                break;
        }

        /**
         * Resetting header button and event listeners.
         */
        props.setAction('');
        (document.getElementById('Map') as HTMLDivElement).removeEventListener('touchend', handleHeaderButtonEnd);
        (document.getElementById('Map') as HTMLDivElement).removeEventListener('mouseup', handleHeaderButtonEnd);
    }

    /**
     * A function to add a node to the map based on mouse position.
     * 
     * @param target The element that is being hovered over.
     * @param x The x coordinate of the mouse position.
     */
    function addNode(target:HTMLElement, x:number) {
        if(isNaN(parseInt(target.id))) return;

        /**
         * Finding the index position of the new node based on the X position of the cursor.
         * Since the wrapper has "space-around" for its justify-content, the space inbetween the nodes are not even.
         */
        const newMap = {...props.map}

        // Gettitng reference to the element responsible for wrapping the nodes and having a horiozontal scroll.
        const scrollElement = target.getElementsByClassName('Nodes')[0] as HTMLDivElement
        // Percent of the cursor's X position relative to the row, 0 is left side and 100 is right side.
        const xPercent = ((x - scrollElement.getBoundingClientRect().left + scrollElement.scrollLeft) / scrollElement.scrollWidth) * 100;
        // Percent of the spacing inbetween nodes for "space-around." This will be twice the length of the array.
        const indexPercent = 100 / (props.map.rows[parseInt(target.id)].nodes.length * 2);
        // Finding the mouse position in one of these spacing columns. This will be used to find the index of the new node.
        const nodeIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);
        const rowIndex = parseInt(target.id);

        /**
         * Adding a new node at the found index.
         */
        newMap.rows[parseInt(target.id)].nodes.splice(nodeIndex, 0, {
            id: -1,
            rowId: newMap.rows[rowIndex].id,
            name: 'New Node',
            index: nodeIndex,
            gallery: [],
            htmlContent: ''  
        });

        /**
         * Updating the indeces for all nodes
         */
        newMap.rows[parseInt(target.id)].nodes = newMap.rows[parseInt(target.id)].nodes.map((node, i) => {
            return {...node,
                index: i
            }
        });

        /**
         * Updating state to reflect changes.
         */
        props.setMap(newMap);

        /**
         * Opening side menu to enter content.
         */
        props.setSideMenuData({
            type: 'node',
            dataPointer: [rowIndex, nodeIndex] 
        });
    }

    /**
     * A function to add a row to the map based on mouse position.
     * 
     * @param target The element that is being hovered over.
     * @param y The y coordinate of the mouse location.
     */
    function addRow(target:HTMLElement, y: number) {
        /**
         * Getting the row's middle in pixels from the top of the screen.
         */
        const targetRect = target.getBoundingClientRect();
        const targetMiddle = targetRect.top + (targetRect.height / 2);

        const newRowIndex = target.id === 'Map' ?
            /**
             * If the target is the map, then it's either above or below every row.
             */
            (y < targetMiddle ? 0 : props.map.rows.length) : 
            /**
             * Otherwise if the target it a row, then we can add the empty row directly above or below it based on the mouse position relative to the target's center.
             */
            (y < targetMiddle ? parseInt(target.id) : parseInt(target.id) + 1);

        /**
         * Inserting empty row and updating state.
         */
        const newMap = {...props.map};
        newMap.rows.splice(newRowIndex, 0, {
            id: -1,
            mapId: props.map.id,
            index: newRowIndex,
            name: 'New Row',
            nodes: []
        });

        /**
         * Updating the indeces for all rows
         */
        newMap.rows = newMap.rows.map((row, i) => {
            return {...row,
                index: i
            }
        });

        /**
         * Since we're moving the maps content around, there's a chance the current side menu data pointer is incorrect.
         * So, now we'll update it.
         */
        if(props.sideMenuData && props.sideMenuData.type === 'node' && props.sideMenuData.dataPointer[0] >= newRowIndex) {
            props.setSideMenuData({
                type: 'node',
                dataPointer: [props.sideMenuData.dataPointer[0] + 1, props.sideMenuData.dataPointer[1]]
            });
        }

        props.setMap(newMap);
    }

    /**
     * Function to add a comment to the map based on mouse position.
     * 
     * @param x The x coordinate of the mouse location.
     * @param y The y coordinate of the mouse loation.
     */
    function addComment(x:number, y:number) {
        /**
         * If there's no current session to add the comment to, notify the user.
         */
        if(!props.sessions[props.selectedSession]) {
            props.setNotification('You must have an active session to comment.')
            return;
        }

        /**
         * If there's no user logged in, then you can't comment.
         */
        if(!props.userData) {
            props.setNotification('You must be logged in to comment.')
            return;
        }

        const mapBody = document.getElementsByClassName('Body')[0] as HTMLDivElement;
        const newSessions = [...props.sessions];

        /**
         * If there's already a temp comment, remove it.
         */
        if(props.tempComment) {
            newSessions[props.selectedSession].comments[props.tempComment.replyId].splice(props.tempComment.commentIndex, 1);
        }

        /**
         * If the array of map comments doesn't exits, then create it.
         */
        if(!newSessions[props.selectedSession].comments['0']) {
            newSessions[props.selectedSession].comments = {...newSessions[props.selectedSession].comments,
                ['0']: []
            }
        }

        /**
         * Setting the temp comment state variable.
         */
        props.setTempComment({
            replyId: 0,
            commentIndex: newSessions[props.selectedSession].comments['0'].length
        });

        /**
         * Opening side menu to enter comment.
         */
        props.setSideMenuData({
            type: 'comment',
            dataPointer: [props.selectedSession, newSessions[props.selectedSession].comments['0'].length]  
        });

        /**
         * Adding an empty comment
         */
        newSessions[props.selectedSession].comments['0'].push({
            ...props.userData,
            id: -1,
            replyId: null,
            timestamp: (new Date()).toLocaleString().split(', ')[0],
            content: '',
            commentsessionId: props.sessions[props.selectedSession].id,
            x: (x / mapBody.clientWidth) * 100,
            y: ((y - mapBody.getBoundingClientRect().top) / mapBody.clientHeight) * 100
        });

        props.setSessions(newSessions)
    }

    /**
     * Event handler to toggle opening the comment sessions on the side menu.
     */
    function toggleSessions() {
        props.setSideMenuData(props.sideMenuData && props.sideMenuData.type === 'sessions' ? null : {
            type: 'sessions',
            dataPointer: [0, 0]     // doesn't really matter
        });
    }

    /**
     * Function to submit the current map data to the server to be saved.
     */
    async function handleSaveMap() {
        if(props.userData) {
            const result = await (await fetch(`/map/${props.map.id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(props.map)
            })).json();
            
            props.setNotification(result.message);
        }
        else {
            props.setNotification('You must have a registered Binghamton University account to save.')
        }
    }
    
    return <header className="Head">
        <a href="/" className="Back">
            <i className="fa-solid fa-backward-step"></i>
        </a>
        <input value={props.map.name} onChange={handleNameChange}></input>
        <div className="Buttons">
            <button className={`AddComment ${props.action === 'AddComment' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddComment')}} onTouchStart={e => {handleHeaderButtonStart('AddComment')}}>
                <i className="fa-solid fa-comment"></i>
                <p>Add Comment</p>
            </button>
            <button className={`AddNode ${props.action === 'AddNode' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddNode')}} onTouchStart={e => {handleHeaderButtonStart('AddNode')}}>
                <i className="fa-solid fa-plus"></i>
                <p>Add Node</p>
            </button>
            <button className={`AddRow ${props.action === 'AddRow' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddRow')}} onTouchStart={e => {handleHeaderButtonStart('AddRow')}}>
                <i className="fa-solid fa-plus"></i>
                <p>Add Row</p>
            </button>
            <button className="Save" onClick={handleSaveMap}>
                <i className="fa-solid fa-floppy-disk"></i>
                <p>Save</p>
            </button>
            <button className="Sessions" onClick={toggleSessions}>
                <i className="fa-solid fa-bars"></i>
                <p>Sessions</p>
            </button>
        </div>
    </header>
}

export default Header;