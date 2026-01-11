# Repository Labels Guide

This guide documents the recommended labels for the SkillForge repository and provides instructions for creating and using them.

## 🎯 Purpose

Labels help:
- Categorize and prioritize issues
- Filter and search effectively
- Track different types of work
- Identify good first issues for students
- Monitor project health

## 🏷️ Label Categories

### Priority Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `priority: critical` | `#d73a4a` (red) | Must be fixed immediately | Production issues, security vulnerabilities, blockers |
| `priority: high` | `#ff9800` (orange) | Should be addressed soon | Important features, significant bugs |
| `priority: medium` | `#ffd700` (yellow) | Normal priority | Regular features, minor bugs |
| `priority: low` | `#90ee90` (light green) | Nice to have | Enhancements, polish, documentation |

### Type Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `feature` | `#a2eeef` (light blue) | New feature or enhancement | Adding new functionality |
| `bug` | `#d73a4a` (red) | Bug or error fix | Fixing broken functionality |
| `documentation` | `#0075ca` (blue) | Documentation updates | README, guides, comments |
| `refactor` | `#fbca04` (yellow) | Code refactoring | Code cleanup, optimization |
| `test` | `#bfd4f2` (light blue) | Test additions or updates | Adding or fixing tests |
| `design` | `#d876e3` (purple) | UI/UX related | Interface, styling, user experience |
| `security` | `#d73a4a` (red) | Security related | Vulnerabilities, auth, permissions |
| `performance` | `#ffeb3b` (yellow) | Performance improvement | Speed, optimization, efficiency |

### Status Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `status: blocked` | `#d73a4a` (red) | Blocked by dependencies | Waiting on other tasks, external factors |
| `status: needs review` | `#fbca04` (yellow) | Ready for review | PR ready, awaiting feedback |
| `status: in progress` | `#0052cc` (dark blue) | Currently being worked on | Active development |
| `status: ready` | `#0e8a16` (green) | Ready to be worked on | Approved, can be started |
| `status: on hold` | `#d4c5f9` (light purple) | Paused or postponed | Deprioritized, future consideration |

### Difficulty Labels (for Students)

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `good first issue` | `#7057ff` (purple) | Good for newcomers | Simple, well-defined, low complexity |
| `help wanted` | `#008672` (teal) | Extra attention needed | Need contributions, open to suggestions |
| `student friendly` | `#bfdadc` (light cyan) | Suitable for students | Educational value, learning opportunity |
| `challenge` | `#ff6b6b` (coral) | Complex or challenging task | Advanced, requires experience |

### Area Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `area: backend` | `#006b75` (dark cyan) | Backend related | Server, API, business logic |
| `area: frontend` | `#5319e7` (purple) | Frontend related | UI, client-side code |
| `area: database` | `#ff6f00` (dark orange) | Database related | Schema, queries, migrations |
| `area: mobile` | `#00bfa5` (teal) | Mobile related | Mobile apps, responsive design |
| `area: security` | `#b60205` (dark red) | Security related | Auth, encryption, vulnerabilities |
| `area: devops` | `#1d76db` (blue) | DevOps/Infrastructure | CI/CD, deployment, hosting |
| `area: testing` | `#0e8a16` (green) | Testing related | Test infrastructure, coverage |

### Special Labels

| Label | Color | Description | When to Use |
|-------|-------|-------------|-------------|
| `breaking change` | `#d73a4a` (red) | Breaking change | API changes, incompatible updates |
| `dependencies` | `#0366d6` (blue) | Dependency updates | Package upgrades, library updates |
| `duplicate` | `#cfd3d7` (gray) | Duplicate issue | Already reported or addressed |
| `invalid` | `#e4e669` (light yellow) | Invalid issue | Not a real issue, mistake |
| `wontfix` | `#ffffff` (white) | Will not be fixed | By design, out of scope |
| `question` | `#d876e3` (purple) | Question or discussion | Need clarification, advice |

## 📝 Creating Labels

### Automated Setup Script

Create all labels at once using GitHub CLI:

