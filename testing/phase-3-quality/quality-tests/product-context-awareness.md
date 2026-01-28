# Test Q-003: Product Context Awareness

## Test Information

- **Test ID**: Q-003
- **Test Name**: Product Context Awareness
- **Quality Dimension**: Product-Specific Adaptation
- **Priority**: Critical

---

## Objective

Assess if AI understands and applies product context appropriately:
1. Content adapts to product type
2. Content adapts to product audience
3. Content adapts to product industry
4. Content adapts to product stage
5. Language is appropriate for product
6. Examples are relevant to product

---

## Prerequisites

- User account created and logged in
- Multiple products created (different types, audiences, industries, stages)
- Content generated for each product
- Same activity used across different products (for comparison)

---

## Test Steps

### Step 1: Create Test Products
1. Create products with different profiles:
   - Product A: SaaS, devtools, developers, launched
   - Product B: Course, education, professionals, building
   - Product C: Coaching, lifestyle, consumers, launched
   - Product D: Physical product, ecommerce, consumers, launched

**Expected Result**: Multiple products with different profiles

---

### Step 2: Use Same Activity Across Products
1. Create a generic activity (e.g., "Improved user experience")
2. Link to Product A
3. Extract insight
4. Generate content
5. Repeat for Products B, C, D

**Expected Result**: Same activity used across different products

---

### Step 3: Compare Insights
1. Compare insights extracted for each product
2. Assess:
   - [ ] Insights are adapted to product type
   - [ ] Insights are adapted to product audience
   - [ ] Insights are adapted to product industry
   - [ ] Language is appropriate for product

**Expected Result**: Insights adapt to product context

---

### Step 4: Compare Content
1. Compare content generated for each product
2. Assess:
   - [ ] Content adapts to product type
   - [ ] Content adapts to product audience
   - [ ] Content adapts to product industry
   - [ ] Language is appropriate
   - [ ] Examples are relevant
   - [ ] Tone matches product

**Expected Result**: Content adapts significantly to product context

---

### Step 5: Evaluate Product Type Adaptation
1. Compare content for SaaS vs. Course vs. Coaching
2. Assess differences:
   - Language (technical vs. educational vs. personal)
   - Examples (code vs. lessons vs. personal stories)
   - Tone (professional vs. helpful vs. empathetic)

**Expected Result**: Content clearly adapts to product type

---

### Step 6: Evaluate Audience Adaptation
1. Compare content for developers vs. professionals vs. consumers
2. Assess differences:
   - Technical depth
   - Language complexity
   - Examples used

**Expected Result**: Content adapts to audience level

---

### Step 7: Evaluate Industry Adaptation
1. Compare content for devtools vs. education vs. lifestyle
2. Assess differences:
   - Industry-specific language
   - Industry-relevant examples
   - Industry-appropriate tone

**Expected Result**: Content adapts to industry context

---

### Step 8: Evaluate Stage Adaptation
1. Compare content for "building" vs. "launched" vs. "growing"
2. Assess differences:
   - Confidence level
   - Proof types used
   - Language (building vs. launched)

**Expected Result**: Content adapts to product stage

---

### Step 9: Test Without Product Context
1. Generate content without product (or generic product)
2. Compare with product-aware content
3. Assess difference in quality and relevance

**Expected Result**: Product-aware content is significantly better

---

## Evaluation Criteria

### Product Awareness Scoring (1-5)

For each content piece, assess:
- **Product Type Adaptation**: [1-5]
  - 5: Clearly adapted to product type
  - 1: Generic, not adapted

- **Audience Adaptation**: [1-5]
  - 5: Perfectly matches audience
  - 1: Doesn't match audience

- **Industry Adaptation**: [1-5]
  - 5: Industry-specific
  - 1: Generic

- **Language Appropriateness**: [1-5]
  - 5: Perfect for product
  - 1: Inappropriate

- **Example Relevance**: [1-5]
  - 5: Highly relevant examples
  - 1: Irrelevant examples

### Success Criteria
- Average product awareness score ≥ 4.0/5.0
- Content clearly differs across products
- Product-aware content is better than generic
- Adaptation is evident in all dimensions

---

## Result Template

```markdown
## Test Q-003 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Products Tested
- Product A: [Name] - [Type, Audience, Industry, Stage]
- Product B: [Name] - [Type, Audience, Industry, Stage]
- Product C: [Name] - [Type, Audience, Industry, Stage]
- Product D: [Name] - [Type, Audience, Industry, Stage]

### Same Activity Comparison

#### Activity: [Title]
- Product A Content:
  - Product Type Adaptation: [1-5]
  - Audience Adaptation: [1-5]
  - Industry Adaptation: [1-5]
  - Language Appropriateness: [1-5]
  - Example Relevance: [1-5]
  - **Average**: [Score/5.0]
  - Notes: [Observations]

- Product B Content:
  [... Same scoring ...]

- Product C Content:
  [... Same scoring ...]

- Product D Content:
  [... Same scoring ...]

### Adaptation Analysis

#### Product Type Adaptation
- SaaS Content: [1-5] - Notes: [Details]
- Course Content: [1-5] - Notes: [Details]
- Coaching Content: [1-5] - Notes: [Details]
- Differences Evident: [Yes/No]

#### Audience Adaptation
- Developer Content: [1-5] - Notes: [Details]
- Professional Content: [1-5] - Notes: [Details]
- Consumer Content: [1-5] - Notes: [Details]
- Differences Evident: [Yes/No]

#### Industry Adaptation
- Devtools Content: [1-5] - Notes: [Details]
- Education Content: [1-5] - Notes: [Details]
- Lifestyle Content: [1-5] - Notes: [Details]
- Differences Evident: [Yes/No]

### Product-Aware vs. Generic Comparison
- Product-Aware Content Quality: [1-5]
- Generic Content Quality: [1-5]
- Improvement: [Significant/Moderate/Minimal]

### Overall Statistics
- Average Product Awareness: [Score/5.0]
- Content Differentiation: [High/Moderate/Low]
- Adaptation Quality: [Excellent/Good/Acceptable/Poor]

### Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Impact: [Description]

### Recommendations
1. [Recommendation for improvement]

### Final Verdict
[PASS / FAIL / NEEDS IMPROVEMENT]

**Product Awareness**: [Excellent/Good/Acceptable/Poor]
```

---

## Test Data

### Test Activity
- **Title**: "Improved user experience"
- **Description**: "Made the interface more intuitive and responsive"
- **Use across**: All test products

### Expected Adaptations

1. **SaaS for Developers**
   - Technical language
   - Code/API examples
   - Performance metrics
   - Developer-focused value

2. **Online Course**
   - Educational language
   - Learning outcomes
   - Student-focused value
   - Educational examples

3. **Coaching Service**
   - Personal language
   - Client success stories
   - Empathetic tone
   - Transformation-focused

---

## Notes

- Product context should be evident in all content
- Compare same activity across products to see adaptation
- Language should match product type and audience
- Examples should be relevant to product
- Test edge cases: very different products, similar products
- Document specific examples of good and poor adaptation
