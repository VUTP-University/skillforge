# GitHub Projects Setup Guide

This guide provides instructions for setting up and managing GitHub Projects for the SkillForge repository.

## 🎯 Purpose

GitHub Projects provides:
- Visual task tracking with Kanban boards
- Progress monitoring for features and milestones
- Team collaboration and transparency
- Integration with issues and pull requests

## 📊 Creating a GitHub Project

### Step 1: Create New Project

1. **Navigate to Projects**
   - Go to repository → Projects tab
   - Click "New project"

2. **Choose Project Type**
   - Select "Board" view (Kanban-style)
   - Or select "Table" view for more detailed tracking
   - Click "Create"

3. **Name Your Project**
   - **Option 1:** "SkillForge Development" (for main project board)
   - **Option 2:** Create sprint-specific boards (e.g., "Sprint 1 - January 2026")
   - **Option 3:** Feature-specific boards (e.g., "User Authentication Feature")

### Step 2: Configure Board Columns

#### Recommended Column Structure

**For Main Development Board:**

1. **📋 Backlog**
   - Description: "Future tasks not yet prioritized"
   - Use for: Ideas, future features, non-urgent items

2. **📝 To Do**
   - Description: "Ready to be worked on"
   - Use for: Prioritized tasks, assigned issues

3. **🚧 In Progress**
   - Description: "Currently being worked on"
   - Use for: Active development tasks
   - Limit: 3-5 items per person (avoid overload)

4. **👀 Review**
   - Description: "Waiting for code review or feedback"
   - Use for: PRs awaiting review, completed tasks needing verification

5. **✅ Done**
   - Description: "Completed and merged"
   - Use for: Finished tasks, merged PRs
   - Auto-archive: After 7-14 days

#### Alternative: Sprint Board Structure

1. **Sprint Backlog** - Tasks for this sprint
2. **In Progress** - Current work
3. **Blocked** - Issues with dependencies
4. **Review** - Awaiting review
5. **Done** - Completed in sprint

### Step 3: Customize Columns

For each column:
1. Click the "⋮" menu on the column
2. Select "Edit column"
3. Set automation rules:

**To Do Column:**
- Auto-add: Newly created issues with label "ready"

**In Progress Column:**
- Auto-move: When PR is opened
- Auto-move: When issue is assigned

**Review Column:**
- Auto-move: When PR is marked as "ready for review"

**Done Column:**
- Auto-move: When PR is merged
- Auto-move: When issue is closed
- Auto-archive: After 7 days

## 🏷️ Labels for Project Management

### Creating Labels

Go to repository → Issues → Labels → New label

### Recommended Label Structure

#### Priority Labels
- 🔴 **priority: critical** - Must be fixed immediately
- 🟠 **priority: high** - Should be addressed soon
- 🟡 **priority: medium** - Normal priority
- 🟢 **priority: low** - Nice to have

#### Type Labels
- ✨ **feature** - New feature or enhancement
- 🐛 **bug** - Bug or error fix
- 📚 **documentation** - Documentation updates
- ♻️ **refactor** - Code refactoring
- 🧪 **test** - Test additions or updates
- 🎨 **design** - UI/UX related

#### Status Labels
- ⏳ **status: blocked** - Blocked by dependencies
- 👀 **status: needs review** - Ready for review
- 🚧 **status: in progress** - Currently being worked on
- ✅ **status: ready** - Ready to be worked on

#### Difficulty Labels (for students)
- 🌱 **good first issue** - Good for newcomers
- 📝 **help wanted** - Extra attention needed
- 🎓 **student friendly** - Suitable for students
- 🏆 **challenge** - Complex or challenging task

#### Area Labels
- 🔙 **area: backend** - Backend related
- 🎨 **area: frontend** - Frontend related
- 🗄️ **area: database** - Database related
- 📱 **area: mobile** - Mobile related
- 🔒 **area: security** - Security related

## 📈 Milestones

### Creating Milestones

1. Go to repository → Issues → Milestones
2. Click "New milestone"
3. Add details:
   - **Title**: e.g., "MVP Release", "Sprint 1", "v1.0.0"
   - **Due date**: Set target completion date
   - **Description**: Goals and success criteria