```bash
# Install GitHub CLI if not already installed
# See: https://cli.github.com/

# Authenticate
gh auth login

# Navigate to repository
cd /path/to/skillforge

# Create labels (run these commands one by one)
gh label create "priority: critical" --color "d73a4a" --description "Must be fixed immediately"
gh label create "priority: high" --color "ff9800" --description "Should be addressed soon"
gh label create "priority: medium" --color "ffd700" --description "Normal priority"
gh label create "priority: low" --color "90ee90" --description "Nice to have"

gh label create "feature" --color "a2eeef" --description "New feature or enhancement"
gh label create "bug" --color "d73a4a" --description "Bug or error fix"
gh label create "documentation" --color "0075ca" --description "Documentation updates"
gh label create "refactor" --color "fbca04" --description "Code refactoring"
gh label create "test" --color "bfd4f2" --description "Test additions or updates"
gh label create "design" --color "d876e3" --description "UI/UX related"
gh label create "security" --color "d73a4a" --description "Security related"
gh label create "performance" --color "ffeb3b" --description "Performance improvement"

gh label create "status: blocked" --color "d73a4a" --description "Blocked by dependencies"
gh label create "status: needs review" --color "fbca04" --description "Ready for review"
gh label create "status: in progress" --color "0052cc" --description "Currently being worked on"
gh label create "status: ready" --color "0e8a16" --description "Ready to be worked on"
gh label create "status: on hold" --color "d4c5f9" --description "Paused or postponed"

gh label create "good first issue" --color "7057ff" --description "Good for newcomers"
gh label create "help wanted" --color "008672" --description "Extra attention needed"
gh label create "student friendly" --color "bfdadc" --description "Suitable for students"
gh label create "challenge" --color "ff6b6b" --description "Complex or challenging task"

gh label create "area: backend" --color "006b75" --description "Backend related"
gh label create "area: frontend" --color "5319e7" --description "Frontend related"
gh label create "area: database" --color "ff6f00" --description "Database related"
gh label create "area: mobile" --color "00bfa5" --description "Mobile related"
gh label create "area: security" --color "b60205" --description "Security related"
gh label create "area: devops" --color "1d76db" --description "DevOps/Infrastructure"
gh label create "area: testing" --color "0e8a16" --description "Testing related"

gh label create "breaking change" --color "d73a4a" --description "Breaking change"
gh label create "dependencies" --color "0366d6" --description "Dependency updates"
gh label create "duplicate" --color "cfd3d7" --description "Duplicate issue"
gh label create "invalid" --color "e4e669" --description "Invalid issue"
gh label create "wontfix" --color "ffffff" --description "Will not be fixed"
gh label create "question" --color "d876e3" --description "Question or discussion"
```

### Manual Setup

1. Go to repository → Issues → Labels
2. Click "New label"
3. For each label:
   - Enter name
   - Enter color code (without #)
   - Add description
   - Click "Create label"

## 🎯 Using Labels Effectively

### When Creating an Issue

**Apply at least:**
- One **type** label (feature, bug, etc.)
- One **priority** label
- One **area** label (if applicable)

**Example:**
- Issue: "Add user login functionality"
- Labels: `feature`, `priority: high`, `area: backend`, `area: frontend`

### When Working on an Issue

**Update status:**
- Add `status: in progress` when starting
- Add `status: blocked` if blocked
- Add `status: needs review` when ready

### For Student Tasks

**Mark appropriately:**
- Add `good first issue` for simple tasks
- Add `student friendly` for learning opportunities
- Add `challenge` for advanced tasks
- Add `help wanted` when guidance is available

### Multiple Labels

Issues can have multiple labels:
- One type label (primary)
- One priority label
- Multiple area labels
- One status label
- Multiple special labels

**Example:**
```
feature, priority: high, area: backend, area: security, student friendly
```

## 📊 Label Analytics

### Tracking with Labels

**Monitor:**
- Number of bugs vs features
- High priority items
- Blocked items
- Good first issues availability

**Filter examples:**
- `is:issue is:open label:"good first issue"` - Available starter tasks
- `is:issue is:open label:"priority: critical"` - Critical issues
- `is:issue label:"area: backend" label:"bug"` - Backend bugs

## 🔄 Label Maintenance

### Regular Review

**Monthly:**
- Review unused labels
- Update descriptions if needed
- Archive outdated labels
- Add new labels as needed

### Evolution

Labels should evolve with the project:
- Add new area labels as project grows
- Adjust priority definitions
- Create sprint-specific labels if needed

## 🎓 Best Practices

### For Issue Creators
1. Add labels when creating issues
2. Be specific with type and area
3. Set appropriate priority
4. Add difficulty labels for student tasks

### For Team Members
1. Update status labels promptly
2. Don't over-label (3-5 labels is usually enough)
3. Use consistent labeling across similar issues
4. Remove obsolete labels

### For Maintainers
1. Regularly triage unlabeled issues
2. Ensure consistent label usage
3. Update label descriptions as needed
4. Clean up stale labels

## 📚 Additional Resources

- [GitHub Labels Documentation](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
- [Label Best Practices](https://github.com/conventional-changelog/commitlint)
- [Label Color Codes](https://htmlcolorcodes.com/)

---

**Note:** This label system is designed to teach students professional issue tracking practices. Consistent usage helps everyone understand project status at a glance.
