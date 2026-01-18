// ABOUTME: Tests for timezone utility functions
// ABOUTME: Verifies date/time formatting in Eastern Time

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatTime,
  formatTimeRange,
  formatShortDate,
  isToday,
  getRelativeDay,
} from './timezone'

describe('formatDate', () => {
  it('formats date correctly in Eastern Time', () => {
    const result = formatDate('2026-01-20T14:00:00-05:00')
    expect(result).toBe('Tuesday, January 20, 2026')
  })

  it('handles UTC dates', () => {
    const result = formatDate('2026-03-15T19:00:00Z')
    expect(result).toBe('Sunday, March 15, 2026')
  })
})

describe('formatTime', () => {
  it('formats time correctly in Eastern Time', () => {
    const result = formatTime('2026-01-20T14:00:00-05:00')
    expect(result).toBe('2:00 PM')
  })

  it('formats morning time correctly', () => {
    const result = formatTime('2026-01-20T09:30:00-05:00')
    expect(result).toBe('9:30 AM')
  })

  it('handles UTC conversion', () => {
    const result = formatTime('2026-01-20T17:00:00Z')
    expect(result).toBe('12:00 PM')
  })
})

describe('formatTimeRange', () => {
  it('formats time range with en dash', () => {
    const result = formatTimeRange(
      '2026-01-20T14:00:00-05:00',
      '2026-01-20T16:00:00-05:00'
    )
    expect(result).toBe('2:00 PM – 4:00 PM')
  })

  it('handles range spanning hours', () => {
    const result = formatTimeRange(
      '2026-01-20T11:30:00-05:00',
      '2026-01-20T13:45:00-05:00'
    )
    expect(result).toBe('11:30 AM – 1:45 PM')
  })
})

describe('formatShortDate', () => {
  it('formats short date correctly', () => {
    const result = formatShortDate('2026-01-20T14:00:00-05:00')
    expect(result).toBe('Jan 20')
  })

  it('formats different month correctly', () => {
    const result = formatShortDate('2026-12-25T10:00:00-05:00')
    expect(result).toBe('Dec 25')
  })
})

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true for today', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = isToday('2026-01-20T18:00:00-05:00')
    expect(result).toBe(true)
  })

  it('returns false for yesterday', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = isToday('2026-01-19T18:00:00-05:00')
    expect(result).toBe(false)
  })

  it('returns false for tomorrow', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = isToday('2026-01-21T10:00:00-05:00')
    expect(result).toBe(false)
  })
})

describe('getRelativeDay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for today', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = getRelativeDay('2026-01-20T18:00:00-05:00')
    expect(result).toBe('Today')
  })

  it('returns "Tomorrow" for tomorrow', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = getRelativeDay('2026-01-21T14:00:00-05:00')
    expect(result).toBe('Tomorrow')
  })

  it('returns formatted date for other days', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = getRelativeDay('2026-01-25T14:00:00-05:00')
    expect(result).toBe('Sunday, Jan 25')
  })

  it('returns formatted date for past days', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00-05:00'))
    const result = getRelativeDay('2026-01-18T10:00:00-05:00')
    expect(result).toBe('Sunday, Jan 18')
  })
})
