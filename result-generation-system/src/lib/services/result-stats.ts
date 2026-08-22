/**
 * result-stats.ts
 *
 * On-the-fly stats for the result sheet PDFs — computed from existing
 * result rows rather than asking the teacher to type them in:
 *  - Per-subject class Min / Max / Average + this student's position in
 *    that subject (Images 3, 7, 8).
 *  - Prior terms' subject totals in the same session, for the cumulative
 *    "1st Term / 2nd Term / Session Average" columns (Images 3, 5, 6).
 *
 * Best-effort: any network failure here should degrade to "—" on the PDF,
 * never block the download.
 */

import { Result, Term } from '../types';
import { resultsService } from './results';

export interface SubjectStat {
  min?: number;
  max?: number;
  avg?: number;
  position?: number;
}

export type SubjectStatsMap = Record<string, SubjectStat>;

const TERM_ORDER: Term[] = ['First', 'Second', 'Third'];

/**
 * For every subject on `subjects`, compute the class min/max/avg score and
 * this student's rank, using all *other* results in the same
 * class/term/session/resultType (siblingResults should already exclude or
 * include the current result — either is fine, it's de-duped by studentId).
 */
export function computeClassSubjectStats(
  studentId: string,
  subjects: { name: string; score: number }[],
  siblingResults: Result[]
): SubjectStatsMap {
  const stats: SubjectStatsMap = {};

  subjects.forEach((subj) => {
    // One score per student for this subject (last result wins if duplicates)
    const scoresByStudent = new Map<string, number>();
    siblingResults.forEach((r) => {
      const match = r.subjects?.find((s) => s.name === subj.name);
      if (match && typeof match.score === 'number') {
        scoresByStudent.set(r.studentId, match.score);
      }
    });
    // Make sure this student's own score is included even if the sibling
    // fetch happened before their result was saved / indexed.
    scoresByStudent.set(studentId, subj.score);

    const scores = Array.from(scoresByStudent.values());
    if (!scores.length) return;

    const sorted = [...scores].sort((a, b) => b - a);
    const position = sorted.indexOf(subj.score) + 1;

    stats[subj.name] = {
      min: Math.min(...scores),
      max: Math.max(...scores),
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
      position: position || undefined,
    };
  });

  return stats;
}

export async function fetchClassSubjectStats(
  studentId: string,
  className: string,
  term: Term,
  session: string,
  resultType: string,
  subjects: { name: string; score: number }[]
): Promise<SubjectStatsMap> {
  try {
    const classResults = await resultsService.getResultsByClass(className, term, session);
    const sameType = classResults.filter((r) => r.resultType === resultType);
    return computeClassSubjectStats(studentId, subjects, sameType);
  } catch {
    return {};
  }
}

export interface PriorTermTotals {
  [subjectName: string]: { first?: number; second?: number };
}

/**
 * Pull this student's subject totals from earlier terms in the same
 * session (for the "1st Term" / "2nd Term" cumulative columns on Second
 * and Third term reports), plus a per-subject session average across all
 * terms available so far including the current one.
 */
export async function fetchPriorTermTotals(
  studentId: string,
  session: string,
  currentTerm: Term,
  resultType: string
): Promise<PriorTermTotals> {
  const out: PriorTermTotals = {};
  const currentIdx = TERM_ORDER.indexOf(currentTerm);
  if (currentIdx <= 0) return out; // First term has no prior terms

  try {
    const all = await resultsService.getResultsByStudent(studentId);
    const inSession = all.filter((r) => r.session === session && r.resultType === resultType);

    const byTerm: Partial<Record<Term, Result>> = {};
    inSession.forEach((r) => { byTerm[r.term] = r; });

    const firstResult = byTerm['First'];
    const secondResult = byTerm['Second'];

    firstResult?.subjects?.forEach((s) => {
      out[s.name] = { ...out[s.name], first: s.score };
    });
    secondResult?.subjects?.forEach((s) => {
      out[s.name] = { ...out[s.name], second: s.score };
    });
  } catch {
    /* best-effort — PDF just shows "—" for those columns */
  }
  return out;
}

/** Session average across all terms available (prior terms + current). */
export function computeSessionAverage(
  subjectName: string,
  currentScore: number,
  prior: PriorTermTotals
): number {
  const scores = [currentScore];
  const p = prior[subjectName];
  if (p?.first != null) scores.push(p.first);
  if (p?.second != null) scores.push(p.second);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * One-stop helper for the "Download PDF" buttons (teacher / admin / parent
 * result pages): fills in everything the stored result row doesn't carry by
 * itself — per-subject class min/max/avg + position, prior-term totals for
 * the cumulative columns, and the overall session average — so the PDF
 * actually shows those figures instead of "—". Best-effort: any failure
 * here just returns the original result unchanged rather than blocking the
 * download.
 */
export async function hydrateResultForPdf(result: Result): Promise<Result> {
  if (!result.subjects?.length) return result;
  try {
    const [subjectStats, priorTotals] = await Promise.all([
      fetchClassSubjectStats(
        result.studentId,
        result.class,
        result.term,
        result.session,
        result.resultType,
        result.subjects.map((sub) => ({ name: sub.name, score: sub.score }))
      ),
      fetchPriorTermTotals(result.studentId, result.session, result.term, result.resultType),
    ]);

    const subjects = result.subjects.map((sub) => {
      const stat = subjectStats[sub.name];
      const prior = priorTotals[sub.name];
      return {
        ...sub,
        classMin: stat?.min ?? sub.classMin,
        classMax: stat?.max ?? sub.classMax,
        classAvg: stat?.avg != null ? Number(stat.avg.toFixed(1)) : sub.classAvg,
        subjectPosition: stat?.position ?? sub.subjectPosition,
        prevTerm1Total: prior?.first ?? sub.prevTerm1Total,
        prevTerm2Total: prior?.second ?? sub.prevTerm2Total,
      };
    });

    const avgs = subjects.map((sub) => computeSessionAverage(sub.name, sub.score, priorTotals));
    const sessionAverage = avgs.length
      ? avgs.reduce((a, b) => a + b, 0) / avgs.length
      : result.sessionAverage;

    return { ...result, subjects, sessionAverage };
  } catch {
    return result;
  }
}