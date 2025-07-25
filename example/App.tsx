import React, {useState} from 'react'
// import '@tiptap/pm'
// import '@tiptap/core'
import './App.scss'
import {EditorContent, useEditor} from '@tiptap/react'
import { Variable } from '../dist/variable.es'
import suggestion from './VariableSuggestions'
import popover from './VariablePopover'
import Doc from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import Paragraph from '@tiptap/extension-paragraph'

function App() {

    const [content, setContent] = useState(`<p><span class="underline decoration-[8px] decoration-pink-500" data-type="variable" data-id="list.pertama" data-label="List 1" data-variable-open="{*" data-variable-close="{*"><span class="bg-blue-400/10 text-blue-600">{*</span><span>list.pertama</span><span class="bg-blue-400/10 text-blue-600">*}</span></span>&nbsp;helo apa kabar? <span class="underline decoration-2 decoration-pink-500" data-type="variable" data-id="list.kedua" data-label="List 2" data-variable-open="{*" data-variable-close="{*"><span class="bg-blue-400/10 text-blue-600">{*</span><span>list.kedua</span><span class="bg-blue-400/10 text-blue-600">*}</span></span> </p>`);

    const editor = useEditor({
        content,
        extensions: [
            Doc,
            Text,
            Paragraph,
            Variable.configure({
                suggestion,
                popover,
            }),
        ],
        onUpdate: (e) => {
            setContent(e.editor.getHTML())
        }
    })

    const [previewState, setPreviewState] = useState(false)

    return (
        <div className='p-4'>
            { previewState ? (<>
                <div className='flex flex-col fixed inset-0 h-screen w-screen items-end bg-black/70' onClick={() => setPreviewState(false)}>
                </div>
                <div className='min-w-sm fixed bg-white h-screen max-h-screen max-w-sm w-full flex right-0 inset-y-0'>
                    <div className='p-1 flex flex-col justify-center border-r border-neutral-100'>
                        <div className='h-16 bg-zinc-200 rounded-lg w-1'></div>
                    </div>
                    <div className='overflow-y-auto max-h-full grow'>
                        <div className='p-4'>
                            <textarea value={content} rows={10} className='w-full'></textarea>
                        </div>
                    </div>
                </div>
            </>) : (<></>) }
            <div
                className='border border-neutral-400 rounded-sm w-full flex flex-col justify-start text-left p-4 min-w-sm gap-6'>
                <div className='flex justify-end'>
                    <button className='px-4 py-1 bg-neutral-200 rounded-sm' onClick={() => {
                        setPreviewState(true)
                    }}>
                        HTML
                    </button>
                </div>
                <EditorContent editor={editor} className='w-full outline-0 hover:outline-0 focus:outline-0 border-0'/>
            </div>
        </div>
    )
}

export default App
