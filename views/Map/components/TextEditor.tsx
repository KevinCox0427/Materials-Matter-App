import React, { FunctionComponent, useEffect, useRef } from "react";
import QuillType from "quill";
import { useDispatch, useSelector } from "../store/store";
import { changeNodeContent } from "../store/map";

/**
 * Because the @types/Quill package was throwing syntax errors.
 */
declare const Quill: any;

/**
 * A component to render a stateful Quill.js textbox.
 * 
 * @param content The state variable containing the content.
 * @param setContent The function to set the state variable.
 */
const TextEditor: FunctionComponent = () => {
    const sideMenuData = useSelector(state => state.sideMenuData);
    if(sideMenuData.type !== 'node') return <></>;
    const content = useSelector(state => state.map.rows[sideMenuData.dataPointer[0]].nodes[sideMenuData.dataPointer[1]].htmlContent);

    const dispatch = useDispatch();

    // References to the wrapper div and the Quill class.
    const editor = useRef<HTMLDivElement>(null);
    const quill = useRef<QuillType | null>(null);

    /**
     * When the reference to the wrapper div has loaded, then we'll intialize the Quill class with desired settings.
     */
    useEffect(() => {
        if(quill.current) return;

        const colorArray = [false, "grey"];
        const Color = Quill.import('attributors/class/color');
        Color.whitelist = colorArray;
        Quill.register(Color, true);

        // @ts-ignore
        quill.current = new Quill(editor.current, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ header: [false, 3] }],
                    [{ color: colorArray }],
                    ["bold", "italic", "underline", "strike", {script: "sub"}, {script: "super"}],
                    [{ indent: "-1" }, { indent: "+1" }],
                    [{align: ""}, {align: "center"}, {align: "right"}],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["blockquote", "link"]
                ]
            }
        });

        // Loading the initial content.
        editor.current!.children[0].innerHTML = `${content}`;

        // Creating an event listener to set the state variable when a user types.
        quill.current!.on('text-change', (_, __, source) => {
            if(source === 'user') dispatch(changeNodeContent({
                rowIndex: sideMenuData.dataPointer[0],
                nodeIndex: sideMenuData.dataPointer[1],
                content: editor.current!.children[0].innerHTML
            }));
        });
    }, [editor]);
    
    return <div ref={editor} id={`TextEditor`} className="TextEditor"></div>
}

export default TextEditor;