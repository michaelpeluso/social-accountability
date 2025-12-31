# Development Rules Index

**For AI Agents & Developers**

These rules ensure code quality, security, and consistency across the codebase.

---

## ⚡ Quick Start

**AI Agents:** Start with [../QUICKSTART.md](../QUICKSTART.md) for complete navigation.

**Developers:** Read these 2 files:

1. [CODING-STANDARDS.md](CODING-STANDARDS.md) - TypeScript patterns + security
2. [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md) - How to read specs

---

## Files in This Folder

| File                                       | Purpose                                                   | Read When                                  |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------ |
| [CODING-STANDARDS.md](CODING-STANDARDS.md) | TypeScript patterns, security rules, testing requirements | Writing any code                           |
| [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md)     | How to read and navigate spec files                       | First time or confused about documentation |

---

## What's Where

### TypeScript Standards

→ [CODING-STANDARDS.md](CODING-STANDARDS.md#typescript-standards)

- Strict mode rules
- Naming conventions
- Type organization
- Function/component patterns

### Security Rules

→ [CODING-STANDARDS.md](CODING-STANDARDS.md#security)

- Privacy enforcement (CRITICAL)
- Authentication patterns
- Rate limiting
- Input validation
- Ownership checks

### Error Handling

→ [CODING-STANDARDS.md](CODING-STANDARDS.md#error-handling)

- Typed errors (AppError)
- Error boundaries
- API error responses

### Logging

→ [CODING-STANDARDS.md](CODING-STANDARDS.md#logging)

- Structured logging
- PII restrictions
- What to log/not log

### Testing

→ [CODING-STANDARDS.md](CODING-STANDARDS.md#testing)

- Unit test patterns
- Integration test patterns
- Coverage requirements

### Spec Navigation

→ [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md)

- How to read milestone files
- Metadata headers
- Search keywords
- Cross-reference formats

---

## Critical Rules Summary

### TypeScript

- ❌ **No `any` types** (use `unknown` + type guards)
- ✅ Explicit return types on all functions
- ✅ Strict mode enabled

### Security

- 🔒 **Server-side privacy enforcement** (never trust client)
- 🔒 **All endpoints require auth** (except /health, /auth/\*)
- 🔒 **Rate limit everything**
- 🔒 **Validate ownership** (user can only modify their own data)

### Logging

- 📝 **No PII** (emails, names, content, location)
- 📝 Structured JSON format
- 📝 Log IDs, not identifiable data

### Testing

- ✅ 80% coverage for logic functions
- ✅ Test privacy enforcement
- ✅ Test success + error cases

---

## How to Use These Rules

### For AI Agents

1. **First time?** Read [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md)
2. **Writing code?** Reference [CODING-STANDARDS.md](CODING-STANDARDS.md)
3. **Confused?** Go to [../QUICKSTART.md](../QUICKSTART.md)

### For Developers

1. **Setup:** Read both files once (10 min total)
2. **Daily:** Reference CODING-STANDARDS.md when coding
3. **PR Review:** Check against "Before Every PR" checklist

---

## When to Update Rules

Update [CODING-STANDARDS.md](CODING-STANDARDS.md) when:

- Adding new TypeScript patterns
- Changing security requirements
- Adding new testing patterns

Update [AI-AGENT-GUIDE.md](AI-AGENT-GUIDE.md) when:

- Changing spec file structure
- Adding new metadata formats
- Updating documentation organization

Don't update rules for:

- Feature changes (update spec/ files instead)
- API changes (update spec/api-contracts.md)
- Schema changes (update spec/data-model.md)

---

## Related Documentation

- **Product Requirements:** [../spec/](../spec/) folder
- **Navigation Hub:** [../QUICKSTART.md](../QUICKSTART.md)
- **GitHub Copilot Context:** [../.github/copilot-instructions.md](../.github/copilot-instructions.md)

---

**Last Updated:** December 31, 2025
