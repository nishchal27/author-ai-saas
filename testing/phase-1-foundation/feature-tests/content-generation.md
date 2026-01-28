# Test F-005: Content Generation

## Test Information

- **Test ID**: F-005
- **Test Name**: Content Generation (All Types)
- **Feature**: Multi-Format Content Generation with Strategy
- **Priority**: Critical

---

## Objective

Validate that content generation correctly:
1. Generates all content types (post, blog, carousel, thread, caption)
2. Applies product strategy (tone, anti-patterns, proof types)
3. Optimizes for platforms (LinkedIn, Twitter, Instagram, Blog)
4. Includes product context appropriately
5. Generates visual prompts for visual content
6. Produces publication-ready content

---

## Prerequisites

- User account created and logged in
- At least one product created with strategy
- At least one insight extracted
- API keys configured (Anthropic)

---

## Test Steps

### Test Case 1: LinkedIn Post Generation

#### Step 1: Select Insight
1. Go to Insights page
2. Select an insight
3. Click "Generate Content"

**Expected Result**: Content generation options appear

---

#### Step 2: Generate LinkedIn Post
1. Select content type: "post"
2. Select platform: "linkedin"
3. Click "Generate"

**Expected Result**: Content generation initiates, loading state displayed

---

#### Step 3: Validate Content
1. Wait for generation to complete (typically 10-30 seconds)
2. Review generated content:
   - [ ] Content is appropriate length (200-500 words for post)
   - [ ] Content is professional and thoughtful
   - [ ] Content follows product strategy tone
   - [ ] Content includes product context appropriately
   - [ ] Content has clear value proposition
   - [ ] Content includes CTA (if appropriate)
   - [ ] Content avoids anti-patterns from strategy
   - [ ] Content uses recommended proof types

**Expected Result**: High-quality LinkedIn post that follows strategy

---

#### Step 4: Verify Database
1. Check database for ContentDraft record
2. Verify fields:
   - type = "post"
   - platform = "linkedin"
   - content, title, cta
   - productId, insightId linked correctly
   - status = "draft"

**Expected Result**: Content draft created with all fields

---

### Test Case 2: Twitter Thread Generation

#### Step 1: Generate Twitter Thread
1. Select insight
2. Select content type: "thread"
3. Select platform: "twitter"
4. Click "Generate"

**Expected Result**: Thread generation completes

---

#### Step 2: Validate Thread
1. Review thread:
   - [ ] Multiple tweets in thread format
   - [ ] Each tweet ≤ 280 characters
   - [ ] Thread is engaging and punchy
   - [ ] Thread follows Twitter best practices
   - [ ] Thread follows product strategy
   - [ ] Thread includes product context

**Expected Result**: Well-formatted Twitter thread

---

### Test Case 3: Blog Post Generation

#### Step 1: Generate Blog Post
1. Select insight
2. Select content type: "blog"
3. Select platform: "blog"
4. Click "Generate"

**Expected Result**: Blog post generation completes

---

#### Step 2: Validate Blog Post
1. Review blog post:
   - [ ] Length is appropriate (800-1500 words)
   - [ ] Structure is clear (headings, paragraphs)
   - [ ] Content is in-depth and valuable
   - [ ] Content is SEO-friendly
   - [ ] Content follows product strategy
   - [ ] Content includes product context
   - [ ] Content has clear value proposition

**Expected Result**: High-quality blog post draft

---

### Test Case 4: Carousel Generation

#### Step 1: Generate Carousel
1. Select insight
2. Select content type: "carousel"
3. Select platform: "linkedin" (or instagram)
4. Click "Generate"

**Expected Result**: Carousel generation completes

---

#### Step 2: Validate Carousel
1. Review carousel:
   - [ ] Multiple slides with clear structure
   - [ ] Visual prompt provided for each slide
   - [ ] Content is visual-first
   - [ ] Content follows product strategy
   - [ ] Visual prompts are relevant and detailed

**Expected Result**: Well-structured carousel with visual prompts

---

### Test Case 5: Strategy Alignment Test

#### Step 1: Generate for Recommended Platform
1. Check product strategy for recommended platforms
2. Generate content for a recommended platform
3. Verify content follows strategy recommendations

**Expected Result**: Content aligns with strategy recommendations

---

