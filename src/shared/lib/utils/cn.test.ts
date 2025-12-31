import { cn } from './cn'

describe('cn (className utility)', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conflicting Tailwind classes', () => {
    // Later classes should override earlier ones
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class', false && 'hidden-class')).toBe(
      'base-class conditional-class'
    )
  })

  it('handles undefined and null values', () => {
    expect(cn('base-class', undefined, null, 'another-class')).toBe(
      'base-class another-class'
    )
  })

  it('handles empty arrays', () => {
    expect(cn('base-class', [])).toBe('base-class')
  })

  it('handles arrays of classes', () => {
    expect(cn(['px-4', 'py-2'], 'text-sm')).toBe('px-4 py-2 text-sm')
  })

  it('handles objects with boolean values', () => {
    expect(cn({
      'px-4': true,
      'py-2': false,
      'text-sm': true
    })).toBe('px-4 text-sm')
  })

  it('combines all input types', () => {
    expect(cn(
      'base',
      ['array-1', 'array-2'],
      { 'object-true': true, 'object-false': false },
      null,
      undefined,
      'final'
    )).toBe('base array-1 array-2 object-true final')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('properly merges Tailwind conflict from complex inputs', () => {
    expect(cn(
      'text-base font-medium',
      { 'text-lg': true, 'font-bold': false },
      ['text-sm', 'font-semibold']
    )).toBe('text-sm font-semibold') // text-sm should override text-base and text-lg
  })
})
