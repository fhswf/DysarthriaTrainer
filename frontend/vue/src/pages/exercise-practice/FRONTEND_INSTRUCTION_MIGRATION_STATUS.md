# Frontend Exercise Practice - Instruction Migration Status

**Related Backend Report:** [backend/.github/docs/EXERCISE_INSTRUCTIONS_REFACTORING_STATUS.md](../../../../../backend/.github/docs/EXERCISE_INSTRUCTIONS_REFACTORING_STATUS.md)  
**Review Date:** January 7, 2026  
**Overall Status:** ⚠️ **NOT YET MIGRATED** - Using legacy exercise-level instructions

---

## Executive Summary

The **backend has fully implemented** item-level instructions (instruction_id on exercise items), but the **frontend exercise practice page is still using the legacy exercise-level instruction pattern**. This creates a functional gap where item-specific instructions cannot be displayed during practice sessions.

### Current State

❌ **Frontend NOT Using New Structure:**

- Still reading `exercise.instructions[]` (exercise-level)
- No support for `item.instruction_id` or `item.instruction`
- Instructions apply to entire exercise, not specific items
- Cannot leverage item-specific guidance

✅ **Backend Fully Ready:**

- Database migration complete
- API endpoints available
- Item-level instructions fully supported
- Backward compatible (exercise-level instructions still work)

---

## Current Implementation Analysis

### 1. Main Exercise Practice Component

**File:** `frontend/vue/src/pages/exercise-practice/app-exercise-practice.vue`

**Current Instruction Handling:**

```typescript
// Lines 344-349: Legacy exercise-level instruction lookup
const currentInstructions = computed(() => {
  if (!exercise.value?.instructions?.length) return null
  // Get instructions for current language (default to 'de')
  const instruction = exercise.value.instructions.find((inst) => inst.language === 'de')
  return instruction ?? exercise.value.instructions[0] // Fallback to first available
})
```

**Issues:**

- ❌ Reads from `exercise.instructions[]` (exercise-level)
- ❌ No awareness of `currentItem.instruction_id` or `currentItem.instruction`
- ❌ Same instructions shown for all items in an exercise
- ❌ Cannot display item-specific hints or safety notes

**Current Usage:**

- Button shows/hides based on `currentInstructions` (line 50)
- `InstructionsDialog` receives `currentInstructions` (line 204)
- Auto-opens on session start if instructions exist (line 415)

---

### 2. ExerciseItemDisplay Component

**File:** `frontend/vue/src/pages/exercise-practice/components/ExerciseItemDisplay.vue`

**Current State:**

- ✅ Displays item content (text, media, etc.)
- ❌ No instruction display or handling
- ❌ No awareness of item-level instructions
- ❌ No props for receiving instruction data

**Analysis:**
This component focuses on content display and recording controls. It doesn't handle instructions at all - those are managed by the parent component and `InstructionsDialog`.

---

### 3. InstructionsDialog Component

**File:** `frontend/vue/src/pages/exercise-practice/components/InstructionsDialog.vue`

**Current Interface:**

```typescript
export interface ExerciseInstruction {
  language: string
  hint_text?: string | null
  explanation_text?: string | null
  preparation_text?: string | null // ⚠️ Not in backend schema
}

interface Props {
  visible: boolean
  instructions: ExerciseInstruction | null
  title?: string
}
```

**Issues:**

- ⚠️ `preparation_text` field doesn't exist in backend schema (should be `safety_notes`)
- ✅ Structure otherwise matches backend `ExerciseInstructions` interface
- ✅ Can display hint, explanation, and safety information
- ℹ️ Works fine, just needs correct data source

**Display Sections:**

- Hint Section (yellow icon, lightbulb)
- Explanation Section (blue icon, info circle)
- Preparation Section (green icon, play circle) - **should be "Safety Notes"**

---

### 4. Type Definitions

**File:** `frontend/vue/src/api/exercises/exercises.types.ts`

**Exercise-Level Instructions (Legacy):**

```typescript
export interface ExerciseInstructions {
  id?: string
  exercise_id?: string
  language: string
  hint_text: string | null
  explanation_text: string | null
  preparation_text: string | null // ⚠️ Wrong field name
  display_order: number
}

export interface ExerciseDetail extends Exercise {
  instructions: ExerciseInstructions[] // ← Exercise-level
  category: ExerciseCategory
  items: ExerciseItem[]
}
```

**Exercise Item (Current):**

