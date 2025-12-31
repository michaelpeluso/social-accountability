# Development Rules Index

**For AI Agents & Developers**

These rules ensure code quality, security, and consistency across the codebase.

---

## Quick Reference

| Topic | Read This |
|-------|-----------|
| How to interpret specs | [ai-agent-guide.md](ai-agent-guide.md) |
| Code patterns & style | [code-style.md](code-style.md) |
| Security & privacy requirements | [security-privacy.md](security-privacy.md) |

---

## ai-agent-guide.md

**Purpose:** Instructions for AI agents on how to read and interpret the spec files

**Key Topics:**
- File structure and organization
- Metadata headers
- Reading order recommendations
- Common patterns to recognize
- How to search for concepts

---

## code-style.md

**Purpose:** TypeScript conventions, naming patterns, file organization

**Key Topics:**
- TypeScript strict mode rules
- Naming conventions (camelCase, PascalCase)
- Component structure
- Error handling patterns
- Testing requirements
- Import organization

**Non-Negotiable:**
- ❌ No `any` types (use `unknown` + type guards)
- ❌ No unused imports
- ✅ All functions must have return types
- ✅ Use functional components (no class components)

---

## security-privacy.md

**Purpose:** Security requirements, privacy enforcement, rate limits

**Key Topics:**
- Privacy model enforcement (SELF/FRIENDS/PUBLIC)
- Server-side validation (never trust client)
- Rate limiting rules
- JWT token handling
- Data encryption requirements
- GDPR compliance
- Consent management

**Critical Rules:**
- 🔒 **Never trust client privacy filters** - Server MUST re-validate
- 🔒 **All API endpoints require auth** - Except /health, /auth/*
- 🔒 **Rate limit EVERYTHING** - Prevent abuse
- 🔒 **PII must be sanitized** - Before logging
- 🔒 **Passwords never in logs** - Use logger.sanitize()

---

## How to Use These Rules

### For AI Agents
1. Read [ai-agent-guide.md](ai-agent-guide.md) first
2. Reference [code-style.md](code-style.md) when writing code
3. Reference [security-privacy.md](security-privacy.md) for all API/data operations

### For Developers
1. Read all three files before starting
2. Set up linter to enforce code-style rules
3. Review security checklist before each PR

---

## Rule Updates

When updating rules:
- Update this INDEX.md if adding new rule files
- Keep rules DRY (don't duplicate between files)
- Link to spec files when referencing features
