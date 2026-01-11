# Branch Protection Setup Guide

This guide provides instructions for repository administrators to configure branch protection rules for the SkillForge project.

## 🎯 Purpose

Branch protection rules help ensure:
- Code quality through required reviews
- Stability by preventing direct pushes
- Automated validation via CI checks
- Collaborative development practices

## 🔒 Master Branch Protection

### Configuration Steps

1. **Navigate to Settings**
   - Go to repository → Settings → Branches
   - Under "Branch protection rules", click "Add rule"

2. **Basic Settings**
   - Branch name pattern: `master`
   - ✅ Check "Require a pull request before merging"

3. **Pull Request Requirements**
   - ✅ Check "Require approvals"
     - Required number of approvals: **2** (recommended for production)
     - Or **1** (acceptable for learning environment)
   - ✅ Check "Dismiss stale pull request approvals when new commits are pushed"
   - ✅ Check "Require review from Code Owners" (optional but recommended)

4. **Status Checks**
   - ✅ Check "Require status checks to pass before merging"
   - ✅ Check "Require branches to be up to date before merging"
   - Select required status checks:
     - `lint-python` (Python Linting workflow)
     - `format-python` (Python Formatting workflow)
     - `lint-javascript` (JavaScript Linting workflow)
     - `check-console-logs` (Console.log checker)
     - `check-prints` (Print statement checker)

5. **Additional Restrictions**
   - ✅ Check "Require conversation resolution before merging"
   - ✅ Check "Require signed commits" (optional, for enhanced security)
   - ✅ Check "Require linear history" (optional, keeps history clean)
   - ✅ Check "Include administrators" (applies rules to admins too)
   - ✅ Check "Restrict who can push to matching branches" (optional)
     - Add specific users/teams if needed

6. **Force Push Settings**
   - ✅ Check "Do not allow bypassing the above settings"
   - ✅ Check "Do not allow force pushes"
   - ✅ Check "Do not allow deletions"

### Recommended Configuration Summary

```yaml
Branch: master
├── Require pull request before merging: ✅
│   ├── Required approvals: 1-2
│   ├── Dismiss stale reviews: ✅
│   └── Require Code Owner review: ✅
├── Require status checks: ✅
│   ├── Require branches to be up to date: ✅
│   └── Required checks:
│       ├── lint-python
│       ├── format-python
│       ├── lint-javascript
│       ├── check-console-logs
│       └── check-prints
├── Require conversation resolution: ✅
├── Include administrators: ✅
├── Do not allow force pushes: ✅
└── Do not allow deletions: ✅
```

## 🌿 Optional: Develop Branch Protection

For projects using a `develop` branch:

1. **Add another branch protection rule**
   - Branch name pattern: `develop`

2. **Configure similar settings** but with relaxed requirements:
   - Required approvals: 1
   - Required status checks: same as master
   - Allow force pushes for maintainers: ❌ (not recommended)

## 🔀 Feature Branch Policies

For `feature/*` branches (optional):

1. **Add branch protection rule**
   - Branch name pattern: `feature/*`

2. **Minimal protection:**
   - ✅ Require status checks to pass
   - No approval requirements (to allow rapid iteration)
   - Allow force pushes (for rebasing during development)

## 👥 Code Owners Integration

The repository includes a `CODEOWNERS` file that automatically assigns reviewers:
- All files: `@karastoyanov`, `@rayapetkova`

When "Require review from Code Owners" is enabled, at least one code owner must approve each PR.

## 🧪 Testing Protection Rules

After configuration:

1. **Try to push directly to master:**
   ```bash
   git checkout master
   git commit -m "test" --allow-empty
   git push origin master
   ```
   Expected: ❌ Push should be rejected

2. **Create a PR without passing checks:**
   - Should not be mergeable until all checks pass

3. **Try to merge without required reviews:**
   - Should not be mergeable until approvals are obtained

## 📚 Best Practices

### For Students
- Always work on feature branches
- Never force push to protected branches
- Address review comments promptly
- Keep PRs small and focused

### For Instructors/Admins
- Review PRs within 24-48 hours
- Provide constructive feedback
- Use "Request changes" for required fixes
- Approve when code meets standards
- Merge PRs promptly after approval

## 🚨 Emergency Procedures

In case of urgent fixes needed in production:

1. **Hotfix Branch Approach:**
   ```bash
   git checkout master
   git checkout -b hotfix/critical-issue
   # Make fix
   git push origin hotfix/critical-issue
   # Create emergency PR
   ```

2. **Expedited Review:**
   - Tag instructors immediately
   - Explain urgency in PR description
   - Request fast-track approval

3. **Post-Emergency:**
   - Document what happened
   - Review why it occurred
   - Update processes to prevent recurrence

## 🔄 Updating Protection Rules

Branch protection rules should be reviewed and updated:
- When adding new CI workflows
- When team structure changes
- When project phase changes (development vs production)
- Based on team feedback and lessons learned

## 📖 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Code Owners Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Git Branch Strategy Best Practices](https://www.atlassian.com/git/tutorials/comparing-workflows)

---

**Note:** These settings require repository admin access. Contact @karastoyanov or @rayapetkova if you need help configuring branch protection.
