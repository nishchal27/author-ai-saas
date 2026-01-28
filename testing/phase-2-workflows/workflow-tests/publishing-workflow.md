# Test W-005: Publishing Workflow

## Test Information

- **Test ID**: W-005
- **Test Name**: Content Scheduling & Automated Publishing
- **Workflow**: Publishing Automation
- **Priority**: Critical

---

## Objective

Validate that the publishing workflow correctly:
1. Schedules content for future publishing
2. Automatically publishes at scheduled time
3. Handles publishing errors gracefully
4. Updates status correctly
5. Tracks publishing history
6. Supports immediate publishing

---

## Prerequisites

- User account created and logged in
- At least one approved content draft
- Platform integrations configured (LinkedIn, Twitter)
- Cron/Inngest configured (for automated publishing)

---

## Test Steps

### Step 1: Schedule Content
1. Go to Calendar page
2. Select approved content draft
3. Choose date and time (future time)
4. Select platform (LinkedIn or Twitter)
5. Confirm schedule

**Expected Result**: 
- Schedule created
- Content appears in calendar
- Status updated to "scheduled"
- Scheduled time stored correctly

---

### Step 2: Verify Schedule Display
1. View calendar
2. Verify scheduled content appears
3. Verify date/time displayed correctly
4. Verify platform indicated

**Expected Result**: Schedule displayed correctly in calendar

---

### Step 3: Wait for Scheduled Time
1. Wait for scheduled time to arrive
2. Verify automated publishing triggers (via cron/inngest)
3. Monitor for publishing execution

**Expected Result**: 
- Automated publishing triggers at scheduled time
- Publishing executes automatically
- No manual intervention needed

---

### Step 4: Verify Publishing Execution
1. Check publishing status after scheduled time
2. Verify:
   - [ ] Status updated to "published"
   - [ ] External ID stored
   - [ ] Published timestamp set
   - [ ] Post appears on platform
   - [ ] No errors occurred

**Expected Result**: Publishing executes successfully

---

### Step 5: Test Immediate Publishing
1. Select approved content
2. Click "Publish Now" (or similar)
3. Select platform
4. Confirm publishing
5. Wait for publishing to complete

**Expected Result**: 
- Immediate publishing works
- Content publishes without scheduling
- Status updated correctly

---

### Step 6: Test Publishing with Image
1. Select content with image
2. Schedule or publish immediately
3. Verify image is included in published post
4. Check platform for image display

**Expected Result**: Image included in published content

---

### Step 7: Test Error Handling
1. Test publishing with invalid token
2. Test publishing with network error
3. Test publishing with invalid content
4. Verify errors handled gracefully:
   - [ ] Error message displayed
   - [ ] Status updated to "failed"
   - [ ] Error details stored
   - [ ] Retry possible

**Expected Result**: Errors handled gracefully

---

### Step 8: Test Retry Failed Publishing
1. Create a failed publish (simulate error)
2. Click "Retry" (if available)
3. Verify retry works
4. Verify publishing succeeds on retry

**Expected Result**: Retry mechanism works

---

### Step 9: Verify Publishing History
1. Check publishing history/logs
2. Verify:
   - [ ] All publishing attempts logged
   - [ ] Success/failure tracked
   - [ ] Timestamps recorded
   - [ ] Error messages stored (if failed)

**Expected Result**: Publishing history maintained

---

### Step 10: Test Multiple Platforms
1. Schedule same content for LinkedIn
2. Schedule same content for Twitter (different time)
3. Verify both publish correctly
4. Verify platform-specific optimization applied

**Expected Result**: Multi-platform publishing works

---

## Evaluation Criteria

### Functional Requirements
- [ ] Scheduling works
- [ ] Automated publishing works
- [ ] Immediate publishing works
- [ ] Publishing with images works
- [ ] Error handling works
- [ ] Retry mechanism works
- [ ] Publishing history tracked
- [ ] Multi-platform publishing works

### Reliability
- [ ] Publishing executes at scheduled time
- [ ] Publishing is reliable
- [ ] Errors are handled gracefully
- [ ] Retry works correctly

### User Experience
- [ ] Scheduling is intuitive
- [ ] Calendar display is clear
- [ ] Publishing status is visible
- [ ] Error messages are helpful

---

## Result Template

```markdown
## Test W-005 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Step-by-Step Results

#### Step 1: Schedule Content
- Status: [PASS/FAIL]
- Scheduling Works: [Yes/No]
- Calendar Display: [Correct/Incorrect]

#### Step 2: Verify Schedule Display
- Status: [PASS/FAIL]
- Display Correct: [Yes/No]

#### Step 3: Wait for Scheduled Time
- Status: [PASS/FAIL]
- Automation Triggers: [Yes/No]
- Timing Accurate: [Yes/No]

#### Step 4: Verify Publishing Execution
- Status: [PASS/FAIL]
- Publishing Works: [Yes/No]
- Post Appears: [Yes/No]
- External ID Stored: [Yes/No]

#### Step 5: Immediate Publishing
- Status: [PASS/FAIL]
- Immediate Publishing Works: [Yes/No]
- Time: [Duration]

#### Step 6: Publishing with Image
- Status: [PASS/FAIL]
- Image Included: [Yes/No]
- Image Displayed: [Yes/No]

#### Step 7: Error Handling
- Status: [PASS/FAIL]
- Errors Handled: [Yes/No]
- Error Messages: [Clear/Unclear]

#### Step 8: Retry Failed Publishing
- Status: [PASS/FAIL]
- Retry Works: [Yes/No]

#### Step 9: Publishing History
- Status: [PASS/FAIL]
- History Tracked: [Yes/No]
- Logs Complete: [Yes/No]

#### Step 10: Multiple Platforms
- Status: [PASS/FAIL]
- Multi-Platform Works: [Yes/No]

### Quality Assessment
- Scheduling Reliability: [1-5]
- Publishing Reliability: [1-5]
- Error Handling: [1-5]
- Overall Publishing System: [1-5]

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

### Variation 1: Multiple Scheduled Posts
1. Schedule multiple posts for different times
2. Verify all publish correctly
3. Verify timing is accurate

### Variation 2: Time Zone Handling
1. Schedule content in different time zones
2. Verify time zone handling works correctly

### Variation 3: Bulk Publishing
1. Schedule multiple posts for same time
2. Verify all publish correctly
3. Verify no conflicts

---

## Notes

- Automated publishing requires cron/inngest setup
- Timing accuracy is critical
- Error handling is essential for production
- Publishing history helps with debugging
- Test with real platforms carefully (use test accounts if possible)
- Verify external IDs are stored for analytics sync