```typescript
export interface ExerciseItem {
  id: string
  exercise_id: string
  item_type: ExerciseItemType
  target_phoneme: string | null
  display_order: number
  repetitions?: number | null
  contents: ExerciseItemContent[]
  created_at: string
  updated_at: string
  // ❌ Missing: instruction_id?: string | null
  // ❌ Missing: instruction?: ExerciseInstructions | null
}
```

**Issues:**

- ❌ `ExerciseItem` interface missing `instruction_id` field
- ❌ `ExerciseItem` interface missing `instruction` nested object
- ⚠️ `preparation_text` should be `safety_notes` to match backend

---

## Required Frontend Changes

### Phase 1: Update Type Definitions

**File:** `frontend/vue/src/api/exercises/exercises.types.ts`

**Changes Needed:**

```typescript
// Fix field name to match backend
export interface ExerciseInstructions {
  id?: string
  exercise_id?: string
  language: string
  hint_text: string | null
  explanation_text: string | null
  safety_notes: string | null // ← Changed from preparation_text
  display_order: number
}

// Add item-level instruction support
export interface ExerciseItem {
  id: string
  exercise_id: string
  item_type: ExerciseItemType
  target_phoneme: string | null
  display_order: number
  repetitions?: number | null
  instruction_id?: string | null // ← Add this
  instruction?: ExerciseInstructions | null // ← Add this (nested object)
  contents: ExerciseItemContent[]
  created_at: string
  updated_at: string
}
```

---

### Phase 2: Update InstructionsDialog Component

**File:** `frontend/vue/src/pages/exercise-practice/components/InstructionsDialog.vue`

**Changes Needed:**

1. **Fix interface field name:**

```typescript
export interface ExerciseInstruction {
  language: string
  hint_text?: string | null
  explanation_text?: string | null
  safety_notes?: string | null // ← Changed from preparation_text
}
```

2. **Update template bindings:**

```vue
<!-- Change preparation_text to safety_notes -->
<div v-if="instructions?.safety_notes" class="animate-fade-in">
    <div class="flex items-center gap-3 mb-3">
        <div class="... bg-gradient-to-br from-red-100 to-red-200 text-red-900">
            <i class="pi pi-exclamation-triangle text-xl"></i>
        </div>
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Sicherheitshinweise</h3>
    </div>
    <p class="text-surface-700 dark:text-surface-300 leading-relaxed pl-12 whitespace-pre-line">
        {{ instructions.safety_notes }}
    </p>
</div>
```

3. **Update empty state check:**

```typescript
<div v-if="!instructions?.hint_text && !instructions?.explanation_text && !instructions?.safety_notes"
    class="text-center py-8 text-surface-500 dark:text-surface-400">
```

---

### Phase 3: Update Exercise Practice Component

**File:** `frontend/vue/src/pages/exercise-practice/app-exercise-practice.vue`

**Changes Needed:**

1. **Replace `currentInstructions` computed property:**

```typescript
// OLD (exercise-level):
const currentInstructions = computed(() => {
  if (!exercise.value?.instructions?.length) return null
  const instruction = exercise.value.instructions.find((inst) => inst.language === 'de')
  return instruction ?? exercise.value.instructions[0]
})

// NEW (item-level with fallback):
const currentInstructions = computed(() => {
  if (!currentItem.value) return null

  // Priority 1: Item-level instruction
  if (currentItem.value.instruction) {
    return currentItem.value.instruction
  }

  // Priority 2: Item has instruction_id but not loaded - try to find it
  if (currentItem.value.instruction_id && exercise.value?.instructions) {
    const found = exercise.value.instructions.find(
      (inst) => inst.id === currentItem.value.instruction_id
    )
    if (found) return found
  }

  // Priority 3: Fallback to exercise-level instructions (backward compatibility)
  if (exercise.value?.instructions?.length) {
    const instruction = exercise.value.instructions.find((inst) => inst.language === 'de')
    return instruction ?? exercise.value.instructions[0]
  }

  return null
})
```

**Rationale for Fallback:**

- Maintains backward compatibility with existing exercises
- Gradually migrates to item-level instructions
- Doesn't break current functionality

---

### Phase 4: Update Practice Session Types (Optional)

**File:** `frontend/vue/src/stores/practiceSession/types.ts`

**Current:**

```typescript
export interface ExerciseItem {
  id: string
  exerciseId: string
  orderIndex: number
  itemType: 'word' | 'sentence' | 'phrase'
  content: string
  targetPhonemes: string[]
  difficulty: number
  repeatCount: number
  metadata: Record<string, any>
}
```

**Suggested Update:**

