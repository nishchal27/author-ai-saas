# Test F-001: Product Onboarding

## Test Information

- **Test ID**: F-001
- **Test Name**: Product Onboarding Flow
- **Feature**: Product Registration & Strategy Generation
- **Priority**: Critical

---

## Objective

Validate that the product onboarding flow correctly:
1. Collects all required product information
2. Generates a marketing strategy based on product profile
3. Stores product and strategy in database
4. Sets product as active for user

---

## Prerequisites

- User account created and logged in
- Access to dashboard
- API keys configured (Anthropic/OpenAI for strategy generation)

---

## Test Steps

### Step 1: Initiate Onboarding
1. Navigate to dashboard (should show onboarding modal if no products)
2. Click "Add Your First Product" or "New Product"
3. Verify onboarding modal appears

**Expected Result**: Onboarding modal displays with Step 1

---

### Step 2: Product Name & Industry
1. Enter product name: "Lexnify" (or test product name)
2. Select industry: "devtools" (or appropriate industry)
3. Click "Next"

**Expected Result**: 
- Form validates input
- Proceeds to Step 2
- No errors displayed

---

### Step 3: Product Type Selection
1. Select product type: "saas" (or appropriate type)
2. Verify type-specific guidance appears
3. Click "Next"

**Expected Result**:
- Type selection works
- Guidance is relevant to selected type
- Proceeds to Step 3

---

### Step 4: Target Audience
1. Select audience: "developers" (or appropriate audience)
2. Verify audience-specific refinements appear
3. Click "Next"

**Expected Result**:
- Audience selection works
- Refinements are relevant
- Proceeds to Step 4

---

### Step 5: Stage & Sales Motion
1. Select stage: "launched" (or appropriate stage)
2. Select sales motion: "self_serve" (or appropriate motion)
3. Click "Next"

**Expected Result**:
- Stage and sales motion selected
- Proceeds to Step 5 (optional context)

---

### Step 6: Optional Context (Optional)
1. Enter product description (optional)
2. Enter website URL (optional)
3. Enter competitors (optional)
4. Click "Generate Strategy"

**Expected Result**:
- Optional fields work correctly
- Strategy generation initiates
- Loading state displayed

---

### Step 7: Strategy Generation
1. Wait for strategy generation to complete
2. Verify strategy is displayed

**Expected Result**:
- Strategy generation completes (typically 10-30 seconds)
- Strategy includes:
  - Platform recommendations (primary, secondary, avoid)
  - Content type recommendations
  - Tone & voice guidance
  - Visual style recommendations
  - Posting cadence
  - Proof types
  - Anti-patterns
- Strategy summary is clear and product-specific
- Reasoning is provided

---

### Step 8: Verify Database
1. Check database for new Product record
2. Check database for MarketingStrategy record
3. Verify User.activeProductId is set

**Expected Result**:
- Product record created with all fields
- MarketingStrategy record created and linked to product
- Strategy JSON fields are valid
- User.activeProductId points to new product

---

### Step 9: Verify Dashboard
1. Refresh dashboard
2. Verify product is displayed
3. Verify strategy summary is visible
4. Verify product switcher shows new product

**Expected Result**:
- Dashboard shows product context
- Strategy summary displayed
- Product appears in switcher
- No onboarding modal appears

---

## Evaluation Criteria

### Functional Requirements
- [ ] All steps complete without errors
- [ ] All required fields validated
- [ ] Strategy generation completes successfully
- [ ] Database records created correctly
- [ ] Product set as active

### Quality Requirements
- [ ] Strategy is product-specific (not generic)
- [ ] Strategy includes "what to do" and "what NOT to do"
- [ ] Strategy reasoning is clear and explainable
- [ ] Strategy confidence score is reasonable (>0.7)

### User Experience
- [ ] Flow feels conversational, not form-like
- [ ] Loading states are clear
- [ ] Error messages (if any) are helpful
- [ ] Success state is clear

---

## Result Template

```markdown
## Test F-001 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Execution Summary
- Steps completed: [X/9]
- Errors encountered: [List any errors]
- Time taken: [Duration]

### Detailed Results

#### Step 1: Initiate Onboarding
- Status: [PASS/FAIL]
- Notes: [Any observations]

#### Step 2: Product Name & Industry
- Status: [PASS/FAIL]
- Notes: [Any observations]

[... Continue for all steps ...]

### Strategy Quality Assessment
- Strategy specificity: [1-5]
- Strategy completeness: [1-5]
- Strategy reasoning quality: [1-5]
- Overall strategy quality: [1-5]

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

### Test Product 1: Lexnify (SaaS for Developers)
- **Name**: Lexnify
- **Type**: saas
- **Industry**: devtools
- **Audience**: developers
- **Stage**: launched
- **Sales Motion**: self_serve
- **Description**: "Event management SaaS for trainers and NGO event organizers"

### Test Product 2: Online Course
- **Name**: [Course Name]
- **Type**: course
- **Industry**: education
- **Audience**: professionals
- **Stage**: building
- **Sales Motion**: creator_led

### Test Product 3: Coaching Service
- **Name**: [Coaching Name]
- **Type**: coaching
- **Industry**: lifestyle
- **Audience**: consumers
- **Stage**: launched
- **Sales Motion**: demo

---

## Notes

- Strategy generation may take 10-30 seconds depending on API response time
- If strategy generation fails, check API keys and network connectivity
- Strategy quality should be assessed subjectively - does it feel product-specific?
- Compare generated strategy with manual research to validate accuracy
