# Test W-003: GitHub Integration Flow

## Test Information

- **Test ID**: W-003
- **Test Name**: GitHub Sync & Activity Processing
- **Workflow**: External Integration Flow
- **Priority**: High

---

## Objective

Validate that GitHub integration works end-to-end:
1. GitHub connection/sync works
2. GitHub activities are captured correctly
3. Activities are processed for insights
4. Content is generated from GitHub activities
5. Product context is maintained

---

## Prerequisites

- User account created and logged in
- GitHub account with repository
- GitHub integration configured (access token)
- At least one product created
- Repository with recent commits/PRs

---

## Test Steps

### Step 1: Configure GitHub Integration
1. Go to Settings → Integrations
2. Connect GitHub (add access token)
3. Verify connection status shows "Connected"
4. Select repository (if multiple)

**Expected Result**: GitHub integration active and connected

---

### Step 2: Sync GitHub Activities
1. Go to Activities page
2. Click "Sync GitHub" button
3. Select repository (if needed)
4. Wait for sync to complete

**Expected Result**: 
- Sync completes without errors
- GitHub activities appear in activities list
- Activities show GitHub source
- Commit messages and PR titles captured

---

### Step 3: Verify Activity Data
1. Open a synced GitHub activity
2. Verify activity details:
   - [ ] Title matches commit message or PR title
   - [ ] Description contains commit details
   - [ ] Type is "github_commit" or "github_pr"
   - [ ] Source is "github"
   - [ ] Metadata contains:
     - Commit hash (for commits)
     - PR number (for PRs)
     - Repository name
     - Author
     - Timestamp

**Expected Result**: GitHub activity data captured correctly

---

### Step 4: Link Activities to Product
1. Verify activities are linked to active product (if set)
2. If not linked, manually link to product
3. Verify product linking works

**Expected Result**: Activities linked to product correctly

---

### Step 5: Extract Insights from GitHub Activities
1. Select a GitHub activity
2. Click "Extract Insight"
3. Wait for insight extraction
4. Verify insight is generated

**Expected Result**: 
- Insight extraction works for GitHub activities
- Insight is relevant to commit/PR
- Insight is product-aware (if product linked)

---

### Step 6: Generate Content from GitHub Insights
1. Go to Insights page
2. Find insight from GitHub activity
3. Generate content (post, thread, etc.)
4. Verify content is generated

**Expected Result**: 
- Content generation works
- Content references GitHub activity appropriately
- Content is product-aware
- Content follows product strategy

---

### Step 7: Verify Complete Flow
1. Sync GitHub → Extract Insight → Generate Content → Approve → Publish
2. Verify complete flow works
3. Verify product context maintained throughout

**Expected Result**: Complete GitHub-to-publish flow works

---

### Step 8: Test Automatic Sync (If Available)
1. Configure automatic sync (if feature exists)
2. Make a commit to repository
3. Wait for automatic sync
4. Verify new activity appears

**Expected Result**: Automatic sync works (if implemented)

---

### Step 9: Test Error Handling
1. Test with invalid token
2. Test with inaccessible repository
3. Test with network error
4. Verify errors handled gracefully

**Expected Result**: Errors handled gracefully, clear messages

---

## Evaluation Criteria

### Functional Requirements
- [ ] GitHub connection works
- [ ] GitHub sync works
- [ ] Activities captured correctly
- [ ] Activity metadata stored correctly
- [ ] Product linking works
- [ ] Insight extraction works
- [ ] Content generation works
- [ ] Complete flow works

### Data Quality
- [ ] Commit messages captured accurately
- [ ] PR titles captured accurately
- [ ] Metadata is complete
- [ ] Activities are properly formatted

### Integration Quality
- [ ] Sync is reliable
- [ ] Error handling is graceful
- [ ] Performance is acceptable
- [ ] User experience is smooth

---

## Result Template

```markdown
## Test W-003 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### GitHub Setup
- Repository: [Name]
- Commits Available: [Number]
- PRs Available: [Number]

### Step-by-Step Results

#### Step 1: Configure Integration
- Status: [PASS/FAIL]
- Connection Works: [Yes/No]
- Token Valid: [Yes/No]

#### Step 2: Sync Activities
- Status: [PASS/FAIL]
- Activities Synced: [Number]
- Sync Time: [Duration]
- Errors: [List any]

#### Step 3: Verify Activity Data
- Status: [PASS/FAIL]
- Data Accuracy: [1-5]
- Metadata Complete: [Yes/No]

#### Step 4: Link to Product
- Status: [PASS/FAIL]
- Linking Works: [Yes/No]

#### Step 5: Extract Insights
- Status: [PASS/FAIL]
- Insights Extracted: [Number]
- Quality: [1-5]
- Product Awareness: [1-5]

#### Step 6: Generate Content
- Status: [PASS/FAIL]
- Content Generated: [Number]
- Quality: [1-5]
- GitHub Reference: [Appropriate/Inappropriate]

#### Step 7: Complete Flow
- Status: [PASS/FAIL]
- Flow Works: [Yes/No]
- Time: [Duration]

#### Step 8: Automatic Sync
- Status: [PASS/FAIL]
- Auto-Sync Works: [Yes/No] (if implemented)

#### Step 9: Error Handling
- Status: [PASS/FAIL]
- Errors Handled: [Yes/No]
- Error Messages: [Clear/Unclear]

### Quality Assessment
- Integration Reliability: [1-5]
- Data Accuracy: [1-5]
- User Experience: [1-5]
- Overall GitHub Integration: [1-5]

### Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Impact: [Description]

### Recommendations
1. [Recommendation]

### Final Verdict
[PASS / FAIL / NEEDS IMPROVEMENT]
```

---

## Test Data

### GitHub Activities to Test

1. **Feature Commit**
   - Commit message: "Add bulk import feature for attendees"
   - Expected: Activity captured, insight extracted, content generated

2. **Bug Fix Commit**
   - Commit message: "Fix performance issue in dashboard queries"
   - Expected: Activity captured, insight about performance improvement

3. **Pull Request**
   - PR title: "Implement dark mode based on user feedback"
   - Expected: PR captured, insight about user feedback

4. **Refactoring Commit**
   - Commit message: "Refactor API endpoints for better maintainability"
   - Expected: Activity captured, technical insight

---

## Notes

- GitHub sync may take time depending on repository size
- Verify commit messages are properly formatted
- Test with different commit message styles
- Verify PR titles and descriptions are captured
- Product context should enhance insight quality
- Compare GitHub-generated content with manual content to assess quality
