# Setup Project Automation with PAT

## Why This is Safe

- **GitHub Secrets are encrypted** and stored securely
- **VSCode Copilot CANNOT access GitHub Secrets** (they're not in your codebase)
- Secrets are only available during workflow runs
- Never exposed in logs or to developers

---

## Step 1: Create Personal Access Token (Classic)

**Note:** Fine-grained tokens don't support user projects yet, so we use Classic tokens.

1. Go to: https://github.com/settings/tokens/new
2. Configure:
   - **Note**: `Social Accountability Project Automation`
   - **Expiration**: 90 days (or custom)
   - **Select scopes** - Check ONLY these 2:
     - ✅ **repo** - Full control of private repositories
     - ✅ **project** - Full control of projects
3. Scroll down and click **"Generate token"**
4. **COPY THE TOKEN** (you'll only see it once - starts with `ghp_`)

---

## Step 2: Add Token as GitHub Secret

### Option A: Using GitHub CLI (PowerShell)

```powershell
# Paste your token when prompted
gh secret set SOCIAL_ACCOUNTABILITY_TOKEN
```

### Option B: Using GitHub Web Interface

1. Go to: https://github.com/michaelpeluso/social-accountability/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `SOCIAL_ACCOUNTABILITY_TOKEN`
4. Value: Paste your copied token
5. Click **"Add secret"**

---

## Step 3: Verify Secret is Set

```powershell
# Should show SOCIAL_ACCOUNTABILITY_TOKEN in the list
gh secret list
```

---

## Step 4: Workflow Will Use It

The workflow is already configured to use `secrets.PROJECT_TOKEN` instead of `secrets.GITHUB_TOKEN`.

When you add the secret, the automation will:

- ✅ Automatically add new issues to Project #3
- ✅ Auto-label PRs based on changed files
- ✅ All done in secure GitHub environment

---

## Security Notes

✅ **Safe from Copilot**: GitHub Secrets are stored server-side, never in your repo
✅ **Safe from logs**: GitHub automatically masks secrets in workflow logs
✅ **Safe from commits**: No way to accidentally commit (it's not in any file)
✅ **Revocable**: You can delete/regenerate the token anytime at https://github.com/settings/tokens

❌ **NOT safe**: Storing PAT in .env file (Copilot COULD see that)
❌ **NOT safe**: Hardcoding PAT in code (never do this)

---

## Testing

After adding the secret, create a test issue:

```powershell
gh issue create --title "test: project automation with PAT" --body "Should auto-add to Project #3"
```

Check Project #3: https://github.com/users/michaelpeluso/projects/3

You should see the issue appear automatically! 🎉