#### Step 2: Generate for "Avoid" Platform
1. Check product strategy for "avoid" platforms
2. Generate content for an "avoid" platform
3. Verify warning is displayed (if implemented)
4. Assess if content still follows strategy (should adapt carefully)

**Expected Result**: Warning displayed, content adapted appropriately

---

#### Step 3: Verify Anti-Pattern Avoidance
1. Check product strategy anti-patterns
2. Generate multiple content pieces
3. Verify anti-patterns are avoided

**Expected Result**: Anti-patterns are not present in generated content

---

#### Step 4: Verify Tone Compliance
1. Check product strategy tone recommendations
2. Generate content
3. Compare tone with strategy recommendations

**Expected Result**: Tone matches strategy recommendations

---

### Test Case 6: Product Context Application

#### Step 1: Generate with Product Context
1. Generate content with product linked
2. Review content for product awareness:
   - [ ] Product context is evident
   - [ ] Language appropriate for product audience
   - [ ] Examples relevant to product
   - [ ] Value proposition aligned with product

**Expected Result**: Content is product-aware

---

#### Step 2: Generate without Product Context
1. Generate content without product (or different product)
2. Compare with product-aware content

**Expected Result**: Product-aware content is more relevant and tailored

---

## Evaluation Criteria

### Functional Requirements
- [ ] All content types generate successfully
- [ ] All platforms supported
- [ ] Content stored in database correctly
- [ ] Visual prompts generated (for carousels/images)
- [ ] Strategy applied correctly
- [ ] Product context applied correctly

### Quality Requirements
- [ ] Content is publication-ready (minimal edits needed)
- [ ] Content follows platform best practices
- [ ] Content follows product strategy
- [ ] Content is product-aware
- [ ] Content is clear and valuable
- [ ] Content is authentic (sounds like founder, not marketer)
- [ ] Content avoids anti-patterns
- [ ] Content uses recommended proof types
- [ ] Content tone matches strategy

### Platform Optimization
- [ ] LinkedIn posts: Professional, thoughtful, longer form
- [ ] Twitter threads: Concise, punchy, engaging
- [ ] Blog posts: In-depth, structured, SEO-friendly
- [ ] Carousels: Visual-first, engaging, structured

---

## Result Template

```markdown
## Test F-005 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: LinkedIn Post
- Status: [PASS/FAIL]
- Quality: [1-5]
- Strategy Alignment: [1-5]
- Publication Ready: [Yes/No]

### Test Case 2: Twitter Thread
- Status: [PASS/FAIL]
- Quality: [1-5]
- Format Compliance: [1-5] (280 char limit, thread structure)

### Test Case 3: Blog Post
- Status: [PASS/FAIL]
- Quality: [1-5]
- Structure: [1-5]
- SEO-Friendly: [1-5]

### Test Case 4: Carousel
- Status: [PASS/FAIL]
- Quality: [1-5]
- Visual Prompts: [1-5]
- Structure: [1-5]

### Test Case 5: Strategy Alignment
- Recommended Platform: [PASS/FAIL]
- Avoid Platform Warning: [PASS/FAIL]
- Anti-Pattern Avoidance: [PASS/FAIL]
- Tone Compliance: [1-5]

### Test Case 6: Product Context
- Product Awareness: [1-5]
- Context Application: [1-5]

### Content Quality Scores (Sample)
1. [Content Type] - [Platform]
   - Relevance: [1-5]
   - Clarity: [1-5]
   - Value: [1-5]
   - Authenticity: [1-5]
   - Strategy Alignment: [1-5]
   - Platform Fit: [1-5]

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

### Insights for Content Generation

1. **Performance Improvement Insight**
   - Generate: Post, Thread, Blog
   - Test: Strategy alignment, product awareness

2. **Feature Addition Insight**
   - Generate: Post, Carousel
   - Test: Visual prompts, platform optimization

3. **User Feedback Insight**
   - Generate: Post, Thread
   - Test: Authenticity, value proposition

4. **Integration Insight**
   - Generate: Blog, Post
   - Test: Depth, SEO-friendliness

---

## Notes

- Content quality is subjective - use judgment: "Would I publish this?"
- Compare generated content with manual work (Lexnify benchmark)
- Strategy alignment is critical - content should follow recommendations
- Platform optimization is important - content should fit platform format
- Product awareness should be evident but not forced
- Content should be publication-ready with minimal edits