### Recommended Milestones

**Phase-based:**
- **Phase 1: Foundation** - Basic setup and architecture
- **Phase 2: Core Features** - Main functionality
- **Phase 3: Polish** - UI/UX improvements
- **Phase 4: Launch** - Production readiness

**Sprint-based:**
- **Sprint 1** - 2 weeks (Jan 15 - Jan 29, 2026)
- **Sprint 2** - 2 weeks (Jan 30 - Feb 12, 2026)
- Continue as needed

**Feature-based:**
- **User Authentication**
- **Course Management**
- **Progress Tracking**

## 🔄 Workflow Integration

### Linking Issues to Projects

**Automatic:**
- Issues are auto-added when created (if automation is set)
- Issues move automatically based on PR status

**Manual:**
1. Open an issue
2. Click "Projects" in the right sidebar
3. Select the project
4. Choose appropriate column

### Linking PRs to Projects

**Automatic:**
- PRs are auto-added when opened
- Auto-move to "Review" column

**Manual:**
1. Open a PR
2. Link to issue using keywords:
   - `Fixes #123`
   - `Closes #123`
   - `Resolves #123`
3. PR will appear in project automatically

## 👥 Team Collaboration

### Assigning Tasks

1. **For Instructors:**
   - Review "To Do" column
   - Assign issues to students
   - Set appropriate labels and milestones
   - Provide clear descriptions and acceptance criteria

2. **For Students:**
   - Pick unassigned tasks from "To Do"
   - Self-assign by commenting "I'll take this"
   - Move to "In Progress" when starting
   - Update progress in issue comments

### Daily Standup Using Projects

Teams can use the board for daily updates:
- What did I complete? (moved to Done)
- What am I working on? (In Progress column)
- What's blocking me? (Add "blocked" label)

## 📊 Tracking Progress

### Project Insights

GitHub Projects automatically provides:
- **Burndown charts** - Work completion over time
- **Velocity** - Average completion rate
- **Cycle time** - Time from start to completion

### Custom Views

Create custom views for:
1. **My Tasks** - Filter by assignee
2. **Bugs Only** - Filter by bug label
3. **High Priority** - Filter by priority labels
4. **This Sprint** - Filter by current milestone

## 🎓 Best Practices

### For Project Management
- Keep board updated daily
- Archive completed items regularly
- Use labels consistently
- Set realistic milestones
- Review board in team meetings

### For Students
- Update issue status promptly
- Add comments for progress updates
- Ask for help when blocked
- Link PRs to issues properly
- Move cards as work progresses

### For Instructors
- Review board weekly
- Adjust priorities as needed
- Ensure even task distribution
- Provide feedback on estimates
- Celebrate completed milestones

## 🛠️ Advanced Features

### Automation with GitHub Actions

Create workflows that:
- Auto-label issues based on content
- Auto-assign issues to specific team members
- Send notifications for stale issues
- Generate weekly progress reports

Example workflow snippet:
```yaml
name: Auto-label new issues
on:
  issues:
    types: [opened]
jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.addLabels({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: ['status: ready']
            })
```

### Project Templates

Create project templates for recurring needs:
- Sprint planning template
- Feature development template
- Bug triage template

## 📱 Mobile Access

Students can manage tasks on mobile:
- Download GitHub mobile app
- View and update project boards
- Comment on issues and PRs
- Receive notifications

## 🔗 Integration with Other Tools

Consider integrating:
- **Slack/Discord** - Notifications for board updates
- **Calendar** - Milestone due dates
- **Time tracking** - For learning time management

## 📚 Additional Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Projects Best Practices](https://github.blog/2022-07-27-planning-next-to-your-code-github-projects-is-now-generally-available/)
- [Agile Methodology Guide](https://www.atlassian.com/agile)

## 📋 Quick Start Checklist

- [ ] Create main project board
- [ ] Set up columns (Backlog, To Do, In Progress, Review, Done)
- [ ] Configure column automation
- [ ] Create necessary labels
- [ ] Set up first milestone
- [ ] Add existing issues to project
- [ ] Assign tasks to team members
- [ ] Document project workflow in team meeting

---

**Note:** Project boards help teach students real-world project management skills. Encourage active participation and regular updates!
