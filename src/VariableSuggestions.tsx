import { computePosition, flip, shift } from '@floating-ui/dom'
import { Editor, posToDOMRect, ReactRenderer } from '@tiptap/react'

import { VariableList } from './VariableList'

const updatePosition = (editor: Editor, element: HTMLElement) => {
	const virtualElement = {
		getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
	}

	computePosition(virtualElement, element, {
		placement: 'bottom-start',
		strategy: 'absolute',
		middleware: [shift(), flip()],
	}).then(({ x, y, strategy }) => {
		element.style.width = 'max-content'
		element.style.position = strategy
		element.style.left = `${x}px`
		element.style.top = `${y}px`
	})
}

export default {
	// items: ({ query }: {query: string}) => {
	// 	return []
	// },

	char: '#',

	render: () => {
		let component : ReactRenderer<HTMLElement>|null = null

		return {
			onStart: (props: any) => {
				component = new ReactRenderer(VariableList, {
					props,
					editor: props.editor,
				})

				if (!props.clientRect) {
					return
				}

				(component.element as HTMLElement).style.position = 'absolute'

				document.body.appendChild(component.element)

				updatePosition(props.editor, component.element as HTMLElement)
			},

			onUpdate(props: any) {
				component?.updateProps(props)

				if (!props.clientRect) {
					return
				}
				if(component?.element){
					updatePosition(props.editor, component.element as HTMLElement)
				}
			},

			onKeyDown(props: any) {
				if (props.event.key === 'Escape') {
					component?.destroy()

					return true
				}

				if(typeof component?.ref?.onkeydown === 'function'){
					return component?.ref?.onkeydown(props)
				}

			},

			onExit() {
				component?.element.remove()
				component?.destroy()
			},
		}
	},
}
