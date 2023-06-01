import React, { FunctionComponent, useEffect, useRef } from "react";
import QuillType from "quill";


type Props = {
    content: string,
    setContent: (content: string) => void,
}

declare const Quill: any;

const TextEditor: FunctionComponent<Props> = (props) => {
    const editor = useRef<HTMLDivElement>(null);
    const quill = useRef<QuillType | null>(null);

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

        editor.current!.children[0].innerHTML = `${props.content}`;

        quill.current!.on('text-change', (delta, delta2, source) => {
            if(source === 'user') props.setContent(editor.current!.children[0].innerHTML);
        });
    }, [editor]);
    
    return <div ref={editor} id={`TextEditor`} className="TextEditor"></div>
}

export default TextEditor;