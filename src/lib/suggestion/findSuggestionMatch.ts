import type {Range} from '@tiptap/core'
import {escapeForRegEx} from '@tiptap/core'
import type {ResolvedPos} from '@tiptap/pm/model'

export interface Trigger {
    delimiters: [string, string]
    allowSpaces: boolean
    allowToIncludeChar: boolean
    allowedPrefixes: string[] | null
    startOfLine: boolean
    $position: ResolvedPos
}

export type SuggestionMatch = {
    range: Range
    query: string
    text: string
} | null

export function findSuggestionMatch(config: Trigger): SuggestionMatch {
    const {
        delimiters,
        allowSpaces: allowSpacesOption,
        allowToIncludeChar,
        allowedPrefixes,
        startOfLine,
        $position
    } = config

    const allowSpaces = allowSpacesOption && !allowToIncludeChar

    const escapedDelimiters = [escapeForRegEx(delimiters[0]), escapeForRegEx(delimiters[1])]
    const suffix = new RegExp(`\\s${escapedDelimiters[0]}$`)
    const prefix = startOfLine ? '^' : ''
    const finalEscapedChar = allowToIncludeChar ? '' : escapedDelimiters[0]
    const regexp = allowSpaces
        ? new RegExp(`${prefix}${escapedDelimiters[0]}.*?(?=\\s${finalEscapedChar}|$)`, 'gm')
        : new RegExp(`${prefix}(?:^)?${escapedDelimiters[0]}[^\\s${finalEscapedChar}]*`, 'gm')

    const text = $position.nodeBefore?.isText && $position.nodeBefore.text

    if (!text) {
        return null
    }

    const textFrom = $position.pos - text.length
    const match = Array.from(text.matchAll(regexp)).pop()


    if (!match || match.input === undefined || match.index === undefined) {
        return null
    }

    // JavaScript doesn't have lookbehinds. This hacks a check that the first character
    // is a space or the start of the line
    const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index)
    const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join('')}\0]?$`).test(matchPrefix)

    if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
        return null
    }

    // The absolute position of the match in the document
    const from = textFrom + match.index
    let to = from + match[0].length

    // Edge case handling; if spaces are allowed and we're directly in between
    // two triggers

    if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
        match[0] += ' '
        to += 1
    }

    // If the $position is located within the matched substring, return that range

    const prefixCharMatch = Array.from(text.matchAll(allowSpaces
        ? new RegExp(`${prefix}${escapedDelimiters[0]}`, 'gm')
        : new RegExp(`${prefix}(?:^)?${escapedDelimiters[0]}`, 'gm'))).pop()

    let prefixCharLength = delimiters[0].length

    if (prefixCharMatch !== undefined && prefixCharMatch.input && prefixCharMatch.index != null) {
        prefixCharLength = prefixCharMatch[0].length
    }

    if (from < $position.pos && to >= $position.pos) {
        return {
            range: {
                from,
                to,
            },
            query: match[0].slice(prefixCharLength),
            text: match[0],
        }
    }

    return null
}
