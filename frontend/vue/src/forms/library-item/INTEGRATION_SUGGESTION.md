# Library Items Form - Exercise Instructions Integration

## Current State Analysis

### Backend Data Model

**ExerciseItem (Library Item)**:

```python
class ExerciseItem:
    exercise_id: UUID | None  # None for library items
    is_library_item: bool = False
    item_type: ExerciseItemType
    display_order: int = 0

    instruction_id: UUID | None = None  # ⚠️ FK to ExerciseInstructions
    repetitions: int | None = None
    duration_seconds: int | None = None
    metadata: dict | None = None

    # Relationships
    instruction: ExerciseInstructions | None = None  # Eager-loaded
    contents: list[ExerciseItemContent] = []  # Multi-language content
```

**ExerciseInstructions** (Separate entity):

```python
class ExerciseInstructions:
    exercise_id: UUID  # ⚠️ Belongs to an Exercise, NOT an item
    language: str = "de"
    hint_text: str | None
    explanation_text: str | None
    safety_notes: str | None
    audio_instruction_url: str | None
    image_url: str | None
    display_order: int = 0
```

### Key Discovery: Architecture Mismatch

**The Problem:**

1. **Library Items** (`ExerciseItem` with `is_library_item=True`) have an `instruction_id` field
2. **ExerciseInstructions** are tied to **Exercises** (via `exercise_id`), not individual items
3. The relationship is **exercise → instructions** and **item → instruction_id** (FK reference)
4. Library items exist **independently** of exercises (`exercise_id=None`)

**This creates a logical inconsistency:**

- Library items can reference `instruction_id`, but instructions belong to exercises
- Library items have no `exercise_id`, so they can't have their own instructions
- The `instruction_id` on library items likely references instructions from other exercises

---

## Integration Strategies

### Strategy 1: ⭐ **Instruction ID as Optional Reference (Recommended)**

**Concept:** Treat `instruction_id` as an optional FK reference to existing exercise instructions. Library items don't "own" instructions but can reference them.

**Implementation:**

```typescript
// library-item.types.ts
export interface LibraryItemFormData {
  item_type: LibraryItemType
  display_order: number
  repetitions: number | null
  duration_seconds: number | null
  instruction_id: string | null // Optional FK reference
  contents: LibraryItemContentFormData[]
}

// Add instruction lookup helper
export interface InstructionReference {
  id: string
  language: string
  hint_text: string | null
  preview: string // First 50 chars of hint_text
  exercise_title: string // For context
}
```

**Form Changes:**

```vue
<!-- LibraryItemForm.vue -->
<Fieldset :legend="loc.t('libraryItems.form.sections.instruction')">
  <div class="flex flex-col gap-2">
    <label for="instruction-id" class="font-medium">
      {{ loc.t('libraryItems.form.fields.instructionId') }}
    </label>
    <small class="text-surface-500">
      {{ loc.t('libraryItems.form.hints.instructionId') }}
    </small>
    
    <!-- Autocomplete search for existing instructions -->
    <AutoComplete
      id="instruction-id"
      v-model="selectedInstruction"
      :suggestions="instructionSuggestions"
      option-label="preview"
      :placeholder="loc.t('libraryItems.form.placeholders.instructionId')"
      :disabled="isReadonly"
      @complete="searchInstructions"
      @change="handleInstructionSelect"
    >
      <template #option="{ option }">
        <div class="flex flex-col gap-1">
          <span class="font-medium">{{ option.preview }}</span>
          <span class="text-sm text-surface-500">
            {{ option.exercise_title }} ({{ option.language }})
          </span>
        </div>
      </template>
    </AutoComplete>
    
    <!-- Show clear button if instruction selected -->
    <Button
      v-if="formData.instruction_id"
      label="Clear"
      icon="pi pi-times"
      text
      size="small"
      @click="clearInstruction"
    />
  </div>
</Fieldset>
```

**API Integration:**

```typescript
// Add to exercises.api.ts or create instructions.api.ts
export interface InstructionsApi {
  /**
   * Search instructions across all exercises
   * GET /api/v1/exercises/instructions/search?q=...
   */
  searchInstructions(query: string, language?: string): Promise<InstructionReference[]>

  /**
   * Get instruction by ID
   * GET /api/v1/exercises/instructions/{id}
   */
  getInstruction(id: string): Promise<ExerciseInstructions>
}
```

**Localization:**

```typescript
// en/libraryItems.ts
form: {
  sections: {
    instruction: 'Instruction Reference',
  },
  hints: {
    instructionId: 'Optionally link to an existing exercise instruction for guidance',
  },
  placeholders: {
    instructionId: 'Search instructions by text...',
  },
}
```

**Pros:**

- ✅ Matches current backend schema
- ✅ Simple implementation
- ✅ Clear separation of concerns
- ✅ No backend changes needed

**Cons:**

- ⚠️ Instructions tied to exercises may be confusing
- ⚠️ Doesn't allow library items to have their own standalone instructions

---

### Strategy 2: **Instruction ID as UUID String (Simple)**

**Concept:** Treat `instruction_id` as a simple UUID string input. Don't enforce relationships in the UI.

**Implementation:**