```typescript
export interface ExerciseItem {
  id: string
  exerciseId: string
  orderIndex: number
  itemType: 'word' | 'sentence' | 'phrase'
  content: string
  targetPhonemes: string[]
  difficulty: number
  repeatCount: number
  instructionId?: string | null // ← Add
  instruction?: ExerciseInstruction | null // ← Add
  metadata: Record<string, any>
}
```

**Note:** This type is used internally by the practice session store and might have different requirements than the API types.

---

## Implementation Priority

### High Priority (Do First)

1. **✅ Phase 1: Update Type Definitions**

   - Critical for type safety
   - Foundation for other changes
   - Low risk (TypeScript will catch errors)

2. **✅ Phase 2: Update InstructionsDialog**

   - Fix field name mismatch
   - Update UI labels
   - Test display with both data sources

3. **✅ Phase 3: Update Exercise Practice**
   - Implement item-level instruction lookup
   - Add fallback for backward compatibility
   - Test with various scenarios

### Lower Priority (Can Wait)

4. **⚠️ Phase 4: Practice Session Types**
   - Only needed if practice session store uses instructions
   - Can be deferred if not currently used
   - Low impact on user experience

---

## Testing Strategy

### Test Scenarios

#### Scenario 1: Item with Specific Instruction

- **Setup:** Exercise with item that has `instruction_id` set
- **Expected:** Display item-specific instructions
- **Verify:** Instructions change between items if they have different instruction_ids

#### Scenario 2: Item without Instruction (Fallback)

- **Setup:** Exercise with items that have no `instruction_id`
- **Expected:** Display exercise-level instructions (backward compatibility)
- **Verify:** Instructions stay same across items

#### Scenario 3: Mixed Items

- **Setup:** Exercise with some items having instructions, others not
- **Expected:** Show item instruction when available, fallback to exercise-level otherwise
- **Verify:** Button appears/disappears correctly

#### Scenario 4: No Instructions

- **Setup:** Exercise with no instructions at any level
- **Expected:** No instruction button shown
- **Verify:** Dialog shows empty state if opened

#### Scenario 5: Field Name Migration

- **Setup:** Exercise with `safety_notes` data
- **Expected:** Display correctly as "Sicherheitshinweise"
- **Verify:** Old `preparation_text` no longer used

### Manual Testing Checklist

- [ ] Load exercise with item-level instructions
- [ ] Verify instruction button shows/hides per item
- [ ] Open instructions dialog for each item
- [ ] Verify different instructions display correctly
- [ ] Test fallback with exercise-level instructions
- [ ] Test exercise with no instructions
- [ ] Verify safety notes display (not preparation)
- [ ] Test language selection (if multiple languages)
- [ ] Test navigation between items with different instructions
- [ ] Verify no console errors or type warnings

---

## API Considerations

### Current API Usage

The frontend currently loads exercises via:

- `GET /api/v1/exercises/{id}` → Returns `ExerciseDetail`

**Current Response Structure:**

```json
{
  "id": "...",
  "title": "...",
  "instructions": [
    {
      "id": "...",
      "exercise_id": "...",
      "language": "de",
      "hint_text": "...",
      "explanation_text": "...",
      "safety_notes": "..."
    }
  ],
  "items": [
    {
      "id": "...",
      "item_type": "movement",
      "instruction_id": "...",  // ← Backend provides this
      "instruction": {          // ← Backend provides this (nested)
        "id": "...",
        "hint_text": "...",
        "explanation_text": "...",
        "safety_notes": "..."
      },
      "contents": [...]
    }
  ]
}
```

**Required Changes:**

- ✅ Backend already returns `instruction_id` and nested `instruction` on items
- ❌ Frontend types don't capture these fields
- ❌ Frontend code doesn't use these fields

**Action:** Update frontend types and logic to consume existing backend data

---

## Migration Path

### Recommended Approach: Gradual Migration

**Phase 1: Enable Frontend Support (Non-Breaking)**

1. Update TypeScript types to include `instruction_id` and `instruction`
2. Update `currentInstructions` computed to check item-level first
3. Add fallback to exercise-level instructions
4. Deploy and test

**Phase 2: Monitor Usage**

1. Track which exercises use item-level vs exercise-level instructions
2. Identify exercises that would benefit from item-specific instructions
3. Gather feedback from therapists

**Phase 3: Content Migration (Optional)**

1. Therapists update exercises to add item-specific instructions
2. Gradually migrate existing exercises
3. No forced migration required (backward compatible)

**Phase 4: Eventual Deprecation (Future)**

1. After sufficient adoption, consider deprecating exercise-level instructions
2. Requires frontend + backend + data migration
3. Timeline: 6-12 months minimum

---

## Risks and Mitigations

### Risk 1: Breaking Existing Functionality

