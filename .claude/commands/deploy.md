Deploy NotiWallet — run this after making changes. It detects what changed and deploys the right layer(s).

Optional commit message: $ARGUMENTS (e.g. `/deploy feat: add new category`)

---

## Step 1 — Check what changed

Run `git status` and `git diff --name-only HEAD` to list all modified files.
Categorize them into two buckets:

- **GAS bucket**: any file under `google-apps-script/`
- **Frontend bucket**: any file under `src/`, `public/`, `next.config.js`, `package.json`, `tailwind.config.js`, `postcss.config.js`

If nothing changed in either bucket, tell the user and stop.

---

## Step 2 — Frontend deployment (if frontend bucket is non-empty)

### 2a. Build check
Run `npm run build` from the project root.
- If it fails: show the errors, stop here, do NOT commit or push. The user must fix errors first.
- If it passes: continue.

### 2b. Commit
Stage only the changed frontend files (never use `git add -A` or `git add .` — stage by explicit path).

Use the commit message from $ARGUMENTS if provided.
If no message was given, draft one from the diff: `feat:`, `fix:`, or `chore:` prefix based on what changed.

Commit format:
```
git commit -m "$(cat <<'EOF'
<your message here>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 2c. Push to GitHub → triggers Vercel auto-deploy
```bash
git push
```
After pushing, tell the user: "Vercel will auto-deploy in ~1 min at your Vercel dashboard."

---

## Step 3 — GAS deployment (if GAS bucket is non-empty)

Run these from inside `google-apps-script/`:

```bash
cd google-apps-script
clasp push
clasp deploy --description "<same message as commit, or summarize the Code.js change>"
cd ..
```

If `clasp` is not installed or not logged in, tell the user:
```
npm install -g @google/clasp
clasp login
```
Then retry.

After a successful deploy, remind the user: the existing Web App URL stays the same — no need to update `.env.local` or the in-app GAS URL.

---

## Step 4 — Summary

Report what was deployed:
- ✓ Frontend pushed → Vercel deploying (link to Vercel dashboard if known)
- ✓ GAS pushed → new version live at existing Web App URL
- Or which steps were skipped and why
