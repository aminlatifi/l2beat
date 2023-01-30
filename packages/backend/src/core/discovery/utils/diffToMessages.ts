import { MAX_MESSAGE_LENGTH } from '../../../peripherals/discord/DiscordClient'
import { FieldDiff } from './diffContracts'
import { DiscoveryDiff } from './diffDiscovery'

export function diffToMessages(name: string, diffs: DiscoveryDiff[]): string[] {
  const header = getHeader(name)
  const overheadLength = header.length + wrapDiffCodeBlock('').length

  const maxLength = MAX_MESSAGE_LENGTH - overheadLength
  const messages = diffs.flatMap((diff) =>
    contractDiffToMessages(diff, maxLength),
  )

  const bundledMessages = bundleMessages(messages, maxLength)

  return bundledMessages.map((m) => `${header}${wrapDiffCodeBlock(m)}`)
}

export function contractDiffToMessages(
  diff: DiscoveryDiff,
  maxLength = MAX_MESSAGE_LENGTH,
): string[] {
  if (diff.type === 'created') {
    return [`+ New contract: ${diff.name} | ${diff.address.toString()}\n\n`]
  }

  if (diff.type === 'deleted') {
    return [`- Deleted contract: ${diff.name} | ${diff.address.toString()}\n\n`]
  }

  const contractHeader = `${diff.name} | ${diff.address.toString()}\n\n`
  const messages = diff.diff?.map(fieldDiffToMessage) ?? []

  //bundle message is called second time to handle situation when
  //diff in a single contract would result in a message larger than MAX_MESSAGE_LENGTH
  const maxLengthAdjusted = maxLength - contractHeader.length
  const bundledMessages = bundleMessages(messages, maxLengthAdjusted)

  return bundledMessages.map((m) => `${contractHeader}${m}`)
}

// current implementation of message bundling works based on the assumption
// that every element of messages array is no longer than MAX_MESSAGE_LENGTH
export function bundleMessages(
  messages: string[],
  maxLength: number,
): string[] {
  const bundle: string[] = ['']
  let index = 0

  for (const message of messages) {
    if (message.length + bundle[index].length > maxLength) {
      index++
      bundle.push('')
    }

    bundle[index] += message
  }
  return bundle
}

export function fieldDiffToMessage(diff: FieldDiff): string {
  let message = ''

  if (diff.key !== undefined) {
    message += `${diff.key}\n`
  }
  if (diff.before) {
    message += `- ${diff.before}\n`
  }
  if (diff.after) {
    message += `+ ${diff.after}\n`
  }

  message += '\n'

  return message
}

function getHeader(name: string) {
  return `${wrapBoldAndItalic(name)} | detected changes`
}

export function wrapBoldAndItalic(content: string) {
  const affix = '***'
  return `${affix}${content}${affix}`
}

export function wrapDiffCodeBlock(content: string) {
  const prefix = '```diff\n'
  const postfix = '```'

  return `${prefix}${content}${postfix}`
}