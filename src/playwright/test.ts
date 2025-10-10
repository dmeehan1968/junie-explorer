import { expect as base, Locator } from "@playwright/test"

export const expect = base.extend({
  async toHaveTrimmedText(locator: Locator, minimumLength: number = 1) {
    const text = await locator.textContent()
    const pass = !!text && text.trim().length >= minimumLength
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to have trimmed text of at least ${minimumLength} characters (got "${text}")`
          : `expected ${locator} to have trimmed text of at least ${minimumLength} characters (got "${text}")`,
    }
  },

  async toBeFormattedNumber(locator: Locator) {
    const text = await locator.textContent()
    const pass = !!text && /^\d{1,3}(,\d{3})*$/.test(text)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to be formatted number (got "${text}")`
          : `expected ${locator} to be formatted number (got "${text}")`,
    }
  },

  async toBeDecimalNumber(locator: Locator, decimalPlaces: number) {
    const text = await locator.textContent()
    const regex = new RegExp(`^[0-9]+[.][0-9]{1,${decimalPlaces}}$`)
    const pass = !!text && regex.test(text)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to be decimal number with ${decimalPlaces} decimal places (got "${text}")`
          : `expected ${locator} to be decimal number with ${decimalPlaces} decimal places (got "${text}")`,
    }
  },

  async toBeFormattedTime(locator: Locator) {
    const text = await locator.textContent()
    const pass = !!text && /^(\d+:)?\d{1,2}:\d{2}$/.test(text)
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to be formatted time (got "${text}")`
          : `expected ${locator} to be formatted time (got "${text}")`,
    }
  },

  async toHaveCountInRange(locator: Locator, min: number, max: number = Infinity) {
    const count = await locator.count()
    const pass = count >= min && count <= max
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to have count in range ${min}-${max} (got ${count})`
          : `expected ${locator} to have count in range ${min}-${max} (got ${count})`,
    }
  },

  async toBeMissing(locator: Locator) {
    const count = await locator.count()
    const pass = count === 0
    return {
      pass,
      message: () =>
        pass
          ? `expected ${locator} not to be missing (got ${count})`
          : `expected ${locator} to be missing (got ${count})`,
    }
  },
})