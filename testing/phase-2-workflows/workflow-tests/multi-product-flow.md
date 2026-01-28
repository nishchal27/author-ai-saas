# Test W-002: Multi-Product Flow

## Test Information

- **Test ID**: W-002
- **Test Name**: Multi-Product Switching & Isolation
- **Workflow**: Product Context Management
- **Priority**: High

---

## Objective

Validate that the system correctly handles multiple products:
1. Product switching works
2. Product isolation is maintained
3. Each product has independent strategy
4. Activities/insights/content are product-specific
5. Product context is maintained throughout workflows

---

## Prerequisites

- User account created and logged in
- Multiple products created (at least 2-3 different types)
- Each product has generated strategy

---

## Test Steps

### Step 1: Create Multiple Products
1. Create Product 1: "Lexnify" (SaaS, devtools, developers)
2. Create Product 2: "Online Course" (course, education, professionals)
3. Create Product 3: "Coaching Service" (coaching, lifestyle, consumers)
4. Verify all products have strategies generated

**Expected Result**: All products created with strategies

---

### Step 2: Switch Between Products
1. Use product switcher to select Product 1
2. Verify dashboard shows Product 1 context
3. Switch to Product 2
4. Verify dashboard updates
5. Switch to Product 3
6. Verify dashboard updates

**Expected Result**: Product switching works, dashboard updates correctly

---

### Step 3: Create Activities for Each Product
1. Select Product 1
2. Create activity: "Fixed performance issue"
3. Select Product 2
4. Create activity: "Added new lesson module"
5. Select Product 3
6. Create activity: "Completed client coaching session"

**Expected Result**: Activities created and linked to correct products

---

### Step 4: Verify Product Isolation
1. Select Product 1
2. Go to Activities page
3. Verify only Product 1 activities shown
4. Select Product 2
5. Go to Activities page
6. Verify only Product 2 activities shown
7. Repeat for Product 3

**Expected Result**: Activities are isolated by product

---

### Step 5: Extract Insights for Each Product
1. Select Product 1
2. Extract insight from Product 1 activity
3. Verify insight is product-aware (developer-focused)
4. Select Product 2
5. Extract insight from Product 2 activity
6. Verify insight is product-aware (education-focused)
7. Select Product 3
8. Extract insight from Product 3 activity
9. Verify insight is product-aware (consumer-focused)

**Expected Result**: Insights are product-specific and adapted

---

### Step 6: Generate Content for Each Product
1. Select Product 1
2. Generate content from Product 1 insight
3. Verify content follows Product 1 strategy (developer-focused)
4. Select Product 2
5. Generate content from Product 2 insight
6. Verify content follows Product 2 strategy (education-focused)
7. Select Product 3
8. Generate content from Product 3 insight
9. Verify content follows Product 3 strategy (consumer-focused)

**Expected Result**: Content adapts to each product's strategy

---

### Step 7: Compare Strategies
1. View Product 1 strategy
2. Note platform recommendations, tone, anti-patterns
3. View Product 2 strategy
4. Compare with Product 1 (should differ significantly)
5. View Product 3 strategy
6. Compare with Products 1 and 2 (should differ)

**Expected Result**: Strategies are product-specific and differ appropriately

---

### Step 8: Verify Database Isolation
1. Check database records:
   - [ ] Activities linked to correct products
   - [ ] Insights linked to correct products
   - [ ] Content drafts linked to correct products
   - [ ] No cross-product contamination

**Expected Result**: Database isolation maintained correctly

---

### Step 9: Test Product Context Maintenance
1. Select Product 1
2. Create activity → Extract insight → Generate content
3. Verify product context maintained throughout
4. Switch to Product 2 mid-flow
5. Verify new activity uses Product 2 context
6. Verify previous Product 1 content remains linked to Product 1

**Expected Result**: Product context maintained correctly, no mixing

---

## Evaluation Criteria

### Functional Requirements
- [ ] Product switching works
- [ ] Product isolation maintained
- [ ] Activities are product-specific
- [ ] Insights are product-specific
- [ ] Content is product-specific
- [ ] Strategies are independent
- [ ] Database isolation maintained

### Quality Requirements
- [ ] Product context evident in all outputs
- [ ] Strategies differ appropriately
- [ ] Content adapts to product type
- [ ] No cross-product contamination

### User Experience
- [ ] Product switcher is intuitive
- [ ] Context switching is clear
- [ ] No confusion about which product is active

---

## Result Template

```markdown
## Test W-002 Results

**Date**: [Date]
**Tester**: [Name]
**Status**: [PASS / FAIL / PARTIAL]

### Products Created
- Product 1: [Name] - [Type]
- Product 2: [Name] - [Type]
- Product 3: [Name] - [Type]

### Step-by-Step Results

#### Step 1: Create Multiple Products
- Status: [PASS/FAIL]
- Products Created: [Number]
- Strategies Generated: [Number]

#### Step 2: Switch Between Products
- Status: [PASS/FAIL]
- Switching Works: [Yes/No]
- Dashboard Updates: [Yes/No]

#### Step 3: Create Activities
- Status: [PASS/FAIL]
- Activities Created: [Number]
- Product Linking: [Correct/Incorrect]

#### Step 4: Verify Product Isolation
- Status: [PASS/FAIL]
- Isolation Maintained: [Yes/No]
- Filtering Works: [Yes/No]

#### Step 5: Extract Insights
- Status: [PASS/FAIL]
- Insights Extracted: [Number]
- Product Awareness: [1-5]
- Adaptation Quality: [1-5]

#### Step 6: Generate Content
- Status: [PASS/FAIL]
- Content Generated: [Number]
- Strategy Alignment: [1-5]
- Product Adaptation: [1-5]

#### Step 7: Compare Strategies
- Status: [PASS/FAIL]
- Strategies Differ: [Yes/No]
- Appropriateness: [1-5]

#### Step 8: Verify Database Isolation
- Status: [PASS/FAIL]
- Isolation Maintained: [Yes/No]
- No Contamination: [Yes/No]

#### Step 9: Test Context Maintenance
- Status: [PASS/FAIL]
- Context Maintained: [Yes/No]
- No Mixing: [Yes/No]

### Quality Assessment
- Product Isolation: [1-5]
- Context Maintenance: [1-5]
- Strategy Independence: [1-5]
- Overall Multi-Product Support: [1-5]

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

## Test Variations

### Variation 1: Same Activity Type, Different Products
1. Create similar activities for different products
2. Extract insights
3. Compare how insights adapt to products

### Variation 2: Strategy Regeneration
1. Regenerate strategy for one product
2. Verify other products' strategies unchanged
3. Verify isolation maintained

---

## Notes

- Product isolation is critical - no cross-contamination
- Strategies should differ significantly for different product types
- Content should clearly adapt to product context
- Product switcher should be prominent and clear
- Test edge cases: switching mid-flow, creating content without product selected
