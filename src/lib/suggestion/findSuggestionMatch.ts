import type { Range } from '@tiptap/core'
import { escapeForRegEx } from '@tiptap/core'
import type { ResolvedPos } from '@tiptap/pm/model'

export interface Trigger {
  char: string
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
  const { char, allowSpaces: allowSpacesOption, allowToIncludeChar, allowedPrefixes, startOfLine, $position } = config

  const allowSpaces = allowSpacesOption && !allowToIncludeChar
  console.log("🚀 ~ findSuggestionMatch ~ allowSpaces:", allowSpaces)

  const escapedChar = escapeForRegEx(char)
  const suffix = new RegExp(`\\s${escapedChar}$`)
  const prefix = startOfLine ? '^' : '\\s*'
  const finalEscapedChar = allowToIncludeChar ? '' : escapedChar
  const regexp = allowSpaces
    ? new RegExp(`${prefix}${escapedChar}.*?(?=\\s${finalEscapedChar}|$)`, 'gm')
    : new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${finalEscapedChar}]*`, 'gm')

  const text = $position.nodeBefore?.isText && $position.nodeBefore.text

  if (!text) {
    return null
  }

  const textFrom = $position.pos - text.length
  const match = Array.from(text.matchAll(regexp)).pop()
  console.log("🚀 ~ findSuggestionMatch ~ match:", match)

  if (!match || match.input === undefined || match.index === undefined) {
    return null
  }

  // JavaScript doesn't have lookbehinds. This hacks a check that first character
  // is a space or the start of the line
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index)
  console.log("🚀 ~ findSuggestionMatch ~ match.input:", match.input)
  console.log("🚀 ~ findSuggestionMatch ~ Math.max:", Math.max(0, match.index - 1))
  console.log("🚀 ~ findSuggestionMatch ~ matchPrefix:", matchPrefix)
  console.log("🚀 ~ findSuggestionMatch ~ allowedPrefixes:", allowedPrefixes)
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join('')}\0]?$`).test(matchPrefix)
  console.log("🚀 ~ findSuggestionMatch ~ matchPrefixIsAllowed:", matchPrefixIsAllowed)
  console.log("🚀 ~ findSuggestionMatch ~ matchPrefixIsAllowed: hasil", new RegExp(`^[${allowedPrefixes?.join('')}\0]?$`).exec(matchPrefix))

  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    console.log("allowedPrefixes diatur tapi matchPrefixIsAllowed tidak ditemukan");
    return null
  }

  allowedPrefixes !== null && console.log("allowedPrefixes diatur");
  matchPrefixIsAllowed !== null && console.log("allowedPrefixes ditemukan");

  // The absolute position of the match in the document
  const from = textFrom + match.index
  console.log("🚀 ~ findSuggestionMatch ~ textFrom:", textFrom)
  console.log("🚀 ~ findSuggestionMatch ~ match.index:", match.index)
  console.log("🚀 ~ findSuggestionMatch ~ from:", from)
  // form anak elament dari paragraf node ke 1 span, 2 span ... dst.
  let to = from + match[0].length
  // to : anak element dari 1 span/ 2 span
  console.log("🚀 ~ findSuggestionMatch ~ match[0].length:", match[0].length)
  console.log("🚀 ~ findSuggestionMatch ~ to:", to)

  // Edge case handling; if spaces are allowed and we're directly in between
  // two triggers

  console.log("🚀 ~ findSuggestionMatch ~ to - 1, to + 1:", to - 1, to + 1)
  console.log("🚀 ~ findSuggestionMatch ~ text.slice(to - 1, to + 1):", text.slice(to - 1, to + 1))
  console.log("🚀 ~ findSuggestionMatch ~ suffix.test(text.slice(to - 1, to + 1)):", suffix.test(text.slice(to - 1, to + 1)))

  if (allowSpaces && suffix.test(text.slice(to - 1, to + 1))) {
    console.log("allowSpaces true dan suffix test cocok");

    match[0] += ' '
    to += 1
  }

  !allowSpaces && console.log("allowSpaces false");
  !suffix.test(text.slice(to - 1, to + 1)) && console.log("suffix tidak cocok");

  // If the $position is located within the matched substring, return that range

  const prefixCharMatch = Array.from(text.matchAll(allowSpaces
    ? new RegExp(`${prefix}${escapedChar}`, 'gm')
    : new RegExp(`${prefix}(?:^)?${escapedChar}`, 'gm'))).pop()

  console.log("🚀 ~ findSuggestionMatch ~ prefixCharMatch:", prefixCharMatch)

  let prefixCharLength = char.length

  if (prefixCharMatch !== undefined && prefixCharMatch.input && prefixCharMatch.index != null) {
    console.log("🚀 ~ findSuggestionMatch ~ prefixCharMatch:", prefixCharMatch)
    prefixCharLength = prefixCharMatch[0].length
  }

  console.log("🚀 ~ findSuggestionMatch ~ match[0]:", match[0])
  console.log("🚀 ~ findSuggestionMatch ~ prefixCharLength:", prefixCharLength)
  console.log("🚀 ~ findSuggestionMatch ~ match[0].slice(prefixCharLength):", match[0].slice(prefixCharLength))

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
