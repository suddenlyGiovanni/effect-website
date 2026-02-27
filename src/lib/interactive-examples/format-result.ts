export const formatResultForNode = (result: unknown): string => {
  if (typeof result === "number" || typeof result === "boolean") {
    return String(result)
  }

  if (typeof result === "string") {
    return result
  }

  if (result instanceof Error) {
    return result.message
  }

  if (result === null) {
    return "null"
  }

  if (result === undefined) {
    return "void"
  }

  return "value"
}

export const truncateResultLabel = (value: string, maxLength = 14): string => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 1))}…`
}
