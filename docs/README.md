# Project Documentation

This directory contains comprehensive documentation for the project.

## Documents

### [Testing Strategy & Guidelines](./TESTING_STRATEGY.md)
**Complete testing guide for the project**

- Testing philosophy and principles
- Testing stack and setup
- FSD testing strategy
- Writing good tests
- Test coverage goals
- Common patterns and troubleshooting

### [Testing Quick Reference](./TESTING_QUICK_REF.md)
**Quick cheat sheet for daily testing**

- Common commands
- Test templates
- Common mocks
- Queries and assertions
- Debugging tips

---

## How to Use These Docs

### For New Developers
1. Start with [Testing Strategy](./TESTING_STRATEGY.md) - Read sections 1-5
2. Refer to [Quick Reference](./TESTING_QUICK_REF.md) when writing tests
3. Check examples in your codebase under `src/**/*.test.ts*`

### For Daily Development
- Keep [Quick Reference](./TESTING_QUICK_REF.md) open
- Copy test templates from the docs
- Look up common patterns when needed

### For Code Reviews
- Use coverage goals from [Testing Strategy](./TESTING_STRATEGY.md)
- Ensure tests follow AAA pattern
- Check that tests verify behavior, not implementation

---

## Contributing

When adding new testing patterns or discovering new best practices:
1. Update the relevant documentation
2. Add examples from the actual codebase
3. Keep it concise and practical
4. Update the "Last Updated" date in the header

---

**Last Updated:** 2025-12-30
