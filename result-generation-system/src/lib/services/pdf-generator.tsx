/**
 * pdf-generator.tsx
 *
 * Pure jsPDF-based result sheet generator.
 * Zero dependency on @react-pdf/renderer — avoids the
 * "Cannot read properties of undefined (reading 'hasOwnProperty')" crash.
 *
 * DROP THIS FILE INTO:  src/lib/services/pdf-generator.tsx
 *
 * Usage (unchanged from before):
 *   import { downloadResultPDF } from "@/lib/services/pdf-generator";
 *   await downloadResultPDF(result);
 *
 * Also exports generateResultPDF(result) → Promise<Blob>
 */

import { Result, GRADING_SCALE, AFFECTIVE_TRAITS, PSYCHOMOTOR_SKILLS, RATING_SCALE_NOTES } from "@/lib/types";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

/** Always returns a trimmed string, never null / undefined / number leaking */
const s = (v: unknown, fallback = "—"): string => {
  if (v === null || v === undefined) return fallback;
  const out = String(v).trim();
  return out === "" ? fallback : out;
};

function ordinal(n: number): string {
  const sfx = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
}

// ─── school defaults ──────────────────────────────────────────────────────────

export interface SchoolInfo {
  name: string;
  motto?: string;
  address?: string;
}

export const DEFAULT_SCHOOL: SchoolInfo = {
  name:    "CHRIST IS THE ANSWER GROUP OF SCHOOLS",
  motto:   "Motto: KNOWLEDGE IS FREEDOM",
  address: "Idumegan Quarters, Ekpoma, Edo State.",
};

// ─── colour constants ─────────────────────────────────────────────────────────
const C_PRIMARY   = "#1f3d2e";   // dark green header
const C_HEADER_BG = "#f3d9b1";   // cream summary header
const C_WHITE     = "#ffffff";
const C_LIGHT     = "#f9f9f9";
const C_BORDER    = "#bbbbbb";
const C_TEXT      = "#111111";
const C_MUTED     = "#555555";

// hex → [r,g,b]
function hex2rgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

