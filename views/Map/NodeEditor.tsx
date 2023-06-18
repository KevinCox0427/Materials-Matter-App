import React, { FunctionComponent } from "react";
import TextEditor from "../components/TextEditor";

type Props = {
    node: NodeDoc,
    setNode: React.Dispatch<React.SetStateAction<NodeDoc>>,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    sideMenuData: {
        type: 'node' | 'comment' | 'sessions';
        dataPointer: [number, number];
    },
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string,
        isAdmin: boolean
    },
    setNotification: React.Dispatch<React.SetStateAction<string>>
}

const NodeEditor: FunctionComponent<Props> = (props) => {
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
     * Event handler to parse an uploaded file into a base64 string and add it to the props.node's gallery array.
     */
    async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
        const newGallery = [...props.node.gallery];

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
                body: JSON.stringify({
                    image: image,
                    nodeId: props.sideMenuData.dataPointer[1]
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
        
        newGallery.push(image);
        props.setNode({...props.node,
            gallery: newGallery
        })
    }

    /**
     * Event handler to remove a file from the props.node's gallery array.
     * @param index The index of the file in the array.
     */
    function deleteImage(index: number) {
        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.splice(index, 1);

            return {...oldMap,
                rows: newRows
            };
        });
    }

    /**
     * Event handler to move an image in the gallery up one index.
     * @param index Index of the image being moved.
     */
    function moveImageUp(index: number) {
        if(index === 0) return;
        const targetImage = props.node.gallery[index]
        const newGallery = [...props.node.gallery];

        newGallery.splice(index, 1);
        newGallery.splice(index - 1, 0, targetImage);
        props.setNode({...props.node,
            gallery: newGallery
        });
    }

    /**
     * Event handler to move an image in the gallery down one index.
     * @param index Index of the image being moved.
     */
    function moveImageDown(index: number) {
        if(index === props.node.gallery.length - 1) return;
        const targetImage = props.node.gallery[index]
        const newGallery = [...props.node.gallery];

        newGallery.splice(index, 1);
        newGallery.splice(index + 1, 0, targetImage);
        props.setNode({...props.node,
            gallery: newGallery
        });
    }

    /**
     * Event handler to change the name of the props.node.
     */
    function changeName(e: React.ChangeEvent<HTMLInputElement>) {
        props.setNode({...props.node,
            name: e.target.value
        });
    }

    /**
     * Event handler to change the text a props.node.
     * @param newContent The new html string to set.
     */
    function changeText(newContent: string) {
        props.setNode({...props.node,
            htmlContent: newContent
        });
    }

    return <>
        <input className="Title" value={props.node.name} onChange={changeName}></input>
        <div className="GalleryUpload">
            <h3>Gallery:</h3>
            <div className="FileUpload">
                <input type="file" accept="image/png, image/jpg, image/jpeg, image/webp, image/svg,
                image/gif" onChange={uploadFile}></input>
                <label>Click or drag to upload +</label>
            </div>
            <div className="GalleryEdit">
                {props.node.gallery.map((image, i) => {
                    return <div key={i} className="ImageWrapper">
                        <img src={image} alt={`${props.node.name} Gallery Image ${i+1}`}></img>
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
            <TextEditor content={props.node.htmlContent ? props.node.htmlContent : ''} setContent={changeText}></TextEditor>
        </div>
    </>
}

export default NodeEditor;