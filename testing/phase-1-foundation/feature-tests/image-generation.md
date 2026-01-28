# Test F-006: Image Generation

## Test Information

- **Test ID**: F-006
- **Test Name**: DALL·E Image Generation
- **Feature**: Visual Generation from Prompts
- **Priority**: High

---

## Objective

Validate that image generation correctly:
1. Generates images from visual prompts
2. Applies user visual style preferences
3. Produces professional, relevant images
4. Links images to content drafts
5. Stores image URLs correctly

---

## Prerequisites

- User account created and logged in
- At least one content draft with visual prompt
- API keys configured (OpenAI for DALL·E)
- User visual style preferences set (optional)

---

## Test Steps

### Test Case 1: Image Generation from Draft Visual Prompt

#### Step 1: Create Content with Visual Prompt
1. Generate a carousel or post with visual prompt
2. Verify visual prompt is generated and stored

**Expected Result**: Content draft has visualPrompt field populated

---

#### Step 2: Generate Image
1. Go to content draft page
2. Click "Generate Image" button
3. Wait for image generation (typically 10-20 seconds)

**Expected Result**: Image generation initiates, loading state displayed

---

#### Step 3: Validate Image
1. Wait for generation to complete
2. Review generated image:
   - [ ] Image is displayed
   - [ ] Image is relevant to visual prompt
   - [ ] Image is professional quality
   - [ ] Image is appropriate for content
   - [ ] Image matches product context (if applicable)
   - [ ] Image has no text overlays (as specified)
   - [ ] Image is clean and minimalistic

**Expected Result**: High-quality, relevant image generated

---

#### Step 4: Verify Database
1. Check database for ContentDraft record
2. Verify visualUrl field is populated
3. Verify image URL is accessible

**Expected Result**: Image URL stored correctly, image accessible

---

### Test Case 2: Image Generation with Custom Prompt

#### Step 1: Generate Image with Custom Prompt
1. Go to content draft
2. Enter custom visual prompt (different from draft's prompt)
3. Click "Generate Image"

**Expected Result**: Image generated from custom prompt

---

#### Step 2: Compare Images
1. Generate image from draft's visual prompt
2. Generate image from custom prompt
3. Compare relevance and quality

**Expected Result**: Both images are relevant, custom prompt works

---

### Test Case 3: Visual Style Application

#### Step 1: Set User Visual Style
1. Go to Settings
2. Set visual style preferences (if available)
3. Save preferences

**Expected Result**: Visual style preferences saved

---

#### Step 2: Generate Image
1. Generate image with visual style preferences set
2. Review image for style compliance

**Expected Result**: Image reflects visual style preferences

---

### Test Case 4: Product Context in Images

#### Step 1: Generate Image for Product-Aware Content
1. Generate content with product context
2. Generate image from visual prompt
3. Assess image relevance to product

**Expected Result**: Image is relevant to product context

---

#### Step 2: Compare Product-Aware vs Generic
1. Generate image for product-aware content
2. Generate image for generic content
3. Compare relevance

**Expected Result**: Product-aware image is more relevant

---

### Test Case 5: Image Quality Assessment

#### Step 1: Generate Multiple Images
1. Generate images for different content types:
   - Carousel slide
   - Blog post header
   - Social post image
   - Infographic concept

#### Step 2: Assess Quality
For each image, assess:
- Relevance to prompt: [1-5]
- Relevance to content: [1-5]
- Relevance to product: [1-5]
- Professional quality: [1-5]
- Style consistency: [1-5]

**Expected Result**: Average quality score ≥ 4.0/5.0

---

## Evaluation Criteria

### Functional Requirements
- [ ] Image generation completes without errors
- [ ] Images generated from visual prompts
- [ ] Images generated from custom prompts
- [ ] Image URLs stored correctly
- [ ] Images accessible via URL
- [ ] Visual style preferences applied (if set)

### Quality Requirements
- [ ] Images are relevant to visual prompts
- [ ] Images are relevant to content
- [ ] Images are relevant to product (when applicable)
- [ ] Images are professional quality
- [ ] Images are clean and minimalistic
- [ ] Images have no text overlays
- [ ] Images are appropriate for use

### Product Awareness
- [ ] Images adapt to product context
- [ ] Images are relevant to product type
- [ ] Images match product style (when applicable)

---

## Result Template

```markdown
## Test F-006 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Test Case 1: Image from Draft Prompt
- Status: [PASS/FAIL]
- Images Generated: [Number]
- Average Quality: [Score/5.0]
- Relevance: [1-5]

### Test Case 2: Custom Prompt
- Status: [PASS/FAIL]
- Custom Prompts Work: [Yes/No]
- Quality: [1-5]

### Test Case 3: Visual Style
- Status: [PASS/FAIL]
- Style Applied: [Yes/No]
- Consistency: [1-5]

### Test Case 4: Product Context
- Status: [PASS/FAIL]
- Product Relevance: [1-5]
- Context Application: [1-5]

### Test Case 5: Quality Assessment
- Carousel Image: [1-5]
- Blog Header: [1-5]
- Social Post: [1-5]
- Infographic: [1-5]
- Average Quality: [Score/5.0]

### Image Quality Scores (Sample)
1. [Image Type] - [Content]
   - Relevance to Prompt: [1-5]
   - Relevance to Content: [1-5]
   - Relevance to Product: [1-5]
   - Professional Quality: [1-5]
   - Style Consistency: [1-5]

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

### Visual Prompts to Test

1. **Performance Improvement**
   - Prompt: "Clean dashboard showing performance metrics with upward trend"
   - Expected: Professional, data-focused image

2. **Feature Addition**
   - Prompt: "Modern interface showing bulk import feature with CSV file"
   - Expected: Product-focused, clear feature visualization

3. **User Feedback**
   - Prompt: "Happy users interacting with product, showing satisfaction"
   - Expected: User-focused, authentic image

4. **Integration**
   - Prompt: "Payment gateway integration with secure connection visualization"
   - Expected: Technical, trustworthy image

---

## Notes

- Image generation may take 10-20 seconds
- DALL·E 3 generates 1024x1024 images
- Images should be professional and usable without editing
- Visual prompts should be detailed and specific
- Product context should influence image relevance
- Compare generated images with manual design work to assess quality
