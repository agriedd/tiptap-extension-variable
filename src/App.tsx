import React, { useState } from 'react'
import './App.css'
import { EditorContent, useEditor } from '@tiptap/react'
import { Mention } from './lib/variable/variable'
import suggestion from './VariableSuggestions'
import popover from './VariablePopover'
import StarterKit from '@tiptap/starter-kit'

function App() {

  const [content, setContent] = useState("")

  const editor = useEditor({
    content,
    extensions: [
      // Variable.configure({
      //   suggestion: {
      //     render: () => {
      //       let component;
      //       let popup;

      //       return {
      //         onStart: (props) => {
      //           console.log("🚀 ~ App ~ props:", props)
      //           component = new ReactRenderer(VariableList, {
      //             props,
      //             editor: props.editor,
      //           });

      //           if (!props.clientRect) {
      //             return;
      //           }

      //           popup = tippy("body", {
      //             getReferenceClientRect: props.clientRect,
      //             content: component.element,
      //             showOnCreate: true,
      //             interactive: true,
      //             trigger: "manual",
      //             placement: "bottom-start",
      //           });
      //         },

      //         onUpdate(props) {
      //           console.log("🚀 ~ onUpdate ~ props:", props)
      //           component.updateProps(props);

      //           if (!props.clientRect) {
      //             return;
      //           }

      //           // popup[0].show()

      //           popup[0].setProps({
      //             getReferenceClientRect: props.clientRect,
      //           });
      //         },

      //         onKeyDown(props) {
      //           if (props.event.key === "Escape") {
      //             popup[0].hide();

      //             return true;
      //           }

      //           return component?.ref?.onKeyDown(props);
      //         },

      //         onExit() {
      //           popup[0]?.destroy();
      //           component.destroy();
      //         },
      //       };
      //     },
      //   },
      // }),
      Mention.configure({
        suggestion,
        popover,
        // renderHTML(props) {
        //   return []
        // },
      }),
      StarterKit
    ],
    onUpdate: (e) => {
      setContent(e.editor.getHTML())
    }
  })

  return (
    <div className='border border-slate-700 rounded-sm w-full flex flex-col justify-start text-left p-4 min-w-sm'>
      <div className='min-w-full'>
        {JSON.stringify(content)}
      </div>
      <EditorContent editor={editor} className='w-full' />
    </div>
  )
}

export default App
