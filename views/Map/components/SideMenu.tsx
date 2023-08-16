import React, { Fragment, FunctionComponent } from "react";
import Comment from "./Comment";
import SessionOption from "./SessionOption";
import TagsEditor from "./TagsEditor";
import { useDispatch, useSelector } from "../store/store";
import { addNewSession } from "../store/tempSession";
import NodeEditor from "./NodeEditor";
import { setNotification } from "../store/notification";
import NodeViewer from "./NodeViewer";

type Props = {
    userData: UserData
}

const SideMenu: FunctionComponent<Props> = (props) => {
    const dispatch = useDispatch();
    const mapId = useSelector(state => state.map.id);
    const sideMenuData = useSelector(state => state.sideMenuData);
    const tempSession = useSelector(state => state.tempSession);
    const tempComment = useSelector(state => state.tempComment);
    const sessions = useSelector(state => state.sessions);
    const selectedSession = useSelector(state => state.selectedSession);
    const preview = useSelector(state => state.preview);

    function addSession() {
        if(!props.userData) {
            dispatch(setNotification('You must be an administrator to add sessions.'));
        }
        else {
            dispatch(addNewSession(mapId));
        }
    }
    
    return <div
        className="SideMenuScroll"
        style={{
            flexBasis: sideMenuData.type === 'closed' ? '0em' : `clamp(25em, 45vw, ${sideMenuData.type === 'comment' || sideMenuData.type === 'sessions' ? 30 : 45}em)`
        }}>
        {sideMenuData.type === 'closed'
            ? <></>
            : <>
                {sideMenuData.type === 'node'
                    ? preview
                        ? <NodeViewer></NodeViewer>
                        : <NodeEditor userData={props.userData} ></NodeEditor>
                    : <></>}
                {sideMenuData.type === 'comment'
                    ? <div className="comment">
                        {sideMenuData.dataPointer[1] === -1 
                        ? <Comment
                            comment={tempComment!}
                            marginLeft={0}
                            userData={props.userData}
                        ></Comment>
                        : <Comment
                            comment={selectedSession > -1 && sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]] 
                                ? sessions[selectedSession].comments['' + sideMenuData.dataPointer[0]][sideMenuData.dataPointer[1]] 
                                : undefined}
                            marginLeft={0}
                            userData={props.userData}
                        ></Comment>}
                    </div>
                    : <></>}
                {sideMenuData.type === 'sessions'
                    ? <div className="sessions">
                        <h2>Comment Sessions:</h2>
                        {preview 
                            ? <></>
                            : <div className="AddSessionWrapper">
                                <button
                                    className="AddSession"
                                    onClick={() => addSession()}
                                >+ New Session</button>
                            </div>}
                        {tempSession
                            ? <SessionOption
                                index={-1}
                                userData={props.userData}
                            ></SessionOption>
                            : <></>}
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
                {sideMenuData.type === 'tags' 
                    ? <TagsEditor />
                    : <></>}
            </>}
    </div>
}

export default SideMenu;