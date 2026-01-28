# Test F-002: Strategy Generation

## Test Information

- **Test ID**: F-002
- **Test Name**: Marketing Strategy Generation
- **Feature**: AI Strategy Decision Engine
- **Priority**: Critical

---

## Objective

Validate that the strategy generation system:
1. Generates product-specific strategies (not generic)
2. Includes all required components (platforms, tone, cadence, etc.)
3. Provides clear reasoning for recommendations
4. Includes anti-patterns and "what NOT to do" guidance
5. Adapts correctly to different product types and audiences

---

## Prerequisites

- User account created and logged in
- Multiple test products created (different types, audiences, stages)
- API keys configured (Anthropic/OpenAI)

---

## Test Steps

### Test Case 1: SaaS for Developers (Primary Use Case)

#### Step 1: Create Product
1. Create product with profile:
   - Type: saas
   - Industry: devtools
   - Audience: developers
   - Stage: launched
   - Sales Motion: self_serve

#### Step 2: Generate Strategy
1. Complete onboarding to trigger strategy generation
2. Wait for strategy to generate

#### Step 3: Validate Strategy Components
1. Check platform recommendations:
   - [ ] Primary platforms listed (should include GitHub, Twitter, LinkedIn)
   - [ ] Secondary platforms listed
   - [ ] "Avoid" platforms listed with reasoning
   - [ ] Reasoning provided for each recommendation

2. Check content type recommendations:
   - [ ] Recommended content types listed
   - [ ] Avoided content types listed (if any)
   - [ ] Reasoning provided

3. Check tone & voice:
   - [ ] Style description provided
   - [ ] Examples provided
   - [ ] "Avoid" list provided

4. Check visual style:
   - [ ] Style recommendations provided
   - [ ] Color guidance (if applicable)
   - [ ] Examples provided

5. Check posting cadence:
   - [ ] Frequency recommendation provided
   - [ ] Reasoning for frequency provided

6. Check proof types:
   - [ ] Recommended proof types listed
   - [ ] Examples provided

7. Check anti-patterns:
   - [ ] Anti-patterns listed (what NOT to do)
   - [ ] Reasoning for each anti-pattern provided

8. Check summary:
   - [ ] Summary starts with "Because you are building X..."
   - [ ] Summary is product-specific
   - [ ] Summary is clear and actionable

9. Check reasoning:
   - [ ] Detailed reasoning provided
   - [ ] Reasoning explains "why" not just "what"
   - [ ] Reasoning is product-specific

#### Step 4: Validate Strategy Quality
1. Read strategy summary
2. Assess: Does this feel like it was written for THIS specific product?
3. Compare with manual research: Does it align with best practices for SaaS for developers?

**Expected Result**: Strategy is highly product-specific, not generic

---

### Test Case 2: Online Course (Different Product Type)

#### Step 1: Create Product
1. Create product with profile:
   - Type: course
   - Industry: education
   - Audience: professionals
   - Stage: building
   - Sales Motion: creator_led

#### Step 2: Generate Strategy
1. Complete onboarding
2. Wait for strategy generation

#### Step 3: Compare with SaaS Strategy
1. Compare platform recommendations with SaaS strategy
2. Compare tone recommendations
3. Compare content type recommendations
4. Compare cadence recommendations

**Expected Result**: Strategy differs significantly from SaaS strategy, adapted for course product

---

### Test Case 3: Coaching Service (Different Audience)

#### Step 1: Create Product
1. Create product with profile:
   - Type: coaching
   - Industry: lifestyle
   - Audience: consumers
   - Stage: launched
   - Sales Motion: demo

#### Step 2: Generate Strategy
1. Complete onboarding
2. Wait for strategy generation

#### Step 3: Validate Audience Adaptation
1. Check if strategy adapts for consumer audience (vs. B2B)
2. Check platform recommendations (should differ from developer-focused)
3. Check tone (should be more accessible, less technical)

**Expected Result**: Strategy adapted for consumer audience

---

### Test Case 4: Strategy Regeneration

#### Step 1: Navigate to Strategy Page
1. Go to product strategy page
2. Verify current strategy is displayed

#### Step 2: Regenerate Strategy
1. Click "Regenerate Strategy" button
2. Confirm regeneration
3. Wait for new strategy

#### Step 3: Compare Strategies
1. Compare new strategy with previous
2. Check if recommendations changed
3. Check if quality is consistent

**Expected Result**: New strategy generated, quality maintained or improved

---

## Evaluation Criteria

### Functional Requirements
- [ ] Strategy generation completes without errors
- [ ] All required components present
- [ ] JSON fields are valid and parseable
- [ ] Strategy stored in database correctly

### Quality Requirements
- [ ] Strategy is product-specific (not generic template)
- [ ] Strategy includes "what to do" AND "what NOT to do"
- [ ] Reasoning is clear and explainable
- [ ] Strategy adapts to product type
- [ ] Strategy adapts to audience
- [ ] Strategy adapts to stage
- [ ] Anti-patterns are relevant and helpful
- [ ] Confidence score is reasonable (>0.7)

### Comparison Requirements
- [ ] Different product types generate different strategies
- [ ] Different audiences generate different strategies
- [ ] Strategies align with industry best practices

---

## Result Template

```markdown
## Test F-002 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: SaaS for Developers
- Status: [PASS/FAIL]
- Strategy Specificity: [1-5]
- Strategy Completeness: [1-5]
- Quality Assessment: [Notes]

### Test Case 2: Online Course
- Status: [PASS/FAIL]
- Strategy Adaptation: [1-5] (How different from SaaS?)
- Quality Assessment: [Notes]

### Test Case 3: Coaching Service
- Status: [PASS/FAIL]
- Audience Adaptation: [1-5]
- Quality Assessment: [Notes]

### Test Case 4: Strategy Regeneration
- Status: [PASS/FAIL]
- Consistency: [1-5]
- Quality Assessment: [Notes]

### Component Validation
- Platform Recommendations: [PASS/FAIL]
- Content Type Recommendations: [PASS/FAIL]
- Tone & Voice: [PASS/FAIL]
- Visual Style: [PASS/FAIL]
- Posting Cadence: [PASS/FAIL]
- Proof Types: [PASS/FAIL]
- Anti-Patterns: [PASS/FAIL]
- Summary: [PASS/FAIL]
- Reasoning: [PASS/FAIL]

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

### Product Profiles to Test

1. **SaaS for Developers** (Primary)
   - Type: saas, Industry: devtools, Audience: developers

2. **Online Course**
   - Type: course, Industry: education, Audience: professionals

3. **Coaching Service**
   - Type: coaching, Industry: lifestyle, Audience: consumers

4. **Physical Product**
   - Type: physical, Industry: ecommerce, Audience: consumers

5. **Event Management**
   - Type: event, Industry: services, Audience: professionals

6. **API Product**
   - Type: api, Industry: devtools, Audience: developers

7. **NGO/Non-profit**
   - Type: ngo, Industry: social, Audience: general

---

## Notes

- Strategy quality is subjective - use judgment: "Does this feel product-specific?"
- Compare strategies with manual research to validate accuracy
- Strategies should be opinionated, not generic "do everything" advice
- Anti-patterns are critical - they reduce decision fatigue
- Reasoning quality is important - should explain "why" not just "what"
