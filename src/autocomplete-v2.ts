import { Extension, Node } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export const ManualAutocomplete = Node.create<
	{
		applySuggestionKey: string;
		suggestionDebounce: number;
	},
	{
		getSuggestion: ((previousText: string, cb: (suggestion: string | null) => void) => void) | undefined;
		suggestion: string | null;
	}
>({
	name: 'suggestion',

	addOptions() {
		return {
			applySuggestionKey: 'Tab',
			suggestionDebounce: 1500,
			previousTextLength: 4000,
		};
	},

	addProseMirrorPlugins() {
		const pluginKey = new PluginKey<DecorationSet>('suggestion');

		const getSuggestion = (s: string, cb: (suggestion: string | null)=>void)=>{
			cb("Agri")
		};
		// const getSuggestion = debounce(async (previousText: string, cb: (suggestion: string | null) => void) => {
		// 	const suggestion = await $fetch('/api/suggest', {
		// 		method: 'POST',
		// 		body: JSON.stringify({ previousText }),
		// 	});

		// 	cb(suggestion);
		// }, this.options.suggestionDebounce);

		return [
			new Plugin({
				key: pluginKey,
				state: {
					init() {
						return DecorationSet.empty;
					},
					apply(tr, oldValue) {
						if (tr.getMeta(pluginKey)) {
							// Update the decoration state based on the async data
							const { decorations } = tr.getMeta(pluginKey);
							return decorations;
						}
						return tr.docChanged ? oldValue.map(tr.mapping, tr.doc) : oldValue;
					},
				},
				view() {
					return {
						update(view, prevState) {
							// This will add the widget decoration at the cursor position
							const selection = view.state.selection;
							const cursorPos = selection.$head.pos;
							const nextNode = view.state.doc.nodeAt(cursorPos);

							// If the cursor is not at the end of the block and we have a suggestion => hide the suggestion
							if (nextNode && !nextNode.isBlock && pluginKey.getState(view.state)?.find().length) {
								const tr = view.state.tr;
								tr.setMeta('addToHistory', false);
								tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
								view.dispatch(tr);
								return;
							}

							// If the document didn't change, do nothing
							if (prevState && prevState.doc.eq(view.state.doc)) {
								return;
							}

							// reset the suggestion before fetching a new one
							setTimeout(() => {
								const tr = view.state.tr;
								tr.setMeta('addToHistory', false);
								tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
								view.dispatch(tr);
							}, 0);

							// fetch a new suggestion
							const previousText = view.state.doc.textBetween(0, view.state.doc.content.size, ' ').slice(-4000);
							getSuggestion(previousText, (suggestion) => {
								if (!suggestion) return;

								const updatedState = view.state;

								const cursorPos = updatedState.selection.$head.pos;
								const suggestionDecoration = Decoration.widget(
									cursorPos,
									() => {
										const parentNode = document.createElement('span');
										const addSpace = nextNode && nextNode.isText ? ' ' : '';
										parentNode.innerHTML = `${addSpace}${suggestion}`;
										parentNode.classList.add('autocomplete-suggestion');
										return parentNode;
									},
									{ side: 1 },
								);

								const decorations = DecorationSet.create(updatedState.doc, [suggestionDecoration]);
								const tr = view.state.tr;
								tr.setMeta('addToHistory', false);
								tr.setMeta(pluginKey, { decorations });
								view.dispatch(tr);
							});
						},
					};
				},
				props: {
					decorations(editorState) {
						return pluginKey.getState(editorState);
					},
					handleKeyDown(view, event) {
						// TODO: apply suggestion
						return false;
					},
				},
			}),
		];
	},
});