**Mitigation:** Implement fallback to exercise-level instructions. Existing behavior preserved.

### Risk 2: Data Inconsistency

**Mitigation:** Backend supports both patterns. Frontend checks item-level first, falls back gracefully.

### Risk 3: User Confusion

**Mitigation:** Clear UI indication when instructions are item-specific vs exercise-wide (future enhancement).

### Risk 4: Type Errors

**Mitigation:** Use optional chaining (`?.`) and null checks. TypeScript will catch type mismatches.

---

## Success Criteria

### Definition of Done

- [ ] Frontend types updated with `instruction_id` and `instruction` fields
- [ ] `InstructionsDialog` uses correct field names (`safety_notes`)
- [ ] `app-exercise-practice.vue` checks item-level instructions first
- [ ] Fallback to exercise-level instructions works
- [ ] All test scenarios pass
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Backward compatibility maintained
- [ ] Documentation updated

---

## Timeline Estimate

| Phase                           | Effort        | Notes                              |
| ------------------------------- | ------------- | ---------------------------------- |
| Phase 1: Update Types           | 30-60 min     | Straightforward type updates       |
| Phase 2: Update Dialog          | 30-45 min     | Template and field name changes    |
| Phase 3: Update Practice Logic  | 1-2 hours     | Computed property logic + testing  |
| Phase 4: Practice Session Types | 30 min        | Optional, if needed                |
| Testing                         | 1-2 hours     | Manual + automated testing         |
| Documentation                   | 30 min        | Update comments and docs           |
| **Total**                       | **4-6 hours** | Includes testing and documentation |

---

## Comparison: Current vs Desired State

### Current State (Legacy)

```typescript
// Exercise Practice Component
const currentInstructions = computed(() => {
  // Only reads exercise.instructions (exercise-level)
  if (!exercise.value?.instructions?.length) return null
  const instruction = exercise.value.instructions.find((inst) => inst.language === 'de')
  return instruction ?? exercise.value.instructions[0]
})
```

**Result:**

- ✅ Works with existing data
- ❌ Cannot show item-specific instructions
- ❌ Same instructions for all items
- ❌ No per-item customization

### Desired State (Migrated)

```typescript
// Exercise Practice Component
const currentInstructions = computed(() => {
  if (!currentItem.value) return null

  // Priority 1: Item-level instruction (new feature)
  if (currentItem.value.instruction) {
    return currentItem.value.instruction
  }

  // Priority 2: Fallback to exercise-level (backward compatibility)
  if (exercise.value?.instructions?.length) {
    const instruction = exercise.value.instructions.find((inst) => inst.language === 'de')
    return instruction ?? exercise.value.instructions[0]
  }

  return null
})
```

**Result:**

- ✅ Supports item-specific instructions
- ✅ Backward compatible with exercise-level
- ✅ Instructions can vary per item
- ✅ Enables per-item customization
- ✅ Graceful fallback

---

## Related Documentation

### Backend Documentation

- [Exercise Instructions Refactoring Plan](../../../../../backend/.github/docs/EXERCISE_INSTRUCTIONS_REFACTORING_PLAN.md)
- [Exercise Instructions Refactoring Status](../../../../../backend/.github/docs/EXERCISE_INSTRUCTIONS_REFACTORING_STATUS.md)

### API Documentation

- Swagger UI: http://localhost:8000/docs
- Endpoint: `GET /api/v1/exercises/{exercise_id}`
- Endpoint: `GET /api/v1/exercises/items/{item_id}`

### Frontend Architecture

- [Frontend Architecture Guide](../../../.github/instructions/architecture.md)
- [Interface Design Patterns](../../../.github/instructions/interface-design.md)

---

## Conclusion

The backend has successfully implemented item-level instructions with full backward compatibility. The frontend requires updates to leverage this new capability, but the changes are straightforward and low-risk due to the fallback mechanism.

### Key Takeaways

1. **Backend Ready:** Item-level instructions fully implemented and tested
2. **Frontend Gap:** Still using legacy exercise-level pattern
3. **Low Risk:** Fallback strategy ensures backward compatibility
4. **Effort:** 4-6 hours of development + testing
5. **Value:** Enables item-specific guidance and customization

### Next Steps

1. Review and approve this migration plan
2. Implement Phase 1-3 changes
3. Test thoroughly with various exercise configurations
4. Deploy to development environment
5. Gather feedback from therapists
6. Plan content migration (if desired)

---

**Report Prepared By:** GitHub Copilot  
**Review Status:** Pending  
**Last Updated:** January 7, 2026  
**Version:** 1.0
