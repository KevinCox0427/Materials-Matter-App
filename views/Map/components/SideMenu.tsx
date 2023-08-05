import React, { Fragment, FunctionComponent } from "react";
import NodeSideMenu from "./NodeSideMenu";
import Comment from "./Comment";
import SessionOption from "./SessionOption";
import TagsEditor from "./TagsEditor";
import { useDispatch, useSelector } from "../store/store";
import { addNewSession } from "../store/tempSession";

type Props = {
    userData: UserData
}

const SideMenu: FunctionComponent<Props> = (props) => {
    const dispatch = useDispatch();
    const sideMenuData = useSelector(state => state.sideMenuData);
    const sessions = useSelector(state => state.sessions);
    const selectedSession = useSelector(state => state.selectedSession);
    
    return <div className={`SideMenuScroll ${sideMenuData ? 'Opened' : ' '}`}>
        {sideMenuData ? <>
            {sideMenuData.type === 'node' ? 
                <NodeSideMenu
                    userData={props.userData}
                ></NodeSideMenu>
            : <></>}
            {sideMenuData.type === 'comment' ?
                <div className="comment">
                    <Comment
                        comment={selectedSession > -1 && sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]] ? 
                        sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]][sideMenuData.dataPointer[1]] : undefined}
                        marginLeft={0}
                        userData={props.userData}
                    ></Comment>
                </div>
            : <></>}
            {sideMenuData.type === 'sessions' ? 
                <div className="sessions">
                    <h2>Comment Sessions:</h2>
                    <button className="AddSession" onClick={() => dispatch(addNewSession())}>+ New Session</button>
                    {sessions.map((_, i) => {
                        return <Fragment key={i}>
                            <SessionOption
                                index={i}
                                userData={props.userData}
                            ></SessionOption>
                        </Fragment>
                    })}
                </div>
            : <></>}
            {sideMenuData.type === 'tags' ? 
                <TagsEditor />
            : <></>}
        </> : <></>}
    </div>
}

export default SideMenu;