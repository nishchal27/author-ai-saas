# Test I-002: Product Relevance

## Test Information

- **Test ID**: I-002
- **Test Name**: Image Product Relevance
- **Image Dimension**: Product Context Application
- **Priority**: High

---

## Objective

Assess if generated images are relevant to product context:
1. Images reflect product type
2. Images reflect product industry
3. Images reflect product audience
4. Images are appropriate for product
5. Images enhance product messaging

---

## Prerequisites

- User account created and logged in
- Multiple products created (different types, industries, audiences)
- Images generated for each product
- Product context available

---

## Test Steps

### Step 1: Generate Images for Different Products
1. Create content for Product A (SaaS, devtools, developers)
2. Generate image
3. Create content for Product B (Course, education, professionals)
4. Generate image
5. Create content for Product C (Coaching, lifestyle, consumers)
6. Generate image

**Expected Result**: Images generated for different products

---

### Step 2: Evaluate Product Type Relevance
For each image, assess:
- [ ] Image reflects product type (SaaS vs. Course vs. Coaching)
- [ ] Image is appropriate for product type
- [ ] Image enhances product type messaging

**Scoring (1-5)**:
- 5: Perfectly reflects product type
- 4: Mostly reflects product type
- 3: Somewhat reflects product type
- 2: Partially reflects product type
- 1: Doesn't reflect product type

---

### Step 3: Evaluate Industry Relevance
For each image, assess:
- [ ] Image reflects product industry
- [ ] Image is appropriate for industry
- [ ] Image uses industry-relevant visuals

**Scoring (1-5)**:
- 5: Perfectly reflects industry
- 4: Mostly reflects industry
- 3: Somewhat reflects industry
- 2: Partially reflects industry
- 1: Doesn't reflect industry

---

### Step 4: Evaluate Audience Relevance
For each image, assess:
- [ ] Image is appropriate for product audience
- [ ] Image appeals to target audience
- [ ] Image style matches audience expectations

**Scoring (1-5)**:
- 5: Perfectly matches audience
- 4: Mostly matches audience
- 3: Somewhat matches audience
- 2: Partially matches audience
- 1: Doesn't match audience

---

### Step 5: Compare Images Across Products
1. Compare images for different products
2. Assess differences:
   - [ ] Images differ appropriately
   - [ ] Images reflect product differences
   - [ ] Images are product-specific

**Expected Result**: Images clearly differ based on product

---

### Step 6: Test Without Product Context
1. Generate image without product context
2. Compare with product-aware image
3. Assess difference in relevance

**Expected Result**: Product-aware images are more relevant

---

## Evaluation Criteria

### Product Relevance Scoring (1-5)

For each image, assess:
- **Product Type Relevance**: [1-5]
- **Industry Relevance**: [1-5]
- **Audience Relevance**: [1-5]
- **Overall Product Relevance**: [1-5]

### Success Criteria
- Average product relevance score ≥ 4.0/5.0
- Images clearly reflect product context
- Images differ appropriately across products
- Product-aware images are better than generic

---

## Result Template

```markdown
## Test I-002 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Products Tested
- Product A: [Name] - [Type, Industry, Audience]
- Product B: [Name] - [Type, Industry, Audience]
- Product C: [Name] - [Type, Industry, Audience]

### Product Relevance Scores

#### Image 1: [Content Title] - [Product A]
- Product Type Relevance: [1-5]
- Industry Relevance: [1-5]
- Audience Relevance: [1-5]
- Overall Product Relevance: [1-5]
- **Average**: [Score/5.0]
- Notes: [Observations]

#### Image 2: [Content Title] - [Product B]
[... Same scoring ...]

#### Image 3: [Content Title] - [Product C]
[... Same scoring ...]

### Overall Statistics
- Average Product Type Relevance: [Score/5.0]
- Average Industry Relevance: [Score/5.0]
- Average Audience Relevance: [Score/5.0]
- **Overall Product Relevance**: [Score/5.0]

### Product Differentiation
- Images Differ Across Products: [Yes/No]
- Differences Appropriate: [Yes/No]
- Product Context Evident: [Yes/No]

### Product-Aware vs. Generic
- Product-Aware Image Relevance: [1-5]
- Generic Image Relevance: [1-5]
- Improvement: [Significant/Moderate/Minimal]

### Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Impact: [Description]

### Recommendations
1. [Recommendation for improvement]

### Final Verdict
[PASS / FAIL / NEEDS IMPROVEMENT]

**Product Relevance**: [Excellent/Good/Acceptable/Poor]
```

---

## Test Data

### Products for Testing

1. **SaaS for Developers**
   - Expected: Technical, code/data visuals
   - Industry: Devtools

2. **Online Course**
   - Expected: Educational, learning visuals
   - Industry: Education

3. **Coaching Service**
   - Expected: Personal, transformation visuals
   - Industry: Lifestyle

---

## Notes

- Product relevance is critical for brand consistency
- Compare images across products to verify adaptation
- Test with and without product context
- Document specific examples of relevant and irrelevant images
- Images should enhance product messaging
