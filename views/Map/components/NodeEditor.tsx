import React, { FunctionComponent } from "react";
import TextEditor from "./TextEditor";

type Props = {
    map: FullMapDoc
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    sideMenuData: {
        type: 'node' | 'comment' | 'sessions' | 'tags';
        dataPointer: [number, number];
    },
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
 * A component for the side menu to render the inputs to change the contents of a node.
 * 
 * @param node A state variable representing the current edits of this node.
 * @param setNode The set state function to change the edits on this node.
 * @param setMap A set state function to edit any information on the map.
 * @param sideMenuData A state variable pointing to what data is currently being viewed/edited in the side menu.
 * @param setNotification A set state function to open a pop-up menu to notify the user.
 * @param userData (optional) Data of the logged in user.
 */
const NodeEditor: FunctionComponent<Props> = (props) => {
    const node = props.map.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]];
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
        /**
        * If it's file size is greater than 1MB, do nothing.
        */
        if(e.target.files![0].size > 1000000) {
            props.setNotification('Image cannot be larger than 1MB.')
            return;
        }

        /**
        * Parsing the uploaded file into base64
        */
        const base64image = await readFileAsDataURL(e.target.files![0]);
        if(!base64image) return;
        let image = base64image.toString();
       
        /**
        * If the image is not the correct format, return.
        */
        if(!image.toString().includes('image/png') && !image.toString().includes('image/jpg') && !image.toString().includes('image/jpeg') && !image.toString().includes('image/webp') && !image.toString().includes('image/gif') && !image.toString().includes('image/svg')) {
            props.setNotification('Image must be .png, .jpg, .jpeg, .webp, .gif, or .svg');
            return;
        }

        /**
         * If the user is logged in, then we'll upload the image to the server.
         */
        if(props.userData) {
            /**
             * Making a POST request to upload the image.
             */
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

            /**
             * If the upload failures, just notify user.
             */
            if(!response.success) {
                props.setNotification(response.message);
                return;
            }

            /**
             * Otherwise update image to be its url.
             */
            image = response.url;
        }
        
        const newMap = {...props.map};
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.push(image);
        props.setMap(newMap);
    }

    /**
     * Event handler to remove a file from the node's gallery array.
     * @param index The index of the file in the array.
     */
    function deleteImage(index: number) {
        /**
         * Making a post call to the server to delete the image on AWS.
         * Doesn't really matter what the response is.
         */
        if(props.userData) {
            fetch('/image', {
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    urls: [node.gallery[index]]
                })
            });
        }

        const newMap = {...props.map};
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.splice(index, 1);
        props.setMap(newMap);
    }
    /**
     * Event handler to move an image in the gallery up one index.
     * @param index Index of the image being moved.
     */
    function moveImageUp(index: number) {
        if(index === 0) return;
        const newMap = {...props.map};
        const newNode = newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]];
        
        newNode.gallery.splice(index, 1);
        newNode.gallery.splice(index - 1, 0, newNode.gallery[index]);

        props.setMap(newMap);
    }

    /**
     * Event handler to move an image in the gallery down one index.
     * @param index Index of the image being moved.
     */
    function moveImageDown(index: number) {
        if(index === node.gallery.length - 1) return;
        const newMap = {...props.map};
        const newNode = newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]];

        newNode.gallery.splice(index, 1);
        newNode.gallery.splice(index + 1, 0, newNode.gallery[index]);

        props.setMap(newMap);
    }

    /**
     * Event handler to change the name of the node.
     */
    function changeName(e: React.ChangeEvent<HTMLInputElement>) {
        const newMap = {...props.map}
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].name = e.target.value;
        props.setMap(newMap);
    }

    /**
     * Event handler to change the text a node.
     * @param newContent The new html string to set.
     */
    function changeText(newContent: string) {
        const newMap = {...props.map}
        newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].htmlContent = newContent;
        props.setMap(newMap);
    }

    return <>
        <input className="Title" value={node.name} onChange={changeName}></input>
        <div className="GalleryUpload">
            <h3>Gallery:</h3>
            <div className="FileUpload">
                <input type="file" accept="image/png, image/jpg, image/jpeg, image/webp, image/svg,
                image/gif" onChange={uploadFile}></input>
                <label>Click or drag to upload +</label>
            </div>
            <div className="GalleryEdit">
                {node.gallery.map((image, i) => {
                    return <div key={i} className="ImageWrapper">
                        <img src={image} alt={`${node.name} Gallery Image ${i+1}`}></img>
                        <button onClick={() => moveImageUp(i)}>
                            <i className="fa-solid fa-arrow-up"></i>
                        </button>
                        <button onClick={() => deleteImage(i)}>
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                        <button onClick={() => moveImageDown(i)}>
                            <i className="fa-solid fa-arrow-down"></i>
                        </button>
                    </div>
                })}
            </div>
        </div>
        <div className="TextEditorWrapper">
            <h3>Content:</h3>
            <TextEditor content={node.htmlContent ? node.htmlContent : ''} setContent={changeText}></TextEditor>
        </div>
    </>
}

export default NodeEditor;