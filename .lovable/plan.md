
## Remove Practice Button from Assessment Intro Page

### Summary
Remove the "Step 2: Practice Mode" button from the AssessmentIntro page, leaving only the "Step 1: MCQ Test" button.

---

### Change Required

**File:** `src/pages/AssessmentIntro.tsx`

**What to remove (lines 247-254):**
```tsx
<Button 
  size="lg" 
  className="min-w-[200px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all"
  onClick={() => navigate("/practice-mode", { state: { domain } })}
>
  <Code className="w-4 h-4 mr-2" />
  Step 2: Practice Mode
</Button>
```

**Additional cleanup:**
- Remove the `Code` icon import from lucide-react (line 5) since it will no longer be used in this file
- Simplify the button container styling (remove flex-row gap since there's only one button)

---

### Result
The page will show only the MCQ Test button, aligning with the progressive assessment gating where users must pass the MCQ test before accessing the coding challenge.