```vue
<div class="flex flex-col gap-2">
  <FloatLabel variant="on">
    <InputText
      id="instruction-id"
      v-model="formData.instruction_id"
      :disabled="isReadonly"
      :invalid="hasFieldError('instruction_id')"
      class="w-full"
      @input="markDirty"
      @blur="handleFieldBlur('instruction_id')"
    />
    <label for="instruction-id">
      {{ loc.t('libraryItems.form.fields.instructionId') }}
    </label>
  </FloatLabel>
  <small class="text-surface-500">
    {{ loc.t('libraryItems.form.hints.instructionIdSimple') }}
  </small>
</div>
```

**Localization:**

```typescript
hints: {
  instructionIdSimple: 'UUID of an exercise instruction (optional, advanced)',
}
```

**Pros:**

- ✅ Simplest implementation
- ✅ No API dependencies
- ✅ Fast to implement

**Cons:**

- ❌ Poor UX - users must know instruction UUIDs
- ❌ No validation of instruction existence
- ❌ Easy to make errors

---

### Strategy 3: **Hide Instruction Field** (Minimal)

**Concept:** Remove the instruction field from the form entirely since it's unclear how it should be used.

**Implementation:**

Remove instruction_id from form, only include in API payload if provided via other means (e.g., when attaching library item to exercise).

**Pros:**

- ✅ Simplest UI
- ✅ Avoids confusion

**Cons:**

- ❌ Field exists in backend but can't be set
- ❌ May limit functionality

---

## Recommended Approach

### Phase 1: **Implement Strategy 2 (Simple UUID Input)** - IMMEDIATE

For the current Phase 3 implementation:

1. Keep `instruction_id` as a simple text input (UUID)
2. Add validation to ensure it's a valid UUID format if provided
3. Add hint text explaining it's optional and advanced
4. Mark field as "Advanced" or put in a collapsible section

**Reasoning:**

- Fastest to implement (already mostly done)
- Doesn't block form completion
- Doesn't require new backend endpoints
- Can be enhanced later

### Phase 2: **Implement Strategy 1 (Instruction Lookup)** - FUTURE ENHANCEMENT

After Phase 3-5 complete:

1. Create backend endpoint: `GET /api/v1/exercises/instructions/search`
2. Implement instruction search/autocomplete
3. Show instruction preview with exercise context
4. Add instruction viewing capability

**Backend Changes Needed:**

```python
# backend/src/api/endpoints/exercise/exercises.py

@router.get(
    "/instructions/search",
    response_model=list[InstructionReferenceResponse],
    summary="Search instructions",
)
async def search_instructions(
    service: Annotated[ExerciseService, Depends(get_exercise_service)],
    q: str = Query(..., min_length=2, description="Search query"),
    language: str | None = Query(None, description="Filter by language"),
    limit: int = Query(20, ge=1, le=50),
) -> list[InstructionReferenceResponse]:
    """Search exercise instructions across all exercises."""
    # Implementation using instruction repository
    pass
```

---

## Current Form Implementation

### What's Already Done:

```vue
<!-- LibraryItemForm.vue - Basic Information Section -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div class="flex flex-col gap-2">
    <FloatLabel variant="on">
      <InputNumber id="display-order" v-model="formData.display_order" ... />
      <label for="display-order">Display Order *</label>
    </FloatLabel>
  </div>

  <div class="flex flex-col gap-2">
    <FloatLabel variant="on">
      <InputText id="instruction-id" v-model="formData.instruction_id" ... />
      <label for="instruction-id">Instruction ID</label>
    </FloatLabel>
  </div>
</div>
```

### What Needs Adjustment:

1. **Validation:** Add UUID format validation to schema
2. **Hints:** Add helper text explaining the field
3. **Optional:** Move to collapsible "Advanced" section

---

## Action Items

### Immediate (Phase 3):

- [x] Keep current simple text input for instruction_id
- [ ] Add UUID validation to `library-item.schema.ts`
- [ ] Add hint text to localization files
- [ ] Make field optional and clearly marked
- [ ] Consider moving to "Advanced Options" fieldset

### Future (Post Phase 5):

- [ ] Create instruction search backend endpoint
- [ ] Implement AutoComplete component
- [ ] Add instruction preview/details modal
- [ ] Update form to use instruction lookup

---

## Validation Schema Update

```typescript
// library-item.schema.ts
export function createLibraryItemSchema(
  validationStore: ValidationStore
): Yup.ObjectSchema<LibraryItemFormData> {
  return Yup.object({
    // ... existing fields ...

    instruction_id: Yup.string()
      .nullable()
      .test('is-uuid', validationStore.t('validation.uuidFormat'), (value) => {
        if (!value) return true // Optional field
        // UUID v4 regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(value)
      }),

    // ... rest of schema ...
  })
}
```

---

## Summary

**Current implementation is acceptable** with the simple text input approach. The field works correctly with the backend schema. For better UX, we should:

1. ✅ Add UUID validation
2. ✅ Add helper text explaining the field
3. ✅ Make it clearly optional
4. 🔜 Consider instruction search/lookup in future iteration

This allows us to complete Phase 3 without backend changes while keeping the door open for UX improvements later.
