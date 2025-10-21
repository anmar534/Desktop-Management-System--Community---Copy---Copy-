/**
 * Default Percentages Propagation Utility
 */

export const propagateDefaultPercentages = (data: any): any => {
  // Stub implementation
  return data
}

export const getDefaultPercentages = (): Record<string, number> => {
  // Stub implementation
  return {}
}

export const applyDefaultsToPricingMap = (pricingMap: Map<string, any>): Map<string, any> => {
  const defaults = getDefaultPercentages()
  const result = new Map(pricingMap)
  result.forEach((value, key) => {
    result.set(key, { ...value, ...defaults })
  })
  return result
}