export async function generateResultPDF(
  result: Result,
  school: SchoolInfo = DEFAULT_SCHOOL
): Promise<Blob> {
  // Dynamic import so Next.js SSR doesn't choke
  const jsPDFModule = await import("jspdf");
  // jsPDF may be a default export or named
  const JsPDF =
    (jsPDFModule as any).default ?? (jsPDFModule as any).jsPDF ?? jsPDFModule;
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = 210;   // page width mm
  const PH = 297;   // page height mm
  const ML = 14;    // margin left
  const MR = 14;    // margin right
  const CW = PW - ML - MR;  // content width
  let y = 14;       // current Y cursor

  // ── helpers ──────────────────────────────────────────────────────────────────

  const setColor = (hex: string) => {
    const [r, g, b] = hex2rgb(hex);
    doc.setTextColor(r, g, b);
  };

  const setFillColor = (hex: string) => {
    const [r, g, b] = hex2rgb(hex);
    doc.setFillColor(r, g, b);
  };

  const setDrawColor = (hex: string) => {
    const [r, g, b] = hex2rgb(hex);
    doc.setDrawColor(r, g, b);
  };

  const rect = (x: number, yy: number, w: number, h: number, fill: string, stroke?: string) => {
    setFillColor(fill);
    if (stroke) {
      setDrawColor(stroke);
      doc.rect(x, yy, w, h, "FD");
    } else {
      doc.rect(x, yy, w, h, "F");
    }
  };

  const text = (
    txt: string,
    x: number,
    yy: number,
    opts: { align?: "left" | "center" | "right"; maxWidth?: number } = {}
  ) => {
    doc.text(txt, x, yy, opts as any);
  };

  const line = (x1: number, y1: number, x2: number, y2: number, color = C_BORDER) => {
    setDrawColor(color);
    doc.line(x1, y1, x2, y2);
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > PH - 14) {
      doc.addPage();
      y = 14;
    }
  };

  // ── HEADER ────────────────────────────────────────────────────────────────

  // Background band
  rect(ML, y, CW, 22, "#f0f4f0");

  // School name
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  setColor(C_PRIMARY);
  text(s(school.name), PW / 2, y + 7, { align: "center" });

  if (school.motto) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    setColor(C_MUTED);
    text(s(school.motto), PW / 2, y + 12, { align: "center" });
  }
  if (school.address) {
    doc.setFontSize(7);
    text(s(school.address), PW / 2, y + 16, { align: "center" });
  }

  y += 24;

  // Report title
  const isMidterm = result.resultType === "Midterm";
  const titleText = isMidterm
    ? `MID TERM REPORT — ${s(result.term).toUpperCase()} TERM`
    : `${s(result.term).toUpperCase()} TERM STUDENT'S PERFORMANCE REPORT`;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  setColor(C_PRIMARY);
  text(titleText, PW / 2, y, { align: "center" });
  y += 3;
  line(ML, y, ML + CW, y, C_PRIMARY);
  y += 4;

  // ── STUDENT INFO BAR ──────────────────────────────────────────────────────

  rect(ML, y, CW, 16, "#f5f5f5", C_BORDER);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(C_TEXT);

  const col1 = ML + 3;
  const col2 = ML + CW * 0.38;
  const col3 = ML + CW * 0.70;
  const r1y  = y + 5;
  const r2y  = y + 11;

  // Row 1
  doc.setFont("helvetica", "bold");
  text("Name:", col1, r1y);
  doc.setFont("helvetica", "normal");
  text(s(result.studentName), col1 + 12, r1y);

  doc.setFont("helvetica", "bold");
  text("Class:", col2, r1y);
  doc.setFont("helvetica", "normal");
  text(s(result.class), col2 + 11, r1y);

  doc.setFont("helvetica", "bold");
  text("Session:", col3, r1y);
  doc.setFont("helvetica", "normal");
  text(s(result.session), col3 + 16, r1y);

  // Row 2
  doc.setFont("helvetica", "bold");
  text("Adm No:", col1, r2y);
  doc.setFont("helvetica", "normal");
  text(s(result.admissionNumber), col1 + 15, r2y);

  doc.setFont("helvetica", "bold");
  text("Age:", col2, r2y);
  doc.setFont("helvetica", "normal");
  text(s((result as any).age), col2 + 8, r2y);

  doc.setFont("helvetica", "bold");
  text("House:", col3, r2y);
  doc.setFont("helvetica", "normal");
  text(s(result.house), col3 + 13, r2y);

  y += 19;

  // ── SUBJECTS TABLE ─────────────────────────────────────────────────────────

  checkPageBreak(30);

  // Column widths (total = CW)
  const COL = {
    subject: CW * 0.28,
    cat1:    CW * 0.09,
    cat2:    CW * 0.09,
    exam:    CW * 0.09,
    total:   CW * 0.09,
    grade:   CW * 0.08,
    pos:     CW * 0.09,
    remark:  CW * 0.19,
  };

  const ROW_H = 6;
  const TH_H  = 7;

  // Table header
  let cx = ML;
  rect(cx, y, CW, TH_H, C_PRIMARY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(C_WHITE);

  const headers = ["Subject", "CAT 1", "CAT 2", "EXAM", "Total", "Grade", "Position", "Remark"];
  const widths  = Object.values(COL);
  headers.forEach((h, i) => {
    const cx2 = cx + widths.slice(0, i).reduce((a, b) => a + b, 0);
    text(h, cx2 + widths[i] / 2, y + TH_H - 1.5, { align: "center" });
  });
  y += TH_H;

  // Rows
  const subjects = result.subjects ?? [];
  subjects.forEach((sub, idx) => {
    checkPageBreak(ROW_H + 2);
    const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
    rect(ML, y, CW, ROW_H, bg, C_BORDER);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(C_TEXT);

    let xx = ML;
    const subAny = sub as any;
    const cells = [
      s(sub?.name, "Subject"),
      s(subAny?.cat1 != null ? subAny.cat1 : ""),
      s(subAny?.cat2 != null ? subAny.cat2 : ""),
      s(subAny?.exam != null ? subAny.exam : ""),
      s(sub?.score),
      s(sub?.grade),
      "—",
      s(sub?.remark),
    ];
    widths.forEach((w, i) => {
      const align = i === 0 || i === 7 ? "left" : "center";
      const tx = align === "center" ? xx + w / 2 : xx + 2;
      text(cells[i], tx, y + ROW_H - 1.5, { align });
      xx += w;
    });
    y += ROW_H;
  });

  // Table bottom border
  line(ML, y, ML + CW, y);
  y += 5;

  // ── TWO COLUMN SECTION ────────────────────────────────────────────────────

  checkPageBreak(60);

  const leftW  = CW * 0.62;
  const rightW = CW * 0.36;
  const gap    = CW * 0.02;

  const leftX  = ML;
  const rightX = ML + leftW + gap;

  let leftY  = y;
  let rightY = y;

  // ── LEFT: Summary ─────────────────────────────────────────────────────────

  const summaryTitle = isMidterm ? "Mid Term Performance Summary" : "Performance Summary";
  rect(leftX, leftY, leftW, 6, C_HEADER_BG, C_BORDER);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(C_PRIMARY);
  text(summaryTitle, leftX + leftW / 2, leftY + 4, { align: "center" });
  leftY += 6;

  const totalObtainable = subjects.length * 100;
  const summaryRows = [
    ["Total Obtainable",     String(totalObtainable)],
    ["Total Obtained",       s(result.totalScore, "0")],
    ["Total Subjects",       String(subjects.length)],
    ["Average %",            result.averageScore != null ? result.averageScore.toFixed(1) + "%" : "—"],
    ["Overall Grade",        s(result.overallGrade)],
    ["Position in Class",    result.position ? ordinal(result.position) : "N/A"],
  ];

  summaryRows.forEach(([label, val], idx) => {
    const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
    rect(leftX, leftY, leftW, 5.5, bg, C_BORDER);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(C_TEXT);
    text(label, leftX + 3, leftY + 3.8);
    doc.setFont("helvetica", "bold");
    text(val, leftX + leftW - 3, leftY + 3.8, { align: "right" });
    leftY += 5.5;
  });
  leftY += 4;

  // ── LEFT: Affective Domain ────────────────────────────────────────────────

  if (!isMidterm) {
    checkPageBreak(10);
    const drawRatingTable = (
      startX: number,
      startY: number,
      width: number,
      title: string,
      labels: readonly string[],
      ratings: Record<string, number> | undefined
    ): number => {
      rect(startX, startY, width, 6, C_PRIMARY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(C_WHITE);
      text(title, startX + width * 0.30, startY + 4);

      // Column headers: 5 4 3 2 1
      const labelW = width * 0.60;
      const numW   = width * 0.08;
      [5, 4, 3, 2, 1].forEach((n, i) => {
        text(String(n), startX + labelW + numW * i + numW / 2, startY + 4, { align: "center" });
      });
      startY += 6;

      labels.forEach((label, idx) => {
        const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
        rect(startX, startY, width, 5, bg, C_BORDER);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        setColor(C_TEXT);
        text(s(label), startX + 2, startY + 3.5);

        const val = ratings?.[label] ?? 0;
        [5, 4, 3, 2, 1].forEach((n, i) => {
          const cx2 = startX + labelW + numW * i + numW / 2;
          if (val === n) {
            doc.setFont("helvetica", "bold");
            setColor(C_PRIMARY);
            text("✓", cx2, startY + 3.5, { align: "center" });
            doc.setFont("helvetica", "normal");
            setColor(C_TEXT);
          }
        });
        startY += 5;
      });
      return startY + 2;
    };

    leftY = drawRatingTable(leftX, leftY, leftW, "Affective Domain", AFFECTIVE_TRAITS, result.affectiveDomain);
    checkPageBreak(10);
    leftY = drawRatingTable(leftX, leftY, leftW, "Psychomotor Skills", PSYCHOMOTOR_SKILLS, result.psychomotorSkills);
  }

  // ── RIGHT: Attendance ─────────────────────────────────────────────────────

  rect(rightX, rightY, rightW, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(C_WHITE);
  text("Attendance", rightX + rightW / 2, rightY + 4, { align: "center" });
  rightY += 6;

  const att = result.attendance ?? { opened: 0, present: 0, absent: 0 };
  const attRows = [
    ["School Days",  String(att.opened  ?? 0)],
    ["Present",      String(att.present ?? 0)],
    ["Absent",       String(att.absent  ?? 0)],
  ];
  attRows.forEach(([label, val], idx) => {
    const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
    rect(rightX, rightY, rightW, 5.5, bg, C_BORDER);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(C_TEXT);
    text(label, rightX + 2, rightY + 3.8);
    doc.setFont("helvetica", "bold");
    text(val, rightX + rightW - 2, rightY + 3.8, { align: "right" });
    rightY += 5.5;
  });
  rightY += 4;

  // ── RIGHT: Grading Scale ──────────────────────────────────────────────────

  rect(rightX, rightY, rightW, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(C_WHITE);
  text("Grading Scale", rightX + rightW / 2, rightY + 4, { align: "center" });
  rightY += 6;

  GRADING_SCALE.forEach(({ min, max, grade, remark }, idx) => {
    const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
    rect(rightX, rightY, rightW, 5, bg, C_BORDER);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(C_PRIMARY);
    text(grade, rightX + 3, rightY + 3.5);
    doc.setFont("helvetica", "normal");
    setColor(C_TEXT);
    text(`(${min}–${max}%) ${remark}`, rightX + 9, rightY + 3.5);
    rightY += 5;
  });
  rightY += 4;

  // ── RIGHT: Rating Legend (exam only) ──────────────────────────────────────

  if (!isMidterm) {
    rect(rightX, rightY, rightW, 6, C_PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(C_WHITE);
    text("Rating Key", rightX + rightW / 2, rightY + 4, { align: "center" });
    rightY += 6;

    rect(rightX, rightY, rightW, RATING_SCALE_NOTES.length * 5 + 2, C_WHITE, C_BORDER);
    RATING_SCALE_NOTES.forEach((note, idx) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      setColor(C_TEXT);
      text(s(note), rightX + 2, rightY + 3.5 + idx * 5);
    });
    rightY += RATING_SCALE_NOTES.length * 5 + 4;
  }

  // Advance main y past both columns
  y = Math.max(leftY, rightY) + 4;

  // ── COMMENTS ─────────────────────────────────────────────────────────────

  checkPageBreak(28);

  const commentBoxH = 22;

  const drawCommentBox = (title: string, comment: string, startY: number): number => {
    rect(ML, startY, CW, 5.5, C_PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setColor(C_WHITE);
    text(title, ML + 3, startY + 3.8);
    startY += 5.5;

    rect(ML, startY, CW, commentBoxH, C_WHITE, C_BORDER);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(C_TEXT);

    // Word-wrap the comment
    const wrapped = doc.splitTextToSize(s(comment, ""), CW - 6);
    wrapped.slice(0, 3).forEach((line: string, i: number) => {
      text(line, ML + 3, startY + 5 + i * 5);
    });

    doc.setFontSize(7);
    setColor(C_MUTED);
    text("Sign: ______________________", ML + CW - 3, startY + commentBoxH - 3, { align: "right" });

    return startY + commentBoxH + 3;
  };

  y = drawCommentBox("Class Teacher's Remark", s(result.teacherComment), y);
  checkPageBreak(28);
  y = drawCommentBox("Principal's Remark", s(result.principalComment), y);

  // ── NEXT TERM ROW ─────────────────────────────────────────────────────────

  checkPageBreak(12);
  y += 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(C_TEXT);
  const nextLabel = result.term === "Third" ? "Next Session" : "Next Term";
  text(`${nextLabel} Begins: ____________________`, ML, y);
  text(`Date: ${new Date().toLocaleDateString()}`, ML + CW, y, { align: "right" });
  y += 5;

  // ── FOOTER ────────────────────────────────────────────────────────────────

  line(ML, PH - 12, ML + CW, PH - 12);
  doc.setFontSize(6.5);
  setColor(C_MUTED);
  text(
    `${s(school.name)} © ${new Date().getFullYear()} • Generated ${new Date().toLocaleDateString()}`,
    PW / 2,
    PH - 8,
    { align: "center" }
  );

  return doc.output("blob");
}

// ─── Public download helper ───────────────────────────────────────────────────

export async function downloadResultPDF(
  result: Result,
  school: SchoolInfo = DEFAULT_SCHOOL
): Promise<void> {
  const blob = await generateResultPDF(result, school);
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = s(result.studentName, "Student").replace(/\s+/g, "_");
  const safeSess = s(result.session).replace(/\//g, "-");
  link.href     = url;
  link.download = `${safeName}_${s(result.term)}_${s(result.resultType)}_${safeSess}.pdf`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}