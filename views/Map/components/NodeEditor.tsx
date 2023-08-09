import React, { FunctionComponent } from "react";
import TextEditor from "./TextEditor";
import { useDispatch, useSelector } from "../store/store";
import { setNotification } from "../store/notification";
import { addImageToNode, changeNodeName, moveImageDown, moveImageUp, removeImageFromNode, removeNode } from "../store/map";
import { closeSideMenu } from "../store/sideMenuData";

type Props = {
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    }
}

/**
 * A component for the side menu to render the inputs to change the contents of a node.
 * @param userData (optional) Data of the logged in user.
 */
const NodeEditor: FunctionComponent<Props> = (props) => {
    const sideMenuData = useSelector(state => state.sideMenuData);
    if(!sideMenuData || sideMenuData.type !== 'node') return <></>;
    const node = useSelector(state => state.map.rows[sideMenuData.dataPointer[0]].nodes[sideMenuData.dataPointer[1]]);

    const dispatch = useDispatch();

    /**
     * An asynchronous helper function to read a file from an input
     * @param file The File object created by the input
     * @returns The base64 data of the file image.
     */
    async function readFileAsDataURL(file: File): Promise<string | ArrayBuffer | null> {
        return await new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.onload = e => resolve(fileReader.result);
            fileReader.readAsDataURL(file);
        });
    }

    /**
     * Event handler to parse an uploaded file into a base64 string and add it to the node's gallery array.
     */
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        // If it's file size is greater than 1MB, do nothing.
        if(e.target.files![0].size > 1000000) {
            dispatch(setNotification('Image cannot be larger than 1MB.'));
            return;
        }

        // Parsing the uploaded file into base64.
        const base64image = await readFileAsDataURL(e.target.files![0]);
        if(!base64image) return;
        let image = base64image.toString();
       
        // If the image is not the correct format, return.
        if(
            !image.toString().includes('image/png') &&
            !image.toString().includes('image/jpg') && 
            !image.toString().includes('image/jpeg') &&
            !image.toString().includes('image/webp') &&
            !image.toString().includes('image/gif') &&
            !image.toString().includes('image/svg')
        ) {
            dispatch(setNotification('Image must be .png, .jpg, .jpeg, .webp, .gif, or .svg'));
            return;
        }

        // If the user is logged in, then we'll upload the image to the server.
        if(props.userData) {
            // Making a POST request to upload the image.
            const response = await (await fetch('/image', {
                method: 'POST',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    image: image,
                    nodeId: node.id
                })
            })).json();

            // If the upload failures, just notify user.
            if(!response.success) {
                dispatch(setNotification(response.message));
                return;
            }

            // Otherwise update image to be its url.
            image = response.url;
        }
        
        dispatch(addImageToNode({
            rowIndex: sideMenuData!.dataPointer[0],
            nodeIndex: sideMenuData!.dataPointer[1],
            image: image
        }));
    }

    /**
     * Event handler to remove this node from the row.
     */
    function deleteNode() {
        // Making a post call to the server to delete the images on AWS.
        // Doesn't really matter what the response is.
        if(props.userData) {
            fetch('/image', {
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    urls: node.gallery
                })
            });
        }

        dispatch(removeNode({
            rowIndex: sideMenuData!.dataPointer[0],
            nodeIndex: sideMenuData!.dataPointer[1]
        }));
        dispatch(closeSideMenu());
    }

    return <>
        <div className="TitleWrapper">9
            <input
                className="Title"
                value={node.name}
                    onChange={e => dispatch(changeNodeName({
                    rowIndex: sideMenuData.dataPointer[0],
                    nodeIndex: sideMenuData.dataPointer[1],
                    name: e.target.value
                }))}
            ></input>
            <button onClick={deleteNode}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        <div className="GalleryUpload">
            <h3>Gallery:</h3>
            <div className="FileUpload">
                <input
                    type="file"
                    accept="image/png, image/jpg, image/jpeg, image/webp, image/svg, image/gif"
                    onChange={uploadFile}
                ></input>
                <label>Click or drag to upload +</label>
            </div>
            <div className="GalleryEdit">
                {node.gallery.map((image, i) => {
                    return <div key={i} className="ImageWrapper">
                        <img src={image} alt={`${node.name} Gallery Image ${i+1}`}></img>
                        <button onClick={() => dispatch(moveImageUp({
                            rowIndex: sideMenuData.dataPointer[0],
                            nodeIndex: sideMenuData.dataPointer[1],
                            imageIndex: i
                        }))}>
                            <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button onClick={() => dispatch(removeImageFromNode({
                            rowIndex: sideMenuData.dataPointer[0],
                            nodeIndex: sideMenuData.dataPointer[1],
                            imageIndex: i
                        }))}>
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                        <button onClick={() => dispatch(moveImageDown({
                            rowIndex: sideMenuData.dataPointer[0],
                            nodeIndex: sideMenuData.dataPointer[1],
                            imageIndex: i
                        }))}>
                            <i className="fa-solid fa-arrow-down"></i>
                        </button>
                    </div>
                })}
            </div>
        </div>
        <div className="TextEditorWrapper">
            <h3>Content:</h3>
            <TextEditor></TextEditor>
        </div>
    </>
}

export default NodeEditor;