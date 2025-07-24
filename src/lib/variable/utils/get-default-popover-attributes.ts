import type { Editor } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import type { PopoverOptions } from '../../suggestion/popover'

/**
 * Arguments for the `getPopoverOptions` function
 * @see getPopoverOptions
 */
export interface GetPopoverOptions {
  /**
   * The Tiptap editor instance.
   */
  editor: Editor
  /**
   * The popover options configuration provided to the
   * `Mention` extension.
   */
  overridePopoverOptions: Omit<PopoverOptions, 'editor'>
  /**
   * The name of the Mention extension
   */
  extensionName: string
}

/**
 * Returns the popover options for a trigger of the Mention extension. These
 * options are used to create a `Popover` ProseMirror plugin. Each plugin lets
 * you define a different trigger that opens the Mention menu. For example,
 * you can define a `@` trigger to mention users and a `#` trigger to mention
 * tags.
 *
 * @param param0 The configured options for the popover
 * @returns
 */
export function getPopoverOptions({
  editor: tiptapEditor,
  overridePopoverOptions,
  extensionName,
}: GetPopoverOptions): PopoverOptions {
  const pluginKey = new PluginKey()

  return {
    editor: tiptapEditor,
    pluginKey,
    command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
      // increase range.to by one when the next node is of type "text"
      // and starts with a space character
      const nodeAfter = editor.view.state.selection.$to.nodeAfter
      const overrideSpace = nodeAfter?.text?.startsWith(' ')

      if (overrideSpace) {
        range.to += 1
      }

      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: extensionName,
            attrs: { ...props, },
          },
          {
            type: 'text',
            text: ' ',
          },
        ])
        .run()

      // get reference to `window` object from editor element, to support cross-frame JS usage
      editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd()
    },
    allow: ({ state, range }: { state: any; range: any }) => {

      const $from = state.doc.resolve(range.from)
      const type = state.schema.nodes[extensionName]
      const allow = !!$from.parent.type.contentMatch.matchType(type)

      return allow
    },
    ...overridePopoverOptions,
  }
}
