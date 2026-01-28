# Test Q-002: Strategy Alignment

## Test Information

- **Test ID**: Q-002
- **Test Name**: Strategy Alignment Validation
- **Quality Dimension**: Strategy Compliance
- **Priority**: Critical

---

## Objective

Validate that generated content follows product strategy recommendations:
1. Uses recommended platforms
2. Follows tone and voice guidance
3. Uses recommended proof types
4. Avoids anti-patterns
5. Follows posting cadence recommendations
6. Respects platform warnings

---

## Prerequisites

- User account created and logged in
- Multiple products with different strategies
- Content generated for each product
- Strategy documents available for reference

---

## Test Steps

### Step 1: Review Product Strategies
1. For each product, review the generated strategy:
   - Platform recommendations (primary, secondary, avoid)
   - Tone and voice guidance
   - Content type recommendations
   - Proof types
   - Anti-patterns
   - Posting cadence

2. Document strategy recommendations for each product

**Expected Result**: Strategy recommendations documented

---

### Step 2: Generate Content for Recommended Platforms
1. For each product, generate content for recommended platforms
2. Generate multiple content pieces
3. Review content for strategy compliance

**Expected Result**: Content generated for recommended platforms

---

### Step 3: Evaluate Platform Compliance
For each content piece, check:
- [ ] Content is for a recommended platform
- [ ] Content format matches platform recommendations
- [ ] Content style matches platform best practices

**Expected Result**: Content uses recommended platforms correctly

---

### Step 4: Evaluate Tone Compliance
For each content piece, check:
- [ ] Tone matches strategy recommendations
- [ ] Style matches strategy examples
- [ ] Avoided tone elements are not present
- [ ] Language is appropriate for strategy

**Expected Result**: Content tone aligns with strategy

---

### Step 5: Evaluate Proof Type Usage
For each content piece, check:
- [ ] Uses recommended proof types
- [ ] Proof types are appropriate
- [ ] Proof types are credible

**Expected Result**: Content uses recommended proof types

---

### Step 6: Evaluate Anti-Pattern Avoidance
For each content piece, check:
- [ ] Anti-patterns from strategy are avoided
- [ ] Content doesn't violate "what NOT to do" guidance
- [ ] Content follows strategy's avoid list

**Expected Result**: Anti-patterns are avoided

---

### Step 7: Test "Avoid" Platform Warning
1. Generate content for a platform marked "avoid" in strategy
2. Check if warning is displayed (if implemented)
3. Review content quality (should still be good, but adapted)

**Expected Result**: 
- Warning displayed (if implemented)
- Content adapted appropriately if proceeding

---

### Step 8: Evaluate Content Type Compliance
For each content piece, check:
- [ ] Content type is recommended
- [ ] Content type matches strategy
- [ ] Avoided content types are not used

**Expected Result**: Content types align with strategy

---

### Step 9: Compare Across Products
1. Compare content from different products
2. Verify content adapts to different strategies
3. Verify strategies are being followed differently

**Expected Result**: Content adapts correctly to different strategies

---

## Evaluation Criteria

### Strategy Compliance Checklist

For each content piece, verify:
- [ ] Platform is recommended (not "avoid")
- [ ] Tone matches strategy
- [ ] Proof types are recommended
- [ ] Anti-patterns are avoided
- [ ] Content type is recommended
- [ ] Style matches strategy examples

### Compliance Scoring
- **Full Compliance**: All checklist items pass
- **Partial Compliance**: Most items pass, minor deviations
- **Non-Compliance**: Significant deviations from strategy

### Success Criteria
- ≥ 90% of content pieces show full compliance
- No content pieces show non-compliance
- Strategy differences are evident across products

---

## Result Template

```markdown
## Test Q-002 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Products Tested
- Product 1: [Name] - [Type]
- Product 2: [Name] - [Type]
- Product 3: [Name] - [Type]

### Strategy Compliance by Product

#### Product 1: [Name]
- Content Pieces: [Number]
- Platform Compliance: [%]
- Tone Compliance: [%]
- Proof Type Compliance: [%]
- Anti-Pattern Avoidance: [%]
- Overall Compliance: [%]
- Notes: [Observations]

#### Product 2: [Name]
[... Repeat for all products ...]

### Detailed Compliance Analysis

#### Content Piece 1: [Title] - [Product]
- Platform: [Recommended/Avoid] - [Compliant/Non-Compliant]
- Tone: [Compliant/Non-Compliant] - Notes: [Details]
- Proof Types: [Compliant/Non-Compliant] - Notes: [Details]
- Anti-Patterns: [Avoided/Present] - Notes: [Details]
- Content Type: [Compliant/Non-Compliant] - Notes: [Details]
- **Overall**: [Full/Partial/Non-Compliance]

[... Repeat for all content pieces ...]

### Overall Statistics
- Total Content Pieces: [Number]
- Full Compliance: [Number] ([%])
- Partial Compliance: [Number] ([%])
- Non-Compliance: [Number] ([%])
- Average Compliance: [%]

### Strategy Differentiation
- Products Show Different Strategies: [Yes/No]
- Content Adapts to Strategies: [Yes/No]
- Strategy Differences Evident: [Yes/No]

### Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Impact: [Description]
   - Frequency: [How often]

### Recommendations
1. [Recommendation for improvement]

### Final Verdict
[PASS / FAIL / NEEDS IMPROVEMENT]

**Compliance Rate**: [%]
```

---

## Test Data

### Products with Different Strategies

1. **SaaS for Developers**
   - Recommended: GitHub, Twitter, LinkedIn
   - Tone: Technical, honest, no hype
   - Avoid: Marketing speak, fake metrics

2. **Online Course**
   - Recommended: LinkedIn, Twitter, Blog
   - Tone: Educational, helpful, authentic
   - Avoid: Salesy language, false promises

3. **Coaching Service**
   - Recommended: LinkedIn, Instagram
   - Tone: Personal, empathetic, authentic
   - Avoid: Generic advice, influencer speak

---

## Notes

- Strategy alignment is critical - content should follow recommendations
- Anti-pattern avoidance is important - reduces decision fatigue
- Compare content across products to verify strategy differentiation
- Document specific examples of compliance and non-compliance
- Strategy system should be opinionated, not generic
