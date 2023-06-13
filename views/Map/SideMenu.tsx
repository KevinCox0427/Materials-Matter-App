import React, { FunctionComponent } from "react";
import TextEditor from "../components/TextEditor";

type Props = {
    sideMenuData: {
        type: 'node' | 'comment';
        id: [number, number];
    },
    setSideMenuData: React.Dispatch<React.SetStateAction<Props["sideMenuData"] | null>>,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>
}

/**
 * The React component the side menu to be able to edit and view comments and nodes.
 * 
 * @param sideMenuData A pointer to the contents data that's being editted.
 * @param setSideMenuData The set state function to change what data is being pointed to.
 * @param map The state variable representing all the map's data.
 * @param setMap The set state function for the map to change the data that's being editted in the side menu.
 */
const SideMenu: FunctionComponent<Props> = (props) => {
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
    async function handleFileUpload(e:React.ChangeEvent<HTMLInputElement>) {
        /**
        * If it's file size is greater than 1MB, do nothing.
        */
        if(e.target.files![0].size > 1048576) {
            //setLogoErrorMessage('Image cannot be larger than 1MB.')
            return;
        }

       /**
        * Parsing the uploaded file into base64
        */
       const image = await readFileAsDataURL(e.target.files![0]);
       
       /**
        * If the image is not the correct format, return.
        */
        if(!image || (!image.toString().includes('image/png') && !image.toString().includes('image/jpg') && !image.toString().includes('image/jpeg') && !image.toString().includes('image/webp') && !image.toString().includes('image/gif') && !image.toString().includes('image/svg'))) {
            return;
        }

        /**
         * Making a POST request to upload the image.
         */
        const response = await (await fetch('/image', {
            method: 'POST',
            body: JSON.stringify({
                image: image.toString(),
                nodeId: props.sideMenuData.id[1]
            })
        })).json();

        /**
         * If the upload failures, just log to console.
         */
        if(!response.success) {
            console.log(response.error);
            return;
        }

        /**
         * Otherwise update state with the returned id.
         */
        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.id[0]].nodes[props.sideMenuData.id[1]].gallery.push(response.url);

            return {...oldMap,
                rows: newRows
            }
        });
    }

    /**
     * Event handler to remove a file from the node's gallery array.
     * @param index The index of the file in the array.
     */
    function handleFileDelete(index:number) {
        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.id[0]].nodes[props.sideMenuData.id[1]].gallery.splice(index, 1);

            return {...oldMap,
                rows: newRows
            };
        });
    }

    /**
     * Event handler to remove this node from the row.
     */
    function handleDeleteNode() {
        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.id[0]].nodes.splice(props.sideMenuData.id[1], 1);

            return {...oldMap,
                rows: newRows
            };
        });
        props.setSideMenuData(null);
    }

    /**
     * Event handler to change the name of the node.
     */
    function handleChangeNodeName(e:React.ChangeEvent<HTMLInputElement>) {
        props.setMap(oldMap => {
            const oldRows = [...oldMap.rows];
            oldRows[props.sideMenuData.id[0]].nodes[props.sideMenuData.id[1]].name = e.target.value;

            return {...oldMap,
                rows: oldRows
            };
        })
    }

    /**
     * Event handler to change the text a node.
     * 
     * @param newContent The new html string to set.
     */
    function handleTextChange(newContent: string) {
        props.setMap(oldMap => {
            const oldRows = [...oldMap.rows];
            oldRows[props.sideMenuData.id[0]].nodes[props.sideMenuData.id[1]].htmlContent = newContent;

            return {...oldMap,
                rows: oldRows
            };
        });
    }

    /**
     * Setting a reference to the target data as a node.
     */ 
    const node = props.map.rows[props.sideMenuData.id[0]].nodes[props.sideMenuData.id[1]];

    return <>
        {props.sideMenuData.type === 'node' ? 
            <div className="SideMenu">
                <div className="Buttons">
                    <button onClick={handleDeleteNode}>
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <input className="Title" value={node.name} onChange={handleChangeNodeName}></input>
                <div className="GalleryUpload">
                    <h2>Gallery:</h2>
                    <div className="FileUpload">
                        <input type="file" accept="image/png, image/jpg, image/jpeg, image/webp, image/svg,
                        image/gif" onChange={handleFileUpload}></input>
                        <label>Click or drag to upload +</label>
                    </div>
                    <div className="Gallery">
                        {node.gallery.map((image, i) => {
                            return <div key={i} className="ImageWrapper">
                                <img src={image}></img>
                                <button onClick={() => {handleFileDelete(i)}}>
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        })}
                    </div>
                </div>
                <div className="TextEditorWrapper">
                    <h2>Content:</h2>
                    <TextEditor content={node.htmlContent} setContent={handleTextChange}></TextEditor>
                </div>
            </div>
        : 
            <div className="SideMenu">
                <h2>Hi comment</h2>
            </div>
        }
    </>
}

export default SideMenu;