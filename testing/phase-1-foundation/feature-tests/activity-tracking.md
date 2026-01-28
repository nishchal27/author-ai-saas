# Test F-003: Activity Tracking

## Test Information

- **Test ID**: F-003
- **Test Name**: Activity Tracking (Manual + GitHub)
- **Feature**: Activity Creation & GitHub Sync
- **Priority**: Critical

---

## Objective

Validate that activity tracking correctly:
1. Creates manual activities with all fields
2. Links activities to products
3. Syncs GitHub activities (commits, PRs)
4. Stores activity metadata correctly
5. Processes activities for insight extraction

---

## Prerequisites

- User account created and logged in
- At least one product created
- GitHub integration configured (if testing GitHub sync)
- GitHub repository with recent commits/PRs

---

## Test Steps

### Test Case 1: Manual Activity Creation

#### Step 1: Navigate to Activities
1. Go to Dashboard → Activities
2. Click "New Activity" button

**Expected Result**: Activity creation form appears

---

#### Step 2: Create Basic Activity
1. Enter activity title: "Fixed performance issue in event dashboard"
2. Select activity type: "manual"
3. Enter description: "Optimized database queries and added caching to reduce load times by 60%"
4. Select product: [Select active product]
5. Click "Create Activity"

**Expected Result**:
- Activity created successfully
- Success message displayed
- Activity appears in activities list
- Activity is linked to selected product

---

#### Step 3: Create Activity with Human Input
1. Click "New Activity"
2. Enter title: "Added new feature: bulk attendee import"
3. Select type: "manual"
4. Enter description: "Implemented CSV import functionality for event attendees"
5. Fill human input fields:
   - What changed: "Added CSV import feature with validation"
   - Who benefited: "Event organizers managing large events"
   - Why it matters: "Saves hours of manual data entry"
6. Select product
7. Click "Create Activity"

**Expected Result**:
- Activity created with human input
- Human input stored in metadata
- Activity ready for insight extraction

---

#### Step 4: Verify Database
1. Check database for Activity record
2. Verify fields:
   - title, description, type, source
   - productId is set correctly
   - metadata contains human input (if provided)
   - processed = false (initially)

**Expected Result**: Activity record created with all fields

---

### Test Case 2: GitHub Activity Sync

#### Step 1: Configure GitHub Integration
1. Go to Settings → Integrations
2. Connect GitHub (add access token)
3. Verify connection status

**Expected Result**: GitHub integration active

---

#### Step 2: Sync GitHub Activities
1. Go to Activities page
2. Click "Sync GitHub" button
3. Select repository (if multiple)
4. Wait for sync to complete

**Expected Result**:
- Sync completes without errors
- GitHub activities appear in activities list
- Activities are linked to active product (if set)
- Commit messages and PR titles are captured

---

#### Step 3: Verify GitHub Activity Data
1. Open a synced GitHub activity
2. Verify metadata:
   - Commit hash (for commits)
   - PR number (for PRs)
   - Repository name
   - Author information
   - Timestamp

**Expected Result**: GitHub metadata stored correctly

---

#### Step 4: Verify Product Linking
1. Check if GitHub activities are linked to active product
2. If no active product, verify activities can be linked manually

**Expected Result**: Activities linked to product correctly

---

### Test Case 3: Activity Processing

#### Step 1: Mark Activity as Processed
1. Extract insight from an activity (see F-004)
2. Verify activity.processed = true after insight extraction

**Expected Result**: Activity marked as processed after insight extraction

---

#### Step 2: Filter Processed/Unprocessed
1. Check if activities list can filter by processed status
2. Verify processed activities are marked

**Expected Result**: Filtering works correctly

---

## Evaluation Criteria

### Functional Requirements
- [ ] Manual activities can be created
- [ ] All activity fields save correctly
- [ ] Activities link to products
- [ ] GitHub sync works without errors
- [ ] GitHub activities are captured correctly
- [ ] Activity metadata stored correctly
- [ ] Activities can be marked as processed
- [ ] Activities can be filtered/searched

### Data Quality
- [ ] Activity titles are clear
- [ ] Descriptions are complete
- [ ] Human input is stored correctly
- [ ] GitHub metadata is accurate
- [ ] Product linking works correctly

### User Experience
- [ ] Activity creation form is intuitive
- [ ] GitHub sync is clear and fast
- [ ] Activity list displays correctly
- [ ] Error messages are helpful (if any)

---

## Result Template

```markdown
## Test F-003 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: Manual Activity Creation
- Status: [PASS/FAIL]
- Activities Created: [Number]
- Issues: [List any issues]

### Test Case 2: GitHub Activity Sync
- Status: [PASS/FAIL]
- Activities Synced: [Number]
- Sync Time: [Duration]
- Issues: [List any issues]

### Test Case 3: Activity Processing
- Status: [PASS/FAIL]
- Processing Works: [Yes/No]
- Issues: [List any issues]

### Field Validation
- Title: [PASS/FAIL]
- Description: [PASS/FAIL]
- Type: [PASS/FAIL]
- Product Linking: [PASS/FAIL]
- Human Input: [PASS/FAIL]
- Metadata: [PASS/FAIL]

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

### Manual Activities to Create

1. **Feature Addition**
   - Title: "Added bulk attendee import feature"
   - Description: "Implemented CSV import with validation and error handling"
   - Human Input: What changed, who benefited, why it matters

2. **Bug Fix**
   - Title: "Fixed performance issue in dashboard"
   - Description: "Optimized queries and added caching"
   - Human Input: Performance improvement details

3. **User Feedback**
   - Title: "Implemented user-requested feature"
   - Description: "Added dark mode based on user feedback"
   - Human Input: User impact

4. **Integration**
   - Title: "Integrated payment gateway"
   - Description: "Added Stripe integration for event payments"
   - Human Input: Business impact

---

## Notes

- GitHub sync may take time depending on repository size
- Verify that GitHub activities are properly formatted (commit messages, PR titles)
- Test with different activity types to ensure all work correctly
- Human input is optional but should enhance insight extraction quality
- Product linking is important for product-aware content generation
