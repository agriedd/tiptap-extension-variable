import type { Editor, Range } from '@tiptap/core'
import type { EditorState } from '@tiptap/pm/state'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { Decoration, DecorationSet } from '@tiptap/pm/view'


export interface PopoverOptions<TSelected = any> {
	/**
	 * The plugin key for the popover plugin.
	 * @default 'popover'
	 * @example 'mention'
	 */
	pluginKey?: PluginKey

	/**
	 * The editor instance.
	 * @default null
	 */
	editor: Editor

	/**
	 * The tag name of the decoration node.
	 * @default 'span'
	 * @example 'div'
	 */
	decorationTag?: string

	/**
	 * Creates a decoration with the provided content.
	 * @param decorationContent - The content to display in the decoration
	 * @default "" - Creates an empty decoration if no content provided
	 */
	decorationContent?: string

	/**
	 * The class name of the decoration node when it is empty.
	 * @default 'is-empty'
	 * @example 'is-empty'
	 */
	decorationEmptyClass?: string

	/**
	 * The class name of the decoration node.
	 * @default 'popover'
	 * @example 'mention'
	 */
	decorationClass?: string

	/**
	 * A function that is called when a node is selected.
	 * @param props The prop object.
	 * @param props.editor The editor instance.
	 * @param props.range The range of the selection.
	 * @param props.props The props of the selected target node.
	 * @returns void
	 * @example ({ editor, range, props }) => { props.command(props.props) }
	 */
	command?: (props: { editor: Editor; range: Range; props: TSelected }) => void

	/**
	 * The render function for the popover.
	 * @returns An object with render functions.
	 */
	render?: () => {
		onBeforeStart?: (props: PopoverProps<TSelected>) => void
		onStart?: (props: PopoverProps<TSelected>) => void
		onBeforeUpdate?: (props: PopoverProps<TSelected>) => void
		onUpdate?: (props: PopoverProps<TSelected>) => void
		onExit?: (props: PopoverProps<TSelected>) => void
		onKeyDown?: (props: PopoverKeyDownProps) => boolean
	}

	/**
	 * A function that returns a boolean to indicate if the popover should be active.
	 * @param props The prop object.
	 * @returns {boolean}
	 */
	allow?: (props: { editor: Editor; range: Range; state: EditorState; isActive?: boolean }) => boolean
}

export interface PopoverProps<TSelected = any> {
	/**
	 * The editor instance.
	 */
	editor: Editor

	/**
	 * The range of the target node.
	 */
	range: Range

	/**
	 * The selected item id.
	 */
	id: string

	/**
	 * The selected item label.
	 */
	label: string

	/**
	 * A function that is called when a node target is selected.
	 * @param props The prop object.
	 * @returns void
	 */
	command: (props: TSelected) => void

	/**
	 * The decoration node HTML element
	 * @default null
	 */
	decorationNode: Element | null

	/**
	 * The function that returns the client rect
	 * @default null
	 * @example () => new DOMRect(0, 0, 0, 0)
	 */
	clientRect?: (() => DOMRect | null) | null
}

export interface PopoverKeyDownProps {
	view: EditorView
	event: KeyboardEvent
	range: Range
}

export const PopoverPluginKey = new PluginKey('popover')

/**
 * This utility allows you to create popovers.
 */
export function Popover<TSelected = any>({
	pluginKey = PopoverPluginKey,
	editor,
	decorationTag = 'span',
	decorationClass = 'popover',
	decorationContent = '',
	decorationEmptyClass = 'is-empty',
	command = () => null,
	render = () => ({}),
	allow = () => true,
}: PopoverOptions<TSelected>) {
	let props: PopoverProps<TSelected> | undefined
	const renderer = render?.()

	const plugin: Plugin<any> = new Plugin({
		key: pluginKey,

		view() {

			return {
				update: async (view, prevState) => {
					const prev = this.key?.getState(prevState)
					const next = this.key?.getState(view.state)

					// See how the state changed

					const moved = prev.active && next.active && prev.range.from !== next.range.from
					const started = !prev.active && next.active
					const stopped = prev.active && !next.active
					const changed = !started && !stopped && next.different

					const handleStart = started || (moved && changed)
					const handleChange = changed || moved
					const handleExit = stopped || (moved && changed)

					// Cancel when popover isn't active
					if (!handleStart && !handleChange && !handleExit) {
						return
					}

					const state = handleExit && !handleStart ? prev : next
					const decorationNode = view.dom.querySelector(`[data-decoration-id="${state.decorationId}"]`)

					props = {
						editor,
						range: state.range,
                        id: state.id,
                        label: state.label,
						command: commandProps => {
							return command({
								editor,
								range: state.range,
								props: commandProps,
							})
						},
						decorationNode,
						// virtual node for positioning
						// this can be used for building popups without a DOM node
						clientRect: decorationNode
							? () => {
								// because of `items` can be asynchronous, we’ll search for the current decoration node
								const { decorationId } = this.key?.getState(editor.state) // eslint-disable-line
								const currentDecorationNode = view.dom.querySelector(`[data-decoration-id="${decorationId}"]`)

								return currentDecorationNode?.getBoundingClientRect() || null
							}
							: null,
					}

                    if (handleChange) {
                        renderer?.onExit?.(props)
                        renderer?.onBeforeStart?.(props)
						renderer?.onStart?.(props)
                    }

					if (handleStart) {
						renderer?.onBeforeStart?.(props)
					}

					if (handleChange) {
						renderer?.onBeforeUpdate?.(props)
					}

					if (handleExit) {
						renderer?.onExit?.(props)
					}

					if (handleChange) {
						renderer?.onUpdate?.(props)
					}

					if (handleStart) {
						renderer?.onStart?.(props)
					}
				},

				destroy: () => {
					if (!props) {
						return
					}

					renderer?.onExit?.(props)
				},
			}
		},

		state: {
			// Initialize the plugin's internal state.
			init() {
				const state: {
					active: boolean
					selected: boolean
                    different: boolean
                    id: string
                    label: string
					range: Range
					composing: boolean
					decorationId?: string | null
				} = {
					active: false,
                    different: false,
                    id: "",
                    label: "",
					selected: false,
					range: {
						from: 0,
						to: 0,
					},
					composing: false,
				}

				return state
			},

			// Apply changes to the plugin state from a view transaction.
			apply(transaction, prev, _oldState, state) {
				// const { isEditable, isActive } = editor
				const { composing } = editor.view
				const { selection } = transaction
				const { from, to } = selection
				const next = { ...prev }

				next.composing = composing

				// We can only be suggesting if the view is editable, and:
				//   * there is no selection, or
				//   * a composition is active (see: https://github.com/ueberdosis/tiptap/issues/1449)

				// @ts-ignore g ada node
				if (typeof state.selection.node !== 'undefined') {

					const decorationId = `id_${Math.floor(Math.random() * 0xffffffff)}`

					// If we found a match, update the current state to show it
					if (
						allow({
							editor,
							state,
							range: {
								from,
								to
							},
							isActive: prev.active,
						})
					) {
						next.active = true
						next.different = next.id !== prev.id
                        // @ts-ignore idk
						next.id = state.selection?.node?.attrs?.id ?? ""
                        // @ts-ignore idk
						next.label = state.selection?.node?.attrs?.label ?? ""
						next.decorationId = prev.decorationId ? prev.decorationId : decorationId
						next.range = {
							from, to
						}
					} else {
						next.active = false
					}
				} else {
					next.active = false
				}

				// Make sure to empty the range if suggestion is inactive
				if (!next.active) {
					next.decorationId = null
					next.range = { from: 0, to: 0 }
                    next.id = ""
				}

				return next
			},
		},

		props: {
			// Call the keydown hook if popover is active.
			handleKeyDown(view, event) {
				const { active, range } = plugin.getState(view.state)

				if (!active) {
					return false
				}

				return renderer?.onKeyDown?.({ view, event, range }) || false
			},

			// Setup decorator on the currently active popover.
			decorations(state) {

				const { active, range, decorationId, query } = plugin.getState(state)

				if (!active) {
					return null
				}

				const isEmpty = !query?.length
				const classNames = [decorationClass]

				if (isEmpty) {
					classNames.push(decorationEmptyClass)
				}

				return DecorationSet.create(state.doc, [
					Decoration.inline(range.from, range.to, {
						nodeName: decorationTag,
						class: classNames.join(' '),
						'data-decoration-id': decorationId,
						'data-decoration-content': decorationContent,
					}),
				])
			},
		},
	})

	return plugin
}
