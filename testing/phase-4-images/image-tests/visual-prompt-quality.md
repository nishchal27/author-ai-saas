# Test I-001: Visual Prompt Quality

## Test Information

- **Test ID**: I-001
- **Test Name**: Visual Prompt Quality
- **Image Dimension**: Prompt Generation
- **Priority**: High

---

## Objective

Evaluate the quality and relevance of visual prompts generated for content:
1. Prompts are detailed and specific
2. Prompts are relevant to content
3. Prompts are relevant to product
4. Prompts generate appropriate images
5. Prompts are actionable for DALL·E

---

## Prerequisites

- User account created and logged in
- Multiple content pieces generated (with visual prompts)
- Products created for context
- Images generated from prompts

---

## Test Steps

### Step 1: Generate Content with Visual Prompts
1. Generate multiple content pieces:
   - Carousels (should have visual prompts)
   - Posts with images
   - Blog posts with headers
2. Collect all visual prompts

**Expected Result**: Multiple visual prompts collected

---

### Step 2: Evaluate Prompt Detail
For each visual prompt, assess:
- [ ] Prompt is detailed (not vague)
- [ ] Prompt is specific (not generic)
- [ ] Prompt includes relevant context
- [ ] Prompt is actionable for image generation

**Scoring (1-5)**:
- 5: Highly detailed, specific, actionable
- 4: Mostly detailed, some specifics
- 3: Somewhat detailed, some vagueness
- 2: Partially detailed, mostly vague
- 1: Vague, not actionable

---

### Step 3: Evaluate Prompt Relevance to Content
For each visual prompt, assess:
- [ ] Prompt is relevant to content topic
- [ ] Prompt complements content
- [ ] Prompt enhances content message
- [ ] Prompt aligns with content tone

**Scoring (1-5)**:
- 5: Highly relevant, perfect alignment
- 4: Mostly relevant, good alignment
- 3: Somewhat relevant, partial alignment
- 2: Partially relevant, poor alignment
- 1: Not relevant, no alignment

---

### Step 4: Evaluate Prompt Relevance to Product
For each visual prompt, assess:
- [ ] Prompt is relevant to product type
- [ ] Prompt is relevant to product industry
- [ ] Prompt is relevant to product audience
- [ ] Prompt reflects product context

**Scoring (1-5)**:
- 5: Highly relevant to product
- 4: Mostly relevant to product
- 3: Somewhat relevant to product
- 2: Partially relevant to product
- 1: Not relevant to product

---

### Step 5: Generate Images from Prompts
1. Generate images from visual prompts
2. Assess if prompts generate appropriate images
3. Compare prompt quality with image quality

**Expected Result**: Prompts generate appropriate images

---

### Step 6: Compare Prompt Quality
1. Compare prompts across different:
   - Content types
   - Products
   - Industries
2. Assess consistency and quality

**Expected Result**: Prompts are consistently high quality

---

## Evaluation Criteria

### Prompt Quality Scoring (1-5)

For each visual prompt, assess:
- **Detail Level**: [1-5]
- **Specificity**: [1-5]
- **Relevance to Content**: [1-5]
- **Relevance to Product**: [1-5]
- **Actionability**: [1-5]

### Success Criteria
- Average prompt quality score ≥ 4.0/5.0
- Prompts are detailed and specific
- Prompts are relevant to content and product
- Prompts generate appropriate images

---

## Result Template

```markdown
## Test I-001 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Visual Prompts Evaluated
- Total: [Number]
- Carousels: [Number]
- Posts: [Number]
- Blogs: [Number]

### Prompt Quality Scores

#### Prompt 1: [Content Title]
- Detail Level: [1-5]
- Specificity: [1-5]
- Relevance to Content: [1-5]
- Relevance to Product: [1-5]
- Actionability: [1-5]
- **Average**: [Score/5.0]
- Prompt Text: [Full prompt]
- Notes: [Observations]

#### Prompt 2: [Content Title]
[... Repeat for all prompts ...]

### Overall Statistics
- Average Detail Level: [Score/5.0]
- Average Specificity: [Score/5.0]
- Average Relevance to Content: [Score/5.0]
- Average Relevance to Product: [Score/5.0]
- Average Actionability: [Score/5.0]
- **Overall Average**: [Score/5.0]

### Image Generation Success
- Prompts Generate Appropriate Images: [Yes/No]
- Image Quality Matches Prompt Quality: [Yes/No]
- Notes: [Observations]

### Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Impact: [Description]

### Recommendations
1. [Recommendation for improvement]

### Final Verdict
[PASS / FAIL / NEEDS IMPROVEMENT]

**Prompt Quality**: [Excellent/Good/Acceptable/Poor]
```

---

## Test Data

### Content Types for Prompt Testing

1. **Performance Improvement**
   - Expected: Dashboard/metrics visualization
   - Product: SaaS

2. **Feature Addition**
   - Expected: Feature interface visualization
   - Product: SaaS

3. **User Feedback**
   - Expected: User satisfaction visualization
   - Product: Any

4. **Integration**
   - Expected: Integration flow visualization
   - Product: SaaS

---

## Notes

- Visual prompts should be detailed enough for DALL·E
- Prompts should include product context
- Compare prompt quality with generated image quality
- Document specific examples of good and poor prompts
- Test with different content types and products
