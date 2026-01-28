# Test F-004: Insight Extraction

## Test Information

- **Test ID**: F-004
- **Test Name**: AI Insight Extraction
- **Feature**: Claude-Powered Insight Extraction
- **Priority**: Critical

---

## Objective

Validate that insight extraction correctly:
1. Extracts insights from activities with product context
2. Generates problem → solution framing
3. Identifies target audience
4. Explains why it matters
5. Assesses impact
6. Adapts to product type and audience

---

## Prerequisites

- User account created and logged in
- At least one product created with strategy
- At least one activity created (manual or GitHub)
- API keys configured (Anthropic)

---

## Test Steps

### Test Case 1: Insight Extraction with Product Context

#### Step 1: Select Activity
1. Go to Activities page
2. Select an activity (preferably one with description and human input)
3. Click "Extract Insight"

**Expected Result**: Insight extraction initiates, loading state displayed

---

#### Step 2: Wait for Extraction
1. Wait for insight extraction to complete (typically 5-15 seconds)
2. Verify no errors occur

**Expected Result**: Insight extraction completes successfully

---

#### Step 3: Validate Insight Components
1. Check core problem:
   - [ ] Problem is clearly stated
   - [ ] Problem is relevant to activity
   - [ ] Problem is framed for product's audience

2. Check solution:
   - [ ] Solution is clearly stated
   - [ ] Solution addresses the problem
   - [ ] Solution is relevant to activity

3. Check audience:
   - [ ] Target audience identified
   - [ ] Audience matches product's audience
   - [ ] Audience is specific (not generic)

4. Check "why it matters":
   - [ ] Value proposition is clear
   - [ ] Impact is explained
   - [ ] Relevance to audience is clear

5. Check impact (if present):
   - [ ] Impact is measurable or specific
   - [ ] Impact is relevant

6. Check themes (if present):
   - [ ] Themes are relevant
   - [ ] Themes align with product/industry

---

#### Step 4: Validate Product Context Application
1. Read the insight
2. Assess: Does this insight feel tailored to the product?
3. Check language: Is it appropriate for product's audience?
4. Check framing: Is it relevant to product's industry?

**Expected Result**: Insight is product-aware, not generic

---

#### Step 5: Verify Database
1. Check database for Insight record
2. Verify fields:
   - coreProblem, solution, audience, whyMatters
   - impact, themes (if present)
   - productId is set correctly
   - activityId is linked
   - status = "draft"

**Expected Result**: Insight record created with all fields

---

### Test Case 2: Insight Extraction without Product Context

#### Step 1: Create Activity without Product
1. Create activity without selecting product (or with no active product)
2. Extract insight

**Expected Result**: Insight extraction still works, but may be less product-specific

---

#### Step 2: Compare Insights
1. Extract insight for same activity with product context
2. Compare with insight extracted without product context
3. Assess differences

**Expected Result**: Insight with product context is more tailored and relevant

---

### Test Case 3: Insight Quality Assessment

#### Step 1: Extract Multiple Insights
1. Extract insights from different activity types:
   - Feature addition
   - Bug fix
   - User feedback
   - Integration

#### Step 2: Assess Quality
For each insight, assess:
- Relevance to activity: [1-5]
- Clarity: [1-5]
- Product awareness: [1-5]
- Audience appropriateness: [1-5]
- Value proposition clarity: [1-5]

**Expected Result**: Average quality score ≥ 4.0/5.0

---

### Test Case 4: Insight with Human Input

#### Step 1: Create Activity with Rich Human Input
1. Create activity with detailed human input:
   - What changed: Detailed description
   - Who benefited: Specific audience
   - Why it matters: Clear value proposition

#### Step 2: Extract Insight
1. Extract insight from activity with human input
2. Compare with insight from similar activity without human input

**Expected Result**: Insight with human input is richer and more accurate

---

## Evaluation Criteria

### Functional Requirements
- [ ] Insight extraction completes without errors
- [ ] All required components present (problem, solution, audience, whyMatters)
- [ ] Insight stored in database correctly
- [ ] Activity linked correctly
- [ ] Product context applied (when available)

### Quality Requirements
- [ ] Insight is relevant to activity (not generic)
- [ ] Problem → solution framing is clear
- [ ] Audience is specific and appropriate
- [ ] "Why it matters" is compelling
- [ ] Product context is evident (when product provided)
- [ ] Language is appropriate for product's audience
- [ ] Insight is actionable and valuable

### Product Awareness
- [ ] Insight adapts to product type
- [ ] Insight adapts to product audience
- [ ] Insight adapts to product industry
- [ ] Insight uses appropriate language/tone

---

## Result Template

```markdown
## Test F-004 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: Insight with Product Context
- Status: [PASS/FAIL]
- Insights Extracted: [Number]
- Average Quality: [Score/5.0]
- Product Awareness: [1-5]

### Test Case 2: Insight without Product Context
- Status: [PASS/FAIL]
- Quality Comparison: [Notes]
- Difference Assessment: [Notes]

### Test Case 3: Quality Assessment
- Feature Addition Insight: [1-5]
- Bug Fix Insight: [1-5]
- User Feedback Insight: [1-5]
- Integration Insight: [1-5]
- Average Quality: [Score/5.0]

### Test Case 4: Human Input Impact
- Status: [PASS/FAIL]
- Quality Improvement: [1-5] (How much better with human input?)

### Component Validation
- Core Problem: [PASS/FAIL]
- Solution: [PASS/FAIL]
- Audience: [PASS/FAIL]
- Why It Matters: [PASS/FAIL]
- Impact: [PASS/FAIL]
- Themes: [PASS/FAIL]

### Quality Scores (Sample Insights)
1. [Activity Title]
   - Relevance: [1-5]
   - Clarity: [1-5]
   - Product Awareness: [1-5]
   - Audience Appropriateness: [1-5]
   - Value Proposition: [1-5]

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

### Activities for Insight Extraction

1. **Performance Improvement**
   - Title: "Optimized database queries"
   - Description: "Reduced query time from 2s to 200ms"
   - Human Input: What changed, who benefited, why it matters
   - Expected: Insight about performance, user experience, scalability

2. **Feature Addition**
   - Title: "Added bulk import feature"
   - Description: "CSV import for event attendees"
   - Human Input: Time savings, user impact
   - Expected: Insight about efficiency, user value

3. **User Feedback Implementation**
   - Title: "Added dark mode"
   - Description: "Implemented based on user requests"
   - Human Input: User satisfaction, engagement
   - Expected: Insight about listening to users, product improvement

4. **Integration**
   - Title: "Integrated payment gateway"
   - Description: "Stripe integration for events"
   - Human Input: Business impact, user convenience
   - Expected: Insight about business growth, user experience

---

## Notes

- Insight quality is subjective - use judgment: "Is this useful and relevant?"
- Product context should make insights more specific and relevant
- Human input should enhance insight quality significantly
- Compare insights with manual analysis to validate accuracy
- Insights should be publication-ready (clear, valuable, actionable)
