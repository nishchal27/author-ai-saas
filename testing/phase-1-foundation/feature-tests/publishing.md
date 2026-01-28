# Test F-007: Publishing

## Test Information

- **Test ID**: F-007
- **Test Name**: Content Publishing
- **Feature**: Publishing to LinkedIn and Twitter
- **Priority**: Critical

---

## Objective

Validate that publishing correctly:
1. Publishes content to LinkedIn
2. Publishes content to Twitter
3. Handles images correctly (uploads to LinkedIn)
4. Stores external post IDs
5. Updates schedule and draft status
6. Handles errors gracefully

---

## Prerequisites

- User account created and logged in
- At least one approved content draft
- LinkedIn integration configured (access token)
- Twitter integration configured (access token)
- Test accounts for LinkedIn and Twitter (or use real accounts carefully)

---

## Test Steps

### Test Case 1: LinkedIn Publishing (Text Only)

#### Step 1: Prepare Content
1. Create and approve a content draft (post type, LinkedIn platform)
2. Verify content is ready for publishing
3. Verify LinkedIn integration is active

**Expected Result**: Content draft ready, integration active

---

#### Step 2: Publish to LinkedIn
1. Go to content draft page
2. Click "Publish to LinkedIn" (or schedule for immediate)
3. Confirm publishing
4. Wait for publishing to complete

**Expected Result**: Publishing initiates, loading state displayed

---

#### Step 3: Verify Publishing
1. Wait for publishing to complete (typically 5-10 seconds)
2. Check for success message
3. Verify post appears on LinkedIn
4. Verify external ID is stored

**Expected Result**: 
- Publishing completes successfully
- Post appears on LinkedIn
- External ID stored in database
- Draft status updated to "published"

---

#### Step 4: Verify Database
1. Check database for Schedule record
2. Verify fields:
   - status = "published"
   - publishedAt is set
   - externalId is set (LinkedIn post ID)
   - platform = "linkedin"

**Expected Result**: Schedule record updated correctly

---

### Test Case 2: LinkedIn Publishing (With Image)

#### Step 1: Prepare Content with Image
1. Create content draft with image
2. Verify image URL is set
3. Approve content

**Expected Result**: Content draft has image

---

#### Step 2: Publish to LinkedIn
1. Publish content to LinkedIn
2. Wait for publishing to complete

**Expected Result**: Publishing completes

---

#### Step 3: Verify Image Upload
1. Check LinkedIn post
2. Verify image is included in post
3. Verify image is displayed correctly

**Expected Result**: Image uploaded and displayed on LinkedIn

---

### Test Case 3: Twitter Publishing (Text Only)

#### Step 1: Prepare Content
1. Create and approve Twitter thread or post
2. Verify Twitter integration is active

**Expected Result**: Content ready, integration active

---

#### Step 2: Publish to Twitter
1. Publish content to Twitter
2. Wait for publishing to complete

**Expected Result**: Publishing completes successfully

---

#### Step 3: Verify Publishing
1. Check Twitter post/thread
2. Verify content is posted correctly
3. Verify external ID is stored

**Expected Result**: Post/thread appears on Twitter, external ID stored

---

### Test Case 4: Twitter Publishing (With Image)

#### Step 1: Prepare Content with Image
1. Create Twitter content with image
2. Approve content

**Expected Result**: Content has image

---

#### Step 2: Publish to Twitter
1. Publish to Twitter
2. Verify image is included

**Expected Result**: Image included in Twitter post

---

### Test Case 5: Error Handling

#### Step 1: Test Invalid Token
1. Use invalid/expired access token
2. Attempt to publish
3. Verify error handling

**Expected Result**: 
- Error message displayed
- Schedule status updated to "failed"
- Error message stored

---

#### Step 2: Test Network Error
1. Simulate network error (if possible)
2. Attempt to publish
3. Verify error handling

**Expected Result**: Error handled gracefully, retry possible

---

#### Step 3: Test Invalid Content
1. Attempt to publish invalid content (too long, etc.)
2. Verify error handling

**Expected Result**: Validation errors displayed before publishing

---

### Test Case 6: Scheduled Publishing

#### Step 1: Schedule Content
1. Schedule content for future time
2. Verify schedule is created

**Expected Result**: Schedule created, status = "pending"

---

#### Step 2: Wait for Scheduled Time
1. Wait for scheduled time to arrive
2. Verify automated publishing triggers (via cron/inngest)

**Expected Result**: Content publishes automatically at scheduled time

---

## Evaluation Criteria

### Functional Requirements
- [ ] LinkedIn publishing works (text only)
- [ ] LinkedIn publishing works (with image)
- [ ] Twitter publishing works (text only)
- [ ] Twitter publishing works (with image)
- [ ] External IDs stored correctly
- [ ] Draft status updated correctly
- [ ] Schedule status updated correctly
- [ ] Images uploaded correctly (LinkedIn)
- [ ] Images included correctly (Twitter)

### Error Handling
- [ ] Invalid token errors handled
- [ ] Network errors handled
- [ ] Validation errors handled
- [ ] Error messages are clear
- [ ] Failed publishes can be retried

### Automation
- [ ] Scheduled publishing works
- [ ] Automated publishing triggers correctly
- [ ] Publishing happens at scheduled time

---

## Result Template

```markdown
## Test F-007 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: LinkedIn Text Only
- Status: [PASS/FAIL]
- Publishing Time: [Duration]
- Post Appears: [Yes/No]
- External ID Stored: [Yes/No]

### Test Case 2: LinkedIn with Image
- Status: [PASS/FAIL]
- Image Uploaded: [Yes/No]
- Image Displayed: [Yes/No]

### Test Case 3: Twitter Text Only
- Status: [PASS/FAIL]
- Publishing Time: [Duration]
- Post Appears: [Yes/No]
- External ID Stored: [Yes/No]

### Test Case 4: Twitter with Image
- Status: [PASS/FAIL]
- Image Included: [Yes/No]

### Test Case 5: Error Handling
- Invalid Token: [PASS/FAIL]
- Network Error: [PASS/FAIL]
- Invalid Content: [PASS/FAIL]

### Test Case 6: Scheduled Publishing
- Status: [PASS/FAIL]
- Automation Works: [Yes/No]
- Timing Accurate: [Yes/No]

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

### Content for Publishing

1. **LinkedIn Post**
   - Type: post
   - Platform: linkedin
   - Content: Professional, thoughtful post
   - Image: Optional

2. **Twitter Thread**
   - Type: thread
   - Platform: twitter
   - Content: Engaging thread
   - Image: Optional

3. **LinkedIn Carousel**
   - Type: carousel
   - Platform: linkedin
   - Content: Visual-first content
   - Image: Required

---

## Notes

- Use test accounts or be careful with real accounts
- Publishing may take 5-10 seconds
- Verify posts appear on platforms manually
- External IDs are important for analytics sync
- Error handling is critical for production use
- Scheduled publishing requires cron/inngest setup
