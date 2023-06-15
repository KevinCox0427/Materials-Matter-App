import React, { FunctionComponent, useEffect, useState } from "react";

type Props = {
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
    setTempComment:  React.Dispatch<React.SetStateAction<Props['tempComment']>>,
    userData: {
        userId: number,
        firstName: string,
        lastName: string,
        image: string
    }
}

const Header: FunctionComponent<Props> = (props) => {
    /**
     * State variable representing what button on the header is currently selected.
     */
    const [headerButton, setHeaderButton] = useState('');

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
    function handleHeaderButtonStart(name:string) {
        setHeaderButton(name);
    }

    /**
     * Adding event listeners the old fashion way becuase I don't want to move all these functions up the component tree.
     */
    useEffect(() => {
        if(!headerButton) return;
        (document.getElementById('Map') as HTMLDivElement).addEventListener('touchend', handleHeaderButtonEnd);
        (document.getElementById('Map') as HTMLDivElement).addEventListener('mouseup', handleHeaderButtonEnd);
    }, [headerButton]);

    /**
     * Event handler to add whatever content is specified by the header button.
     */
    function handleHeaderButtonEnd(e:MouseEvent | TouchEvent) {
        if(!headerButton) return;

        /**
         * Getting the target element that the cursor was on when mouse up.
         * This could be the map or a row.
         */
        let target = e.target as HTMLElement;
        while(target.id !== 'Map' && !target.classList.contains('Row')) {
            /**
             * If the header button is being clicked, ignore.
             */
            if(target.classList.contains(headerButton)) return;
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
        switch(headerButton) {
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
        setHeaderButton('');
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

        // Gettitng reference to the element responsible for wrapping the nodes and having a horiozontal scroll.
        const scrollElement = target.getElementsByClassName('Nodes')[0] as HTMLDivElement
        // Percent of the cursor's X position relative to the row, 0 is left side and 100 is right side.
        const xPercent = ((x - scrollElement.getBoundingClientRect().left + scrollElement.scrollLeft) / scrollElement.scrollWidth) * 100;
        // Percent of the spacing inbetween nodes for "space-around." This will be twice the length of the array.
        const indexPercent = 100 / (props.map.rows[parseInt(target.id)].nodes.length * 2);
        // Finding the mouse position in one of these spacing columns. This will be used to find the index of the new node.
        const newIndex = Math.ceil(Math.floor(xPercent / indexPercent) / 2);

        /**
         * Adding a new node at the found index.
         */
        const newMap = {...props.map}

        newMap.rows[parseInt(target.id)].nodes.splice(newIndex, 0, {
            id: -1,
            rowId: newMap.rows[parseInt(target.id)].id,
            name: 'New Node',
            index: newIndex,
            gallery: [],
            htmlContent: ''  
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
            dataPointer: [newMap.rows[parseInt(target.id)].index, newIndex] 
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
        const mapBody = document.getElementsByClassName('Body')[0] as HTMLDivElement;
        const newSessions = [...props.sessions];

        /**
         * If there's already a temp comment, remove it.
         */
        if(props.tempComment) {
            newSessions[props.selectedSession].comments[props.tempComment.replyId].splice(props.tempComment.commentIndex, 1);
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

    function openSessions() {
        props.setSideMenuData({
            type: 'sessions',
            dataPointer: [0, 0]     // doesn't really matter
        })
    }
    
    return <header className="Head">
        <a href="/" className="Back">
            <i className="fa-solid fa-backward-step"></i>
        </a>
        <input value={props.map.name} onChange={handleNameChange}></input>
        <div className="Buttons">
            <button className={`AddComment ${headerButton === 'AddComment' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddComment')}} onTouchStart={e => {handleHeaderButtonStart('AddComment')}}>
                <i className="fa-solid fa-comment"></i>
                <p>Add Comment</p>
            </button>
            <button className={`AddNode ${headerButton === 'AddNode' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddNode')}} onTouchStart={e => {handleHeaderButtonStart('AddNode')}}>
                <i className="fa-solid fa-plus"></i>
                <p>Add Node</p>
            </button>
            <button className={`AddRow ${headerButton === 'AddRow' ? 'Activated' : ' '}`} onMouseDown={e => {handleHeaderButtonStart('AddRow')}} onTouchStart={e => {handleHeaderButtonStart('AddRow')}}>
                <i className="fa-solid fa-plus"></i>
                <p>Add Row</p>
            </button>
            <button className="Save">
                <i className="fa-solid fa-floppy-disk"></i>
                <p>Save</p>
            </button>
            <button className="Sessions" onClick={openSessions}>
                <i className="fa-solid fa-bars"></i>
                <p>Sessions</p>
            </button>
        </div>
    </header>
}

export default Header;