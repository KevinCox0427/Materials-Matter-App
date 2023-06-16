import React, { FunctionComponent, useEffect, useRef, useState } from "react";
import TextEditor from "../components/TextEditor";
import parse from "html-react-parser";

type Props = {
    node: NodeDoc | undefined,
    sideMenuData: {
        type: 'node' | 'comment' | 'sessions';
        dataPointer: [number, number];
    },
    setSideMenuData: React.Dispatch<React.SetStateAction<Props["sideMenuData"] | null>>,
    map: FullMapDoc,
    setMap: React.Dispatch<React.SetStateAction<FullMapDoc>>,
    sessions: FullSessionDoc[],
    setSessions: React.Dispatch<React.SetStateAction<FullSessionDoc[]>>,
    selectedSession: number,
    userData?: {
        userId: number
        firstName: string,
        lastName: string,
        image: string
    }
}

/**
 * The React component for the side menu to be able to edit and view nodes.
 * 
 * @param sideMenuData A pointer to the contents data that's being editted.
 * @param setSideMenuData The set state function to change what data is being pointed to.
 * @param map The state variable representing all the map's data.
 * @param setMap The set state function for the map to change the data that's being editted in the side menu.
 * @param sessions The state variable controlling all the comments and their sessions.
 * @param setSession The setter to edit target comments.
 */
const NodeEditor: FunctionComponent<Props> = (props) => {
    if(!props.node) return <></>;

    /**
     * Setting state for the node's content to be editted.
     */
    const [node, setNode] = useState(props.node);
    useEffect(() => setNode(props.node!), [props.node])

    /**
     * State variable to keep track of when the node is being edited
     */
    const [isEditing, setIsEditing] = useState(false);

    /**
     * Event handler to toggle between the editor and viewer.
     */
    function toggleIsEditing() {
        setIsEditing(!isEditing);
        /**
         * Removing any toolbars the Quill created.
         */
        const qlToolbars = Array.from(document.getElementsByClassName('ql-toolbar')) as HTMLDivElement[];
        qlToolbars.forEach(toolbar => {
            toolbar.remove();
        })
    }

    /**
     * State variable and reference to keep track of the gallery slider's position.
     */
    const galleryEl = useRef<HTMLDivElement>(null);
    const [galleryPosition, setGalleryPosition] = useState(0);

    useEffect(adjustGallery, [galleryPosition]);

    function adjustGallery() {
        if(!galleryEl.current) return;
        const newPosition = Math.round((galleryEl.current.scrollWidth / node.gallery.length) * galleryPosition) + (2 * galleryPosition-1);
        galleryEl.current.scrollTo(newPosition, 0);
    }

    const resizeBuffer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if(!galleryEl.current) return;

        window.addEventListener('resize', () => {
            if(resizeBuffer.current) clearTimeout(resizeBuffer.current);
            resizeBuffer.current = setTimeout(adjustGallery, 200);
        });
        
        galleryEl.current.addEventListener('scroll', () => {
            if(resizeBuffer.current) clearTimeout(resizeBuffer.current);
            resizeBuffer.current = setTimeout(() => {
                if(!galleryEl.current) return;
                const newIndex = Math.round(node.gallery.length * (galleryEl.current.scrollLeft / galleryEl.current.scrollWidth));

                if(newIndex !== galleryPosition) handleMoveGallery(newIndex);
                else adjustGallery();
            }, 500);
        })
    }, [adjustGallery, galleryEl]);

    /**
     * Event handler to move the gallery based on the image's index
     * @param index The index of the image in the node's gallery array.
     */
    function handleMoveGallery(index: number) {
        setGalleryPosition(index);
    }

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
        const newMap = {...props.map};

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
         * If the user is logged in, then we'll upload the image to the server.
         */
        if(props.userData) {
            /**
             * Making a POST request to upload the image.
             */
            const response = await (await fetch('/image', {
                method: 'POST',
                body: JSON.stringify({
                    image: image.toString(),
                    nodeId: props.sideMenuData.dataPointer[1]
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
            newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.push(response.url);
        }
        /**
         * If they're unregistered, then just use the base64.
         */
        else {
            newMap.rows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.push(image.toString());
        }

        props.setMap(newMap);
    }

    /**
     * Event handler to remove a file from the node's gallery array.
     * @param index The index of the file in the array.
     */
    function handleFileDelete(index:number) {
        props.setMap(oldMap => {
            const newRows = [...oldMap.rows];
            newRows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].gallery.splice(index, 1);

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
            newRows[props.sideMenuData.dataPointer[0]].nodes.splice(props.sideMenuData.dataPointer[1], 1);

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
            oldRows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].name = e.target.value;

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
            oldRows[props.sideMenuData.dataPointer[0]].nodes[props.sideMenuData.dataPointer[1]].htmlContent = newContent;

            return {...oldMap,
                rows: oldRows
            };
        });
    }

    return <div className="node">
        <div className="Buttons">
            {isEditing ? 
                <button onClick={toggleIsEditing}>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save
                </button>
            :
                <button>
                    <i className="fa-solid fa-arrows-up-down-left-right"></i>
                    Move
                </button>
            }
            {isEditing ? 
                <button className="Activated" onClick={toggleIsEditing}>
                    <i className="fa-solid fa-x"></i>
                    Cancel
                </button>
            :
                <button onClick={toggleIsEditing}>
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit
                </button>
            }
            <button onClick={handleDeleteNode}>
                <i className="fa-solid fa-trash-can"></i>
                Delete
            </button>
        </div>
        {isEditing ? 
            <input className="Title" value={node.name} onChange={handleChangeNodeName}></input>
        :
            <h2 className="Title">{node.name}</h2>
        }
        {isEditing ? 
            <div className="GalleryUpload">
                <h3>Gallery:</h3>
                <div className="FileUpload">
                    <input type="file" accept="image/png, image/jpg, image/jpeg, image/webp, image/svg,
                    image/gif" onChange={handleFileUpload}></input>
                    <label>Click or drag to upload +</label>
                </div>
                <div className="GalleryEdit">
                    {node.gallery.map((image, i) => {
                        return <div key={i} className="ImageWrapper">
                            <img src={image} alt={`${node.name} Gallery Image ${i+1}`}></img>
                            <button onClick={() => {handleFileDelete(i)}}>
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    })}
                </div>
            </div>
        :
            node.gallery.length > 0 ?
                <div className="GalleryPaginationWrapper">
                    <div ref={galleryEl} className="GalleryWrapper">
                        <div className="Gallery">
                            {node.gallery.map((image, i) => {
                                return <div key={i} className="ImageWrapper">
                                    <img src={image} alt={`${node.name} Gallery Image ${i+1}`}></img>
                                </div>
                            })}
                        </div>
                    </div>
                    <div className="Pagination">
                        {node.gallery.map((_, i) => {
                            return <button key={i} className={galleryPosition === i ? 'Activated' : ' '} onClick={() => handleMoveGallery(i)}></button>
                        })}
                    </div>
                </div>
            : 
                <></>
        }
        {isEditing ?
            <div className="TextEditorWrapper">
                <h3>Content:</h3>
                <TextEditor content={node.htmlContent} setContent={handleTextChange}></TextEditor>
            </div>
        :
            node.htmlContent ? 
                <div className="NodeContent">{
                    /**
                     * An imported function that will convert HTML strings into React elements
                     */
                    parse(node.htmlContent, {
                        /**
                         * A callback function to filter only accepted HTML elements.
                         */
                        replace: (node) => {
                            const validTags = ['P', 'H3', 'A', 'SPAN', 'EM', 'STRONG', 'SMALL', 'IMAGE'];
                            if(!(node instanceof Element)) return node;
                            if(validTags.includes(node.tagName)) return node;
                            return false;
                        }
                    })
                }</div>
            :
                <></>
        }
    </div>
}

export default NodeEditor;