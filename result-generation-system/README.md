# Result Sheet Creation & Generation — redesign

Matches result-sheet creation/generation to all 9 sample layouts:

| Image | Class type            | Report style   |
|-------|------------------------|----------------|
| 1     | Pre-School              | `preschool`    |
| 2     | Nursery                 | `nursery`      |
| 3     | Primary                 | `primary`      |
| 4-6   | College (JSS/SS) terms  | `standard`     |
| 7-8   | Senior (JSS/SS) terms   | `standard`     |
| 9     | Midterm (any class)     | `midterm`      |

The PDF *rendering* side (`pdf-generator.tsx`) already matched these
templates closely. The real gap was the **teacher's result-creation form**,
which was one generic CAT1/CAT2/Examination score grid regardless of class
— it had no way to actually produce checklist data, rated-domain data,
midterm data, or the extra bio fields the templates need. This patch closes
that gap end-to-end, plus fixes a few bugs found along the way.

## Files changed

### `src/app/teacher/results/page.tsx` (main change)
- **Added "Midterm" as a selectable Result Type** — previously impossible
  to create, so the Image 9 layout could never actually be generated.
  New 1st/2nd C.A. inputs (max 10 each), graded on a 0–100% conversion
  against the Midterm grading scale.
- **Preschool** (`getReportStyle` resolves to `preschool`): the Scores tab
  is replaced by a new `ChecklistEditor` — tap E / S / N per skill, grouped
  by domain, matching Image 1. Numeric scoring and Affective/Psychomotor
  tables are skipped entirely for this class type.
- **Nursery**: Scores tab simplified to a single C.A. (max 40) + Exam
  (max 60) field per subject (previously forced the CAT1/CAT2 breakdown
  meant for JSS/SS). The Report tab's Affective/Psychomotor tables are
  replaced with a new `RatedDomainEditor` (4-3-2-1 per item), matching
  Image 2.
- **Primary**: same simplified C.A./Exam fields as Nursery, but keeps the
  Affective/Psychomotor tables (matches Image 3).
- **Standard (JSS/SS)**: unchanged CAT1/CAT2/Examination breakdown, plus a
  new **Grading Scale** selector (Standard A–F vs. Genius A1–F9) so a
  teacher can pick which of Images 4-8's scales applies.
- **New bio fields**, shown contextually per class type: Gender, Date of
  Birth, Height, Weight, Favourite Colour, Class Size (preschool only).
- **Wired up `hydrateResultForPdf`** on download, so the PDF's class
  min/max/avg, subject position, prior-term columns, and session average
  actually populate (see bug fix below).

### `src/lib/services/result-stats.ts`
- These class-stats functions (`fetchClassSubjectStats`,
  `fetchPriorTermTotals`, `computeSessionAverage`) were fully written but
  **never called anywhere** in the app — every PDF showed "—" for class
  min/max/avg, subject position, and prior-term columns.
- Added `hydrateResultForPdf(result)`: fetches and merges all of the above
  into a result just before PDF generation. Best-effort — any failure just
  returns the original result unchanged rather than blocking the download.

### `src/app/admin/results/page.tsx`
- Wired `hydrateResultForPdf` into the admin "Download PDF" button too.

### `src/lib/services/pdf-generator.tsx`
- Fixed the Midterm report's "% Total" column, which was echoing the raw
  (out of 20) score instead of converting it to a percentage.

### `src/lib/services/results.ts`
- `dob`, `classSize`, and `sessionAverage` were typed on `Result` but
  silently dropped on the way to/from the backend's `extra_data` JSON blob
  — added them to `mapResult` / `buildExtraData` so they round-trip.

### `src/lib/types/index.ts`
- Added `dob?: string` to the `Result` interface (previously only accessed
  via an `as any` cast in the PDF generator).

## Not changed / out of scope
- Parent's results page doesn't generate PDFs directly, so nothing to wire
  there.
- The overall per-result grade badge (`overall_grade`) is still computed
  server-side on a fixed A–F scale regardless of the chosen
  `gradingScaleVariant` — only per-subject grades and the printed grade-key
  box reflect the WAEC/Genius choice. Changing the server-side overall
  grade to respect the variant would need a small backend change; flagging
  it here in case you want it, but left out to keep this patch focused on
  the creation/generation gap you asked about.

## To apply

Copy the files under `frontend/src/...` over the matching paths in
`result-generation-system/`. No new dependencies, no backend changes, no
migrations — everything rides on the existing `extra_data` JSONB column.