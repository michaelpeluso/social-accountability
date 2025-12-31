# 🚀 Quick Start - Your New Workflow

## ✅ Setup Complete!

Your PowerShell profile is configured. Every new PowerShell terminal automatically loads these shortcuts:

| Command | What It Does                     | Example                            |
| ------- | -------------------------------- | ---------------------------------- |
| `feat`  | Create issue + branch + checkout | `feat "Add login" -Label M1`       |
| `work`  | Show all your open issues/PRs    | `work`                             |
| `ghi`   | Create issue only                | `ghi "Bug fix" -AssignMe`          |
| `done`  | Commit with hooks                | `done "feat: add form" -Closes 42` |
| `ghpr`  | Create PR                        | `ghpr -Fill -AssignMe`             |
| `ghst`  | Check CI status                  | `ghst`                             |
| `ghm`   | Merge PR                         | `ghm 43`                           |

---

## 🎯 Try It Now (M0 Foundation)

Open a **PowerShell terminal** in VSCode and try this:

### 1. Create your first M0 issue

```powershell
feat "Setup TypeScript type definitions" -Label M0
# → Creates issue + branch + switches to it
```

### 2. View your work

```powershell
work
# → Shows all your issues and PRs
```

### 3. Make changes

Edit `src/types/index.ts` and add types...

### 4. Commit (hooks run automatically)

```powershell
done "feat: add complete type definitions" -Closes 3
# → Adds files, commits with hooks
```

### 5. Push and create PR

```powershell
git push
ghpr -Fill -AssignMe
# → Creates PR with auto-filled title/body
```

### 6. Check CI

```powershell
ghst
# → Shows CI status
```

### 7. Merge when green

```powershell
ghm 4
# → Merges, deletes branch, closes issue
```

**That's it! Feature complete in 7 commands.** ⚡

---

## 📖 Full Documentation

- **Workflow Guide**: [.github/VSCODE-WORKFLOW.md](VSCODE-WORKFLOW.md)
- **Automation Details**: [.github/AUTOMATION.md](AUTOMATION.md)
- **Helper Functions**: [.github/workflow-helpers.ps1](workflow-helpers.ps1)

---

## 🔥 Pro Tips

1. **Always use PowerShell terminal** (not bash) for `gh` commands
2. **Link issues**: Always use `-Closes 42` in commits
3. **Check before merge**: Run `ghst` to ensure CI is green
4. **Use labels**: `-Label M0`, `-Label M1`, `-Label M2` etc.
5. **Review your work**: Type `work` anytime to see status

---

## 🎓 Learning Path

1. ✅ Setup complete
2. **Next**: Try creating 3 M0 issues for foundation work
3. **Then**: Complete one full feature cycle
4. **Finally**: Start building M1 features

---

## Need Help?

- Type `work` to see what you're working on
- Check [AUTOMATION.md](AUTOMATION.md) for all commands
- Check [VSCODE-WORKFLOW.md](VSCODE-WORKFLOW.md) for detailed workflow

**You're ready to build!** 🚀
