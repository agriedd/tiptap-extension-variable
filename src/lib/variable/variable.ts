import type {Editor} from '@tiptap/core'
import {mergeAttributes, Node} from '@tiptap/core'
import type {DOMOutputSpec} from '@tiptap/pm/model'
import {Node as ProseMirrorNode} from '@tiptap/pm/model'
import type {SuggestionOptions} from '../suggestion/suggestion'
import {Suggestion} from '../suggestion/suggestion'

import {getSuggestionOptions} from './utils/get-default-suggestion-attributes'
import {Popover, PopoverOptions} from '../suggestion/popover'
import {getPopoverOptions} from './utils/get-default-popover-attributes'

// See `addAttributes` below
export interface VariableNodeAttrs {
    /**
     * The identifier for the selected item that was mentioned, stored as a `data-id`
     * attribute.
     */
    id: string | null
    /**
     * The label to be rendered by the editor as the displayed text for this mentioned
     * item, if provided. Stored as a `data-label` attribute. See `renderLabel`.
     */
    label?: string | null
    /**
     * The character that triggers the suggestion, stored as
     * `data-variable-suggestion-char` attribute.
     */
    delimiterOpen?: string
    delimiterClose?: string
}

export interface VariableOptions<SuggestionItem = any, Attrs extends Record<string, any> = VariableNodeAttrs> {
    /**
     * The HTML attributes for a variable node.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string, any>

    /**
     * A function to render the label of a variable.
     * @deprecated use renderText and renderHTML instead
     * @param props The render props
     * @returns The label
     * @example ({ options, node }) => `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
     */
    renderLabel?: (props: {
        options: VariableOptions<SuggestionItem, Attrs>
        node: ProseMirrorNode
        suggestion: SuggestionOptions | null
    }) => string

    /**
     * A function to render the text of a variable.
     * @param props The render props
     * @returns The text
     * @example ({ options, node }) => `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`
     */
    renderText: (props: {
        options: VariableOptions<SuggestionItem, Attrs>
        node: ProseMirrorNode
        suggestion: SuggestionOptions | null
    }) => string

    /**
     * A function to render the HTML of a variable.
     * @param props The render props
     * @returns The HTML as a ProseMirror DOM Output Spec
     * @example ({ options, node }) => ['span', { 'data-type': 'variable' }, `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`]
     */
    renderHTML: (props: {
        options: VariableOptions<SuggestionItem, Attrs>
        node: ProseMirrorNode
        suggestion: SuggestionOptions | null
    }) => DOMOutputSpec

    /**
     * Whether to delete the trigger character with backspace.
     * @default false
     */
    deleteTriggerWithBackspace: boolean

    /**
     * The suggestion options, when you want to support multiple triggers.
     *
     * @default [{ delimiters: ['{{', '}}'], pluginKey: VariablePluginKey }]
     * @example [{ delimiters: ['{{', '}}'], pluginKey: VariablePluginKey }, { delimiters: ['{{', '}}'], pluginKey: new PluginKey('hashtag') }]
     */
    suggestions: Array<Omit<SuggestionOptions<SuggestionItem, Attrs>, 'editor'>>

    /**
     * The suggestion options, when you want to support only one trigger. To support multiple triggers, use the
     * `suggestions` parameter instead.
     *
     * @default {}
     * @example { delimiters: ['{{', '}}'], pluginKey: VariablePluginKey, command: ({ editor, range, props }) => { ... } }
     */
    suggestion: Omit<SuggestionOptions<SuggestionItem, Attrs>, 'editor'>
    popover: Omit<PopoverOptions<Attrs>, 'editor'>
}

interface GetSuggestionsOptions {
    editor?: Editor
    options: VariableOptions
    name: string
}

interface GetPopoversOptions {
    editor?: Editor
    options: VariableOptions
    name: string
}

/**
 * Returns the suggestions for the variable extension.
 *
 * @param options The extension options
 * @returns the suggestions
 */
function getSuggestions(options: GetSuggestionsOptions) {
    return (options.options.suggestions.length ? options.options.suggestions : [options.options.suggestion]).map(
        suggestion =>
            getSuggestionOptions({
                // @ts-ignore `editor` can be `undefined` when converting the document to HTML with the HTML utility
                editor: options.editor,
                overrideSuggestionOptions: suggestion,
                extensionName: options.name,
                delimiters: suggestion.delimiters,
                allowSpaces: suggestion.allowSpaces,
            }),
    )
}

function getPopovers(options: GetPopoversOptions) {
    return [options.options.popover].map(
        popover =>
            getPopoverOptions({
                // @ts-ignore `editor` can be `undefined` when converting the document to HTML with the HTML utility
                editor: options.editor,
                overridePopoverOptions: popover,
                extensionName: options.name,
            }),
    )
}

/**
 * Returns the suggestion options of the variable that has a given character trigger. If not
 * found, it returns the first suggestion.
 *
 * @param options The extension options
 * @param delimiters The character that triggers the variable
 * @returns The suggestion options
 */
function getSuggestionFromChar(options: GetSuggestionsOptions, delimiters: [string, string]) {
    const suggestions = getSuggestions(options)

    const suggestion = suggestions.find(s => (s.delimiters ?? [])[0] === delimiters[0] && (s.delimiters ?? [])[1] === delimiters[1])

    if (suggestion) {
        return suggestion
    }

    if (suggestions.length) {
        return suggestions[0]
    }

    return null
}

/**
 * This extension allows you to insert variables into the editor.
 */
export const Variable = Node.create<VariableOptions>({
    name: 'variable',

    priority: 101,

    addOptions() {
        return {
            HTMLAttributes: {
                'class': 'variable-label'
            },
            renderText({node, suggestion}) {
                const delimiterOpen = (suggestion?.delimiters ?? [])[0] ?? "{{";
                const delimiterClose = (suggestion?.delimiters ?? [])[1] ?? "}}";
                return `${delimiterOpen}${node.attrs.id ?? node.attrs.label}${delimiterClose}`
            },
            deleteTriggerWithBackspace: false,
            renderHTML({options, node, suggestion}) {

                const fragment = document.createDocumentFragment();

                const spanDelimiterOpen = document.createElement('span');
                spanDelimiterOpen.className = 'variable-label-delimiter delimiter-open';
                spanDelimiterOpen.textContent = (suggestion?.delimiters ?? [])[0] ?? "{{";
                fragment.appendChild(spanDelimiterOpen);

                const spanContent = document.createElement('span');
                spanContent.className = 'variable-label-text';
                spanContent.textContent = node.attrs.id ?? node.attrs.label;
                fragment.appendChild(spanContent);

                const spanDelimiterClose = document.createElement('span');
                spanDelimiterClose.className = 'variable-label-delimiter delimiter-close';
                spanDelimiterClose.textContent = (suggestion?.delimiters ?? [])[1] ?? "}}";
                fragment.appendChild(spanDelimiterClose);

                return [
                    'span',
                    mergeAttributes(this.HTMLAttributes, options.HTMLAttributes),
                    fragment
                ]
            },
            suggestions: [],
            suggestion: {},
            popover: {},
        }
    },

    group: 'inline',

    inline: true,

    selectable: true,

    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('data-id'),
                renderHTML: attributes => {
                    if (!attributes.id) {
                        return {}
                    }

                    return {
                        'data-id': attributes.id,
                    }
                },
            },

            label: {
                default: null,
                parseHTML: element => element.getAttribute('data-label'),
                renderHTML: attributes => {
                    if (!attributes.label) {
                        return {}
                    }

                    return {
                        'data-label': attributes.label,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: `span[data-type="${this.name}"]`,
            },
        ]
    },

    renderHTML({node, HTMLAttributes}) {
        const suggestion = getSuggestionFromChar(this, [node.attrs.delimiterOpen, node.attrs.delimiterClose])

        // if (this.options.renderLabel !== undefined) {
        // 	console.warn('renderLabel is deprecated use renderText and renderHTML instead')
        // 	return [
        // 		'span',
        // 		mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes),
        // 		this.options.renderLabel({
        // 			options: this.options,
        // 			node,
        // 			suggestion,
        // 		}),
        // 	]
        // }

        const mergedOptions = {...this.options}

        mergedOptions.HTMLAttributes = mergeAttributes(
            {'data-type': this.name},
            this.options.HTMLAttributes,
            HTMLAttributes,
        )

        const html = this.options.renderHTML({
            options: mergedOptions,
            node,
            suggestion,
        })

        if (typeof html === 'string') {
            return ['span', mergeAttributes({'data-type': this.name}, this.options.HTMLAttributes, HTMLAttributes), html]
        }
        return html
    },

    renderText({node}) {
        const args = {
            options: this.options,
            node,
            suggestion: getSuggestionFromChar(this, [node.attrs.delimiterOpen, node.attrs.delimiterClose]),
        }
        // if (this.options.renderLabel !== undefined) {
        // 	console.warn('renderLabel is deprecated use renderText and renderHTML instead')
        // 	return this.options.renderLabel(args)
        // }

        return this.options.renderText(args)
    },

    addKeyboardShortcuts() {
        return {
            Backspace: () =>
                this.editor.commands.command(({tr, state}) => {
                    let isMention = false
                    const {selection} = state
                    const {empty, anchor} = selection

                    if (!empty) {
                        return false
                    }

                    // Store node and position for later use
                    let variableNode = new ProseMirrorNode()
                    let variablePos = 0

                    state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
                        if (node.type.name === this.name) {
                            isMention = true
                            variableNode = node
                            variablePos = pos
                            return false
                        }
                    })

                    if (isMention) {
                        tr.insertText(
                            this.options.deleteTriggerWithBackspace ? '' : variableNode.attrs.delimiterOpen,
                            variablePos,
                            variablePos + variableNode.nodeSize,
                        )
                    }

                    return isMention
                }),
        }
    },

    addProseMirrorPlugins() {
        // Create a plugin for each suggestion configuration
        return [
            ...getSuggestions(this).map(Suggestion),
            ...getPopovers(this).map(Popover),
        ]
    },
})

