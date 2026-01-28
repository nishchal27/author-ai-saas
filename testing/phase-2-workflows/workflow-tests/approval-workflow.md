# Test W-004: Approval Workflow

## Test Information

- **Test ID**: W-004
- **Test Name**: Content Review & Approval
- **Workflow**: Human-in-the-Loop Workflow
- **Priority**: High

---

## Objective

Validate that the approval workflow correctly:
1. Allows content review
2. Enables content editing
3. Supports approval/rejection
4. Tracks edit history
5. Maintains version control
6. Blocks publishing until approved

---

## Prerequisites

- User account created and logged in
- At least one product created
- At least one content draft generated
- Content in "draft" status

---

## Test Steps

### Step 1: Review Content Draft
1. Go to Content page
2. Open a content draft
3. Review content:
   - [ ] Content is displayed correctly
   - [ ] Product context is visible
   - [ ] Strategy alignment is shown (if warnings exist)
   - [ ] Visual prompt is shown (if applicable)
   - [ ] Image is shown (if generated)

**Expected Result**: Content review interface works correctly

---

### Step 2: Edit Content
1. Click "Edit" button
2. Modify content:
   - Edit title (if applicable)
   - Edit main content
   - Edit CTA (if applicable)
3. Save edits

**Expected Result**: 
- Editing works
- Edits are saved
- Edit history tracked (if implemented)

---

### Step 3: Verify Edit History
1. Check if edit history is tracked
2. View previous versions (if available)
3. Verify version number increments

**Expected Result**: Edit history tracked, versions maintained

---

### Step 4: Approve Content
1. Review content (after edits if made)
2. Click "Approve" button
3. Verify status changes to "approved"
4. Verify content is now available for scheduling

**Expected Result**: 
- Approval works
- Status updated correctly
- Content available for scheduling

---

### Step 5: Verify Approval Blocks Publishing
1. Try to publish unapproved content (if possible)
2. Verify publishing is blocked or requires approval

**Expected Result**: Publishing requires approval

---

### Step 6: Reject Content
1. Create another content draft
2. Review content
3. Click "Reject" button
4. Add rejection reason (if available)
5. Verify status changes to "rejected"

**Expected Result**: 
- Rejection works
- Status updated correctly
- Rejection reason stored (if available)

---

### Step 7: Test Multiple Edits
1. Create content draft
2. Edit content (version 1)
3. Save
4. Edit again (version 2)
5. Save
6. Verify versions tracked

**Expected Result**: Multiple edits tracked, versions maintained

---

### Step 8: Test Strategy Alignment Warnings
1. Generate content for "avoid" platform (if strategy recommends avoiding)
2. Review content
3. Verify warning is displayed (if implemented)
4. Verify content can still be approved (with warning)

**Expected Result**: Strategy alignment warnings displayed

---

### Step 9: Verify Workflow States
1. Check content status transitions:
   - draft → approved
   - draft → rejected
   - approved → scheduled
   - scheduled → published
2. Verify invalid transitions are blocked

**Expected Result**: Status workflow works correctly

---

## Evaluation Criteria

### Functional Requirements
- [ ] Content review works
- [ ] Content editing works
- [ ] Edits are saved correctly
- [ ] Edit history tracked (if implemented)
- [ ] Approval works
- [ ] Rejection works
- [ ] Status workflow works
- [ ] Publishing requires approval

### User Experience
- [ ] Review interface is clear
- [ ] Editing is intuitive
- [ ] Approval/rejection is easy
- [ ] Status is visible
- [ ] Warnings are clear

### Data Integrity
- [ ] Edits are preserved
- [ ] Versions are maintained
- [ ] Status transitions are valid
- [ ] No data loss

---

## Result Template

```markdown
## Test W-004 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Step-by-Step Results

#### Step 1: Review Content
- Status: [PASS/FAIL]
- Review Interface: [Works/Doesn't Work]
- Content Display: [Correct/Incorrect]

#### Step 2: Edit Content
- Status: [PASS/FAIL]
- Editing Works: [Yes/No]
- Edits Saved: [Yes/No]

#### Step 3: Edit History
- Status: [PASS/FAIL]
- History Tracked: [Yes/No]
- Versions Maintained: [Yes/No]

#### Step 4: Approve Content
- Status: [PASS/FAIL]
- Approval Works: [Yes/No]
- Status Updated: [Yes/No]

#### Step 5: Approval Blocks Publishing
- Status: [PASS/FAIL]
- Blocking Works: [Yes/No]

#### Step 6: Reject Content
- Status: [PASS/FAIL]
- Rejection Works: [Yes/No]
- Reason Stored: [Yes/No]

#### Step 7: Multiple Edits
- Status: [PASS/FAIL]
- Multiple Edits Work: [Yes/No]
- Versions Tracked: [Yes/No]

#### Step 8: Strategy Warnings
- Status: [PASS/FAIL]
- Warnings Displayed: [Yes/No]
- Warnings Clear: [Yes/No]

#### Step 9: Workflow States
- Status: [PASS/FAIL]
- Transitions Work: [Yes/No]
- Invalid Transitions Blocked: [Yes/No]

### Quality Assessment
- Review Experience: [1-5]
- Editing Experience: [1-5]
- Approval Workflow: [1-5]
- Overall Approval System: [1-5]

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

## Test Variations

### Variation 1: Minimal Edits
1. Approve content with minimal/no edits
2. Verify approval works

### Variation 2: Extensive Edits
1. Make significant edits to content
2. Verify edits are preserved
3. Approve edited content

### Variation 3: Reject and Regenerate
1. Reject content
2. Generate new content from same insight
3. Approve new content

---

## Notes

- Approval workflow is critical for quality control
- Edit history helps track changes
- Strategy warnings help maintain alignment
- Status workflow should be clear and enforced
- Test edge cases: editing after approval, multiple approvals
