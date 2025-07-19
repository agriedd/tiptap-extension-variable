import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react'
import Variable from './index'
import { VariableList } from './VariableList'
import StarterKit from '@tiptap/starter-kit'

function App() {
  const editor = useEditor({
    extensions: [
      Variable.configure({
        suggestion: {
          render: () => {
            let component;
            let popup;

            return {
              onStart: (props) => {
                component = new ReactRenderer(VariableList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },

              onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup[0].hide();

                  return true;
                }

                return component?.ref?.onKeyDown(props);
              },

              onExit() {
                popup[0]?.destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      StarterKit
    ]
  })

  return (
    <div className='border rounded-sm w-full flex justify-start text-left p-4 min-w-sm'>
      <EditorContent editor={editor} className='w-full' />
    </div>
  )
}

export default App
