import {computePosition, flip, shift} from '@floating-ui/dom'
import {Editor, posToDOMRect, ReactRenderer} from '@tiptap/react'

import {VariableInfo} from './VariableInfo'
import tippy, {Instance} from "tippy.js";

const updatePosition = (editor: Editor, element: HTMLElement) => {
    const virtualElement = {
        getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
    }

    computePosition(virtualElement, element, {
        placement: 'bottom-start',
        strategy: 'absolute',
        middleware: [shift(), flip()],
    }).then(({x, y, strategy}) => {
        element.style.width = 'max-content'
        element.style.position = strategy
        element.style.left = `${x}px`
        element.style.top = `${y}px`
    })
}

export default {
    render: () => {
        let component: ReactRenderer<HTMLElement> | null = null
        let popup: null | Instance[] = null

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(VariableInfo, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                (component.element as HTMLElement).style.position = 'absolute'

                document.body.appendChild(component.element)

                popup = tippy("body", {
                    getReferenceClientRect: props.clientRect,
                    content: component.element,
                    showOnCreate: true,
                    interactive: false,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })

                // updatePosition(props.editor, component.element as HTMLElement)
            },

            onUpdate(props: any) {
                component?.updateProps(props)

                if (!props.clientRect) {
                    return
                }
                // if(component?.element){
                // 	updatePosition(props.editor, component.element as HTMLElement)
                // }

                if (popup?.length) {
                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect,
                    })
                }
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    // component?.destroy()
                    popup?.length && popup[0].hide()

                    return true
                }

                if (typeof component?.ref?.onkeydown === 'function') {
                    return component?.ref?.onkeydown(props)
                }

            },

            onExit() {
                popup?.length && popup[0].destroy();
                // component?.element.remove()
                component?.destroy()
            },
        }
    },
}
