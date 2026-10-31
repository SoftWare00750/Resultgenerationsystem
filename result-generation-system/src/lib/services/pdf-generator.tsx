/**
 * pdf-generator.tsx
 *
 * jsPDF-based result-sheet generator. Renders a different layout depending
 * on the class category / result type (see `getReportStyle`):
 *
 *   preschool -> Image 1  (E/S/N skills checklist, no scores)
 *   nursery   -> Image 2  (scored subjects + 4-3-2-1 rated domains)
 *   primary   -> Image 3  (scored subjects w/ session avg + affective/psychomotor)
 *   standard  -> Images 4-8 (JSS/SS: CA+Exam scoring, affective/psychomotor,
 *                            optional prior-term columns & class min/max/avg)
 *   midterm   -> Image 9  (1st/2nd CA only, grade-analysis frequency table)
 */

import {
  Result,
  Subject,
  GRADING_SCALE,
  CAT_GRADING_SCALE,
  AFFECTIVE_TRAITS,
  PSYCHOMOTOR_SKILLS,
  RATING_SCALE_NOTES,
  getReportStyle,
  ReportStyle,
  ChecklistDomain,
  ChecklistMark,
  CHECKLIST_MARK_KEY,
  buildDefaultChecklist,
  RatedDomain,
  NURSERY_RATING_KEY,
  buildDefaultRatedDomains,
  GRADING_SCALE_VARIANTS,
  WAEC_GRADING_SCALE,
  MIDTERM_GRADING_SCALE,
} from "@/lib/types";
import { getSchoolInfo, getSignatures, getStore, KEYS } from "@/lib/storage";

// ─── tiny helpers ─────────────────────────────────────────────────────────────

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

// hex → [r,g,b]
function hex2rgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

// ─── colour constants ─────────────────────────────────────────────────────────
// Palette follows the school's printed mid-term sheet: cream page, navy labels,
// dark-grey table header, pink data cells and a pink student card.
const C_PRIMARY   = "#1f2a7a"; // navy – labels, section titles, bars
const C_HEADER_BG = "#f6cdd2"; // soft pink title strips
const C_WHITE     = "#ffffff";
const C_LIGHT     = "#fff1f2";
const C_BORDER    = "#e3c2c7";
const C_TEXT      = "#161626";
const C_MUTED     = "#5a5a6a";
const C_PANEL     = "#eaa7a7"; // student card
const C_PANEL2    = "#dce7f5"; // blue accent panel
const C_PAGE      = "#fdfcec"; // cream paper
const C_FRAME     = "#4a4a4a"; // page frame
const C_TH        = "#6d6d6d"; // table header
const C_CELL      = "#fde4e7"; // score cells
const C_ROW_A     = "#fffef4"; // subject / label cells
const C_ROW_B     = "#fff3f4";
const C_STAMP     = "#2b3f9c"; // stamp ink

// ─── Resolve student photo from local storage ─────────────────────────────────

function getStudentPhoto(admissionNumber: string): string | null {
  try {
    const backup = JSON.parse(localStorage.getItem("system_students_backup") || "[]");
    const match = backup.find((s: any) => s.admissionNumber === admissionNumber && s.photo);
    if (match?.photo) return match.photo;
    const students = getStore<any>(KEYS.students);
    const s2 = students.find((s: any) => s.admissionNumber === admissionNumber && s.photo);
    return s2?.photo || null;
  } catch {
    return null;
  }
}

function getTeacherSignature(createdBy: string): string | null {
  return getSignatures()[createdBy] || null;
}

function getTeacherName(createdBy: string): string | undefined {
  try {
    const users = getStore<any>(KEYS.users);
    const u = users.find((u: any) => u.$id === createdBy);
    return u?.name;
  } catch {
    return undefined;
  }
}

function getPrincipalSignature(): string | null {
  const sigs = getSignatures();
  const users = getStore<any>(KEYS.users);
  const admin = users.find((u: any) => u.role === "admin");
  if (admin) return sigs[admin.$id] || null;
  return sigs["admin-001"] || null;
}

function getPrincipalName(): string | undefined {
  try {
    const users = getStore<any>(KEYS.users);
    return users.find((u: any) => u.role === "admin")?.name;
  } catch {
    return undefined;
  }
}

function safeAddImage(doc: any, dataUrl: string, x: number, y: number, w: number, h: number): boolean {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:")) return false;
    const fmt = dataUrl.includes("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(dataUrl, fmt, x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

// ─── Drawing context shared by every renderer ─────────────────────────────────

interface Ctx {
  doc: any;
  PW: number; PH: number; ML: number; MR: number; CW: number;
  setColor: (hex: string) => void;
  setFill:  (hex: string) => void;
  setDraw:  (hex: string) => void;
  rect: (x: number, y: number, w: number, h: number, fill: string, stroke?: string) => void;
  text: (txt: string, x: number, y: number, opts?: { align?: "left" | "center" | "right"; angle?: number }) => void;
  line: (x1: number, y1: number, x2: number, y2: number, color?: string) => void;
  /** Given the current y and the space a block needs, starts a new page (and
   *  returns the fresh top margin) if it wouldn't fit, otherwise returns y
   *  unchanged. Pure function of its arguments — no hidden state. */
  checkBreak: (y: number, needed: number) => number;
  // Legacy no-op accessors kept so any stray getY()/setY() calls don't crash.
  getY: () => number;
  setY: (y: number) => void;
}

function makeCtx(doc: any): Ctx {
  const PW = 210, PH = 297, ML = 14, MR = 14, CW = PW - ML - MR;
  let _y = 12;
  const setColor = (hex: string) => { const [r, g, b] = hex2rgb(hex); doc.setTextColor(r, g, b); };
  const setFill  = (hex: string) => { const [r, g, b] = hex2rgb(hex); doc.setFillColor(r, g, b); };
  const setDraw  = (hex: string) => { const [r, g, b] = hex2rgb(hex); doc.setDrawColor(r, g, b); };
  const rect = (x: number, y: number, w: number, h: number, fill: string, stroke?: string) => {
    setFill(fill);
    if (stroke) { setDraw(stroke); doc.rect(x, y, w, h, "FD"); } else { doc.rect(x, y, w, h, "F"); }
  };
  const text = (txt: string, x: number, y: number, opts: any = {}) => doc.text(txt, x, y, opts);
  const line = (x1: number, y1: number, x2: number, y2: number, color = C_BORDER) => { setDraw(color); doc.line(x1, y1, x2, y2); };
  const checkBreak = (y: number, needed: number) => { if (y + needed > PH - 14) { doc.addPage(); return 15; } return y; };

  // Cream paper + dark frame on every page (including pages added later).
  const paintPage = () => {
    setFill(C_PAGE); doc.rect(0, 0, PW, PH, "F");
    setDraw(C_FRAME); doc.setLineWidth(0.4); doc.rect(4, 4, PW - 8, PH - 8, "S");
    doc.setLineWidth(0.2);
  };
  paintPage();
  const origAddPage = doc.addPage.bind(doc);
  doc.addPage = (...args: any[]) => { const r = origAddPage(...args); paintPage(); return r; };

  return { doc, PW, PH, ML, MR, CW, setColor, setFill, setDraw, rect, text, line, checkBreak, getY: () => _y, setY: (v: number) => { _y = v; } };
}

// ─── Header (student card, school identity, title) ────────────────────────────

function drawHeader(ctx: Ctx, result: Result, titleText: string): number {
  const { doc, ML, CW, PW, rect, text, setColor } = ctx;
  const schoolInfo = getSchoolInfo();
  const schoolName    = (schoolInfo?.name || "SCHOOL RESULT MANAGEMENT SYSTEM").toUpperCase();
  const schoolAddress = schoolInfo?.address || "";
  const schoolMotto   = schoolInfo?.motto   || "";
  const schoolLogo    = schoolInfo?.logo    || null;
  const studentPhoto  = getStudentPhoto(result.admissionNumber);

  let y = 12;
  const CARD_W = 68, CARD_H = 27;

  // Student card (left)
  rect(ML, y, CARD_W, CARD_H, C_PANEL, "#d58b8b");
  const PHOTO_W = 18, PHOTO_H = 22, photoX = ML + 2.5, photoY = y + 2.5;
  if (studentPhoto && safeAddImage(doc, studentPhoto, photoX, photoY, PHOTO_W, PHOTO_H)) {
    ctx.setDraw("#d58b8b"); doc.rect(photoX, photoY, PHOTO_W, PHOTO_H);
  } else {
    rect(photoX, photoY, PHOTO_W, PHOTO_H, "#f3dede", "#d58b8b");
    doc.setFont("helvetica", "normal"); doc.setFontSize(5.5); setColor(C_MUTED);
    text("PHOTO", photoX + PHOTO_W / 2, photoY + PHOTO_H / 2 + 1.5, { align: "center" });
  }
  const tx = ML + 24;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor("#111111");
  let ty = y + 6;
  (doc.splitTextToSize(s(result.studentName).toUpperCase(), CARD_W - 26) as string[]).slice(0, 2).forEach((ln) => {
    text(ln, tx, ty); ty += 3.4;
  });
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.8);
  const details: string[] = [s(result.class)];
  if ((result as any).stream) details.push(`Stream : ${(result as any).stream}`);
  if (result.admissionNumber) details.push(`Adm. No: ${result.admissionNumber}`);
  if ((result as any).dob) details.push(`Date of Birth: ${(result as any).dob}`);
  if (result.gender) details.push(s(result.gender));
  details.slice(0, 4).forEach((d) => { text(d, tx, ty); ty += 3.1; });

  // School identity (right)
  const logoSize = 20, rightEdge = ML + CW;
  if (schoolLogo) safeAddImage(doc, schoolLogo, rightEdge - logoSize, y + 1, logoSize, logoSize);
  const tr = rightEdge - (schoolLogo ? logoSize + 3 : 0);
  const avail = tr - (ML + CARD_W) - 4;
  let fs = 14;
  doc.setFont("helvetica", "bold"); doc.setFontSize(fs);
  while (fs > 8 && doc.getTextWidth(schoolName) > avail) { fs -= 0.5; doc.setFontSize(fs); }
  setColor("#14142b");
  text(schoolName, tr, y + 8, { align: "right" });
  let iy = y + 13.5;
  if (schoolMotto) {
    doc.setFontSize(8.5); setColor(C_PRIMARY);
    text(schoolMotto.toUpperCase(), tr, iy, { align: "right" }); iy += 4.5;
  }
  if (schoolAddress) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); setColor(C_MUTED);
    (doc.splitTextToSize(schoolAddress, avail * 0.8) as string[]).slice(0, 2).forEach((ln) => {
      text(ln, tr, iy, { align: "right" }); iy += 3;
    });
  }

  // Title + class teacher / attendance line
  y += CARD_H + 7;
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); setColor(C_TEXT);
  text(titleText, PW / 2, y, { align: "center" });
  y += 4.6;
  const att = result.attendance ?? { opened: 0, present: 0, absent: 0 };
  const teacher = getTeacherName(result.createdBy);
  const sub = [
    teacher ? `Class Teacher: ${teacher}` : "",
    `No of Times Opened: ${att.opened ?? 0}`,
    `No of Times Present: ${att.present ?? 0}`,
    `No of Times Absent: ${att.absent ?? 0}`,
  ].filter(Boolean).join("      ");
  doc.setFont("helvetica", "normal"); doc.setFontSize(6);
  text(sub, PW / 2, y, { align: "center" });
  return y + 7;
}

function drawSectionTitle(ctx: Ctx, y: number, label: string): number {
  ctx.doc.setFont("helvetica", "bold"); ctx.doc.setFontSize(8.5); ctx.setColor(C_PRIMARY);
  ctx.text(label, ctx.ML, y + 2);
  return y + 5;
}

// ─── Generic labeled info bar: rows of [label, value] triples ─────────────────

function drawInfoBar(ctx: Ctx, y: number, rows: [string, string][][], bg = "#f5f5f5"): number {
  const { ML, CW, rect, text, doc, setColor } = ctx;
  const rowH = 6;
  const barH = rows.length * rowH + 4;
  rect(ML, y, CW, barH, bg, C_BORDER);
  doc.setFontSize(7.5);
  rows.forEach((cells, ri) => {
    const ry = y + 5 + ri * rowH;
    const colW = CW / cells.length;
    cells.forEach(([label, val], ci) => {
      const cx = ML + 3 + ci * colW;
      doc.setFont("helvetica", "bold"); setColor(C_TEXT);
      text(label, cx, ry);
      doc.setFont("helvetica", "normal");
      text(s(val), cx + doc.getTextWidth(label) + 2, ry);
    });
  });
  return y + barH + 3;
}

// ─── Grading-scale box (right column, reused by nursery/primary/standard/midterm)

function drawGradeScaleBox(ctx: Ctx, x: number, y: number, w: number, scale: readonly { min: number; max: number; grade: string; remark: string }[], title = "Grading Scale"): number {
  const { rect, text, doc, setColor } = ctx;
  rect(x, y, w, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text(title, x + w / 2, y + 4, { align: "center" });
  y += 6;
  scale.forEach(({ min, max, grade, remark }, idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(x, y, w, 5, bg, C_BORDER);
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor(C_PRIMARY);
    text(grade, x + 2, y + 3.5);
    doc.setFont("helvetica", "normal"); setColor(C_TEXT);
    text(`(${min}\u2013${max}) ${remark}`, x + 12, y + 3.5);
    y += 5;
  });
  return y + 3;
}

// ─── Rating table (Affective / Psychomotor), 5-4-3-2-1 columns with a checkmark

function drawRatingTable(ctx: Ctx, sx: number, sy: number, sw: number, title: string, labels: readonly string[], ratings: Record<string, number> | undefined): number {
  const { rect, text, doc, setColor } = ctx;
  rect(sx, sy, sw, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text(title, sx + 2, sy + 4);
  const labelW = sw * 0.60, numW = sw * 0.08;
  [5, 4, 3, 2, 1].forEach((n, i) => text(String(n), sx + labelW + numW * i + numW / 2, sy + 4, { align: "center" }));
  sy += 6;
  labels.forEach((label, idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(sx, sy, sw, 5, bg, C_BORDER);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); setColor(C_TEXT);
    text(s(label), sx + 2, sy + 3.5);
    const val = ratings?.[label] ?? 0;
    [5, 4, 3, 2, 1].forEach((n, i) => {
      if (val === n) {
        const cx2 = sx + labelW + numW * i + numW / 2;
        doc.setFont("helvetica", "bold"); setColor(C_PRIMARY);
        text("\u2713", cx2, sy + 3.5, { align: "center" });
        doc.setFont("helvetica", "normal"); setColor(C_TEXT);
      }
    });
    sy += 5;
  });
  return sy + 2;
}

// ─── Comment block (navy title, ruled remark, small name) ─────────────────────

function drawComment(ctx: Ctx, title: string, comment: string, name: string | undefined, startY: number): number {
  const { ML, CW, text, doc, setColor, line } = ctx;
  startY = ctx.checkBreak(startY, 24);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setColor(C_PRIMARY);
  text(title.replace(/'s Remark$/, "").replace(/ Remark$/, ""), ML, startY + 3);
  const top = startY + 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(C_TEXT);
  const lines = (doc.splitTextToSize(s(comment, ""), CW - 2) as string[]).slice(0, 3);
  lines.forEach((ln, i) => text(ln, ML + 1, top + 3 + i * 4.2));
  const ruleY = top + 3 + Math.max(lines.length - 1, 0) * 4.2 + 2.2;
  line(ML, ruleY, ML + CW, ruleY, C_BORDER);
  if (name) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(5.8); setColor(C_PRIMARY);
    text(name.toUpperCase(), ML + 1, ruleY + 3.6);
    return ruleY + 7;
  }
  return ruleY + 4;
}

// ─── Image fit (keeps aspect ratio) ────────────────────────────────────────────

function fitImage(doc: any, dataUrl: string, bx: number, by: number, bw: number, bh: number): boolean {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:")) return false;
    const props = doc.getImageProperties(dataUrl);
    const ar = props.width / props.height;
    let w = bw, h = bw / ar;
    if (h > bh) { h = bh; w = bh * ar; }
    const fmt = props.fileType || (dataUrl.includes("data:image/png") ? "PNG" : "JPEG");
    doc.addImage(dataUrl, fmt, bx + (bw - w) / 2, by + (bh - h) / 2, w, h);
    return true;
  } catch {
    return safeAddImage(doc, dataUrl, bx, by, bw, bh);
  }
}

// ─── Generated school stamp ────────────────────────────────────────────────────
// Circular ink seal: school name curved along the top, address (or motto) along
// the bottom, "OFFICIAL" + issue date in the centre. Slightly tilted and
// semi-transparent so it reads as a real rubber stamp.

function shortAddress(addr: string, max = 30): string {
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  let out = "";
  for (const p of parts) {
    const next = out ? `${out}, ${p}` : p;
    if (next.length > max) break;
    out = next;
  }
  return (out || addr.slice(0, max)).toUpperCase();
}

function drawSchoolStamp(ctx: Ctx, cx: number, cy: number, R: number): void {
  const { doc, setColor, setDraw, setFill } = ctx;
  const info = getSchoolInfo();
  const name = (info?.name || "SCHOOL RESULT MANAGEMENT SYSTEM").toUpperCase();
  const bottom = info?.address ? shortAddress(info.address) : info?.motto ? info.motto.toUpperCase() : "REPORT SHEET";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  const gs = (o: number) => { try { doc.setGState(new doc.GState({ opacity: o })); } catch { /* opacity unsupported */ } };
  gs(0.85);
  setDraw(C_STAMP); setColor(C_STAMP); setFill(C_STAMP);

  doc.setLineWidth(0.7);  doc.circle(cx, cy, R, "S");
  doc.setLineWidth(0.25); doc.circle(cx, cy, R - 1.3, "S");
  doc.setLineWidth(0.3);  doc.circle(cx, cy, R - 9.4, "S");

  const tilt = (7 * Math.PI) / 180; // whole stamp rotated 7° anticlockwise
  const band = R - 5.35;            // centre of the lettering band

  const arc = (str: string, where: "top" | "bottom", rBase: number, maxSpanDeg: number, fs0: number) => {
    if (!str) return;
    doc.setFont("helvetica", "bold");
    let fs = fs0; doc.setFontSize(fs);
    const gap = 0.35;
    const measure = () => str.split("").reduce((a, ch) => a + doc.getTextWidth(ch) + gap, -gap);
    let total = measure();
    const maxLen = ((maxSpanDeg * Math.PI) / 180) * rBase;
    if (total > maxLen) { fs = Math.max(4, (fs0 * maxLen) / total); doc.setFontSize(fs); total = measure(); }
    let a = -(total / rBase) / 2;
    str.split("").forEach((ch) => {
      const w = doc.getTextWidth(ch);
      const mid = a + w / 2 / rBase;
      if (where === "top") {
        const th = mid - tilt;
        const px = cx + rBase * Math.sin(th), py = cy - rBase * Math.cos(th);
        doc.text(ch, px - (w / 2) * Math.cos(th), py - (w / 2) * Math.sin(th), { angle: (-th * 180) / Math.PI });
      } else {
        const al = mid + tilt;
        const px = cx + rBase * Math.sin(al), py = cy + rBase * Math.cos(al);
        doc.text(ch, px - (w / 2) * Math.cos(al), py + (w / 2) * Math.sin(al), { angle: (al * 180) / Math.PI });
      }
      a += (w + gap) / rBase;
    });
  };
  arc(name, "top", band - 0.95, 165, 7.5);
  arc(bottom, "bottom", band + 0.95, 120, 6);

  // separator dots between the two arcs
  [-1, 1].forEach((side) => {
    const th = side * (Math.PI / 2) - tilt;
    doc.circle(cx + band * Math.sin(th), cy - band * Math.cos(th), 0.55, "F");
  });

  // centre lettering (tilted with the stamp)
  const bx = Math.cos(tilt), by = -Math.sin(tilt);   // along-text direction
  const dx = Math.sin(tilt), dy = Math.cos(tilt);    // "down" direction
  const centreText = (str: string, off: number, fs: number) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(fs);
    const w = doc.getTextWidth(str);
    const px = cx + off * dx, py = cy + off * dy;
    doc.text(str, px - (w / 2) * bx, py - (w / 2) * by, { angle: (tilt * 180) / Math.PI });
  };
  centreText("OFFICIAL", -2.2, 5.4);
  doc.setLineWidth(0.2);
  doc.line(cx + 0.2 * dx - 4.5 * bx, cy + 0.2 * dy - 4.5 * by, cx + 0.2 * dx + 4.5 * bx, cy + 0.2 * dy + 4.5 * by);
  centreText(dateStr, 3.6, 4.4);

  gs(1);
  doc.setLineWidth(0.2);
}

// ─── Signature row: teacher line (left) + stamp with principal signature (right)

function drawSignatureRow(ctx: Ctx, y: number, leftLabel: string, leftSig: string | null, rightLabel: string, rightSig: string | null): number {
  const { ML, CW, text, doc, setColor, line } = ctx;
  const R = 18;
  y = ctx.checkBreak(y, R * 2 + 10);

  // Teacher signature
  const lw = CW * 0.34, lineY = y + R * 2 - 5;
  if (leftSig) fitImage(doc, leftSig, ML + 4, lineY - 15, lw - 8, 14);
  line(ML, lineY, ML + lw, lineY, C_MUTED);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor(C_PRIMARY);
  text(leftLabel, ML + lw / 2, lineY + 4, { align: "center" });

  // Stamp, then the principal's signature drawn over it
  const cx = ML + CW - R - 10, cy = y + R + 1;
  drawSchoolStamp(ctx, cx, cy, R);
  if (rightSig) fitImage(doc, rightSig, cx - 17, cy - 6, 34, 13);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor(C_PRIMARY);
  text(rightLabel, cx, y + R * 2 + 5, { align: "center" });

  return y + R * 2 + 12;
}

// ─── Footer (next term / session line + page footer) ───────────────────────────

function drawFooter(ctx: Ctx, result: Result, y: number, nextLabelOverride?: string) {
  const { ML, CW, PW, PH, doc, text, line, setColor } = ctx;
  y = ctx.checkBreak(y, 8);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(C_TEXT);
  const nextLabel = nextLabelOverride || (result.term === "Third" ? "Next Session Begins" : "Next Term Begins");
  text(`${nextLabel}: ____________________`, ML, y);
  text(`Date: ${new Date().toLocaleDateString()}`, ML + CW, y, { align: "right" });

  const schoolInfo = getSchoolInfo();
  const schoolName = schoolInfo?.name || "SCHOOL RESULT MANAGEMENT SYSTEM";
  line(ML, PH - 12, ML + CW, PH - 12);
  doc.setFontSize(6.5); setColor(C_MUTED);
  text(`${schoolName} \u00A9 ${new Date().getFullYear()} \u2022 Generated ${new Date().toLocaleDateString()}`, PW / 2, PH - 8, { align: "center" });
}

// ─── Grade-analysis frequency table (auto-tallied from subject grades) ────────

function drawGradeAnalysis(ctx: Ctx, x: number, y: number, w: number, subjects: Subject[], scale: readonly { grade: string }[]): number {
  const { rect, text, doc, setColor } = ctx;
  const grades = scale.map((g) => g.grade);
  const counts: Record<string, number> = {};
  grades.forEach((g) => (counts[g] = 0));
  subjects.forEach((sub) => { if (sub.grade && counts[sub.grade] !== undefined) counts[sub.grade]++; });

  rect(x, y, w, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Grade Analysis", x + w / 2, y + 4, { align: "center" });
  y += 6;

  const colW = w / grades.length;
  rect(x, y, w, 5, C_LIGHT, C_BORDER);
  doc.setFontSize(6.5); setColor(C_TEXT);
  grades.forEach((g, i) => { doc.setFont("helvetica", "bold"); text(g, x + i * colW + colW / 2, y + 3.5, { align: "center" }); });
  y += 5;
  rect(x, y, w, 5, C_ROW_A, C_BORDER);
  grades.forEach((g, i) => { doc.setFont("helvetica", "normal"); text(String(counts[g] ?? 0), x + i * colW + colW / 2, y + 3.5, { align: "center" }); });
  y += 5;
  return y + 3;
}

// ─── Performance-summary box (left column) ─────────────────────────────────────

function drawSummaryBox(ctx: Ctx, x: number, y: number, w: number, title: string, rows: [string, string][]): number {
  const { rect, text, doc, setColor } = ctx;
  rect(x, y, w, 6, C_HEADER_BG, C_BORDER);
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); setColor(C_PRIMARY);
  text(title, x + w / 2, y + 4, { align: "center" });
  y += 6;
  rows.forEach(([label, val], idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(x, y, w, 5.5, bg, C_BORDER);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); setColor(C_TEXT);
    text(label, x + 3, y + 3.8);
    doc.setFont("helvetica", "bold");
    text(val, x + w - 3, y + 3.8, { align: "right" });
    y += 5.5;
  });
  return y + 3;
}

function drawAttendanceBox(ctx: Ctx, x: number, y: number, w: number, result: Result): number {
  const { rect, text, doc, setColor } = ctx;
  rect(x, y, w, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Attendance", x + w / 2, y + 4, { align: "center" });
  y += 6;
  const att = result.attendance ?? { opened: 0, present: 0, absent: 0 };
  ([["School Days", String(att.opened ?? 0)], ["Present", String(att.present ?? 0)], ["Absent", String(att.absent ?? 0)]] as [string, string][]).forEach(([l, v], idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(x, y, w, 5.5, bg, C_BORDER);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); setColor(C_TEXT);
    text(l, x + 2, y + 3.8);
    doc.setFont("helvetica", "bold");
    text(v, x + w - 2, y + 3.8, { align: "right" });
    y += 5.5;
  });
  return y + 3;
}

// ─── Generic subject-score table ───────────────────────────────────────────────

interface SubjectCol {
  header: string;
  width: number; // fraction of CW
  align?: "left" | "center" | "right";
  /** When any column sets this, a "MARK OBTAINABLE" row is drawn under the header. */
  obtainable?: string;
  get: (sub: Subject, idx: number) => string;
}

function drawSubjectTable(ctx: Ctx, y: number, columns: SubjectCol[], subjects: Subject[]): number {
  const { ML, CW, rect, text, doc, setColor } = ctx;
  const widths = columns.map((c) => c.width * CW);
  const colX = (i: number) => ML + widths.slice(0, i).reduce((a, b) => a + b, 0);

  // Header height grows to fit the longest rotated label.
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.4);
  const longest = Math.max(0, ...columns.slice(1).map((c) => doc.getTextWidth(c.header)));
  const TH_H = Math.max(8, Math.min(26, longest + 5));
  const ROW_H = 6;

  y = ctx.checkBreak(y, TH_H + ROW_H * 2);
  rect(ML, y, CW, TH_H, C_TH);
  setColor(C_WHITE);
  columns.forEach((c, i) => {
    if (i === 0) text(c.header, colX(i) + 2, y + TH_H - 2);
    else {
      text(c.header, colX(i) + widths[i] / 2 + 1.1, y + TH_H - 2, { angle: 90 });
      ctx.line(colX(i), y + 1, colX(i), y + TH_H - 1, "#9a9a9a");
    }
  });
  y += TH_H;

  if (columns.some((c) => c.obtainable !== undefined)) {
    const H = 5.4;
    rect(ML, y, CW, H, C_ROW_A, C_BORDER);
    columns.forEach((c, i) => {
      doc.setFontSize(6.4); setColor(C_PRIMARY);
      if (i === 0) { doc.setFont("helvetica", "bolditalic"); text("MARK OBTAINABLE", colX(i) + widths[i] - 2, y + 3.8, { align: "right" }); }
      else if (c.obtainable) { doc.setFont("helvetica", "bold"); text(c.obtainable, colX(i) + widths[i] / 2, y + 3.8, { align: "center" }); }
    });
    y += H;
  }

  subjects.forEach((sub) => {
    y = ctx.checkBreak(y, ROW_H + 2);
    columns.forEach((c, i) => {
      rect(colX(i), y, widths[i], ROW_H, i === 0 ? C_ROW_A : C_CELL, C_BORDER);
      setColor(C_TEXT);
      const idx = subjects.indexOf(sub);
      const raw = c.get(sub, idx);
      if (i === 0) {
        const label = raw.toUpperCase();
        let fs = 7; doc.setFont("helvetica", "normal"); doc.setFontSize(fs);
        while (fs > 5 && doc.getTextWidth(label) > widths[i] - 3) { fs -= 0.3; doc.setFontSize(fs); }
        text(label, colX(i) + 2, y + ROW_H - 1.8);
      } else {
        doc.setFont("helvetica", "normal"); doc.setFontSize(7);
        const align = c.align || "center";
        const tx = align === "center" ? colX(i) + widths[i] / 2 : align === "right" ? colX(i) + widths[i] - 2 : colX(i) + 2;
        text(raw, tx, y + ROW_H - 1.8, { align });
      }
    });
    y += ROW_H;
  });
  return y + 4;
}

// ─── Totals line + grade legend (mid-term sheet footer block) ──────────────────

function drawTotalsLine(ctx: Ctx, y: number, items: [string, string][]): number {
  const { ML, text, doc, setColor } = ctx;
  let x = ML;
  items.forEach(([label, val]) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(C_PRIMARY);
    text(`${label}:`, x, y);
    x += doc.getTextWidth(`${label}:`) + 1.8;
    doc.setFont("helvetica", "bold");
    text(val, x, y);
    x += doc.getTextWidth(val) + 9;
  });
  return y + 6;
}

function drawGradeLegend(ctx: Ctx, y: number, scale: readonly { min: number; max: number; grade: string }[]): number {
  const { ML, CW, text, doc, setColor } = ctx;
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.6); setColor(C_PRIMARY);
  text("Grade Legend:", ML, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.4);
  const str = scale.map((g) => `${g.grade} (${g.min}-${g.max})`).join(",   ");
  (doc.splitTextToSize(str, CW - 2) as string[]).forEach((ln, i) => text(ln, ML, y + 3.6 + i * 3.2));
  return y + 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE: preschool (Image 1) — E/S/N skills checklist, no numeric scores
// ═══════════════════════════════════════════════════════════════════════════

function renderPreschool(ctx: Ctx, result: Result): void {
  const { ML, CW, rect, text, doc, setColor, checkBreak } = ctx;
  let y = drawHeader(ctx, result, `${s(result.term).toUpperCase()} TERM PUPIL'S PERFORMANCE REPORT`);

  // Personal Data (left) + Class Data (right) panels
  const panelW = CW * 0.62, panelGap = CW * 0.02, panel2W = CW - panelW - panelGap;
  const px2 = ML + panelW + panelGap;

  rect(ML, y, panelW, 6, C_PANEL, C_BORDER);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); setColor(C_PRIMARY);
  text("PERSONAL DATA", ML + panelW / 2, y + 4, { align: "center" });
  rect(px2, y, panel2W, 6, C_PANEL2, C_BORDER);
  text("CLASS DATA", px2 + panel2W / 2, y + 4, { align: "center" });
  y += 6;

  const personalRows: [string, string][] = [
    ["Name:", s(result.studentName)],
    ["Gender:", s(result.gender)],
    ["Admsn No:", s(result.admissionNumber)],
    ["D.O.B:", s((result as any).dob)],
    ["Age:", s(result.age)],
    ["Weight:", s(result.weight)],
    ["Height:", s(result.height)],
  ];
  const classRows: [string, string][] = [
    ["Class:", s(result.class)],
    ["Session:", s(result.session)],
    ["Class Size:", s(result.classSize)],
  ];

  let py = y, cy = y;
  personalRows.forEach(([l, v], idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(ML, py, panelW, 5, bg, C_BORDER);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_TEXT);
    text(l, ML + 2, py + 3.4);
    doc.setFont("helvetica", "normal");
    text(v, ML + 28, py + 3.4);
    py += 5;
  });
  classRows.forEach(([l, v], idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(px2, cy, panel2W, 5, bg, C_BORDER);
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_TEXT);
    text(l, px2 + 2, cy + 3.4);
    doc.setFont("helvetica", "normal");
    text(v, px2 + 20, cy + 3.4);
    cy += 5;
  });

  // Attendance summary sits under the (shorter) Class Data panel
  cy = drawAttendanceBox(ctx, px2, cy + 2, panel2W, result);

  y = Math.max(py, cy) + 3;
  ctx.setY(y);

  // Checklist domains — 2-column grid of little tables, each with E/S/N ticks
  const domains: ChecklistDomain[] = (result.checklistDomains && result.checklistDomains.length > 0)
    ? result.checklistDomains
    : buildDefaultChecklist();

  const colGap = CW * 0.02;
  const colW = (CW - colGap) / 2;
  const col2X = ML + colW + colGap;
  let leftY = y, rightY = y;

  const drawChecklistDomain = (sx: number, sy: number, sw: number, domain: ChecklistDomain): number => {
    sy = ctx.checkBreak(sy, 6 + domain.items.length * 4.6 + 2);
    rect(sx, sy, sw, 5.5, C_HEADER_BG, C_BORDER);
    doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor(C_PRIMARY);
    text(domain.title.toUpperCase(), sx + 2, sy + 3.7);
    const markW = sw * 0.08, labelW = sw - markW * 3;
    ["E", "S", "N"].forEach((m, i) => text(m, sx + labelW + markW * i + markW / 2, sy + 3.7, { align: "center" }));
    sy += 5.5;
    domain.items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
      rect(sx, sy, sw, 4.6, bg, C_BORDER);
      doc.setFont("helvetica", "normal"); doc.setFontSize(6); setColor(C_TEXT);
      const lines = doc.splitTextToSize(item.label, labelW - 2);
      text(lines[0], sx + 1.5, sy + 3.2);
      ["E", "S", "N"].forEach((m, i) => {
        if (item.mark === m) {
          doc.setFont("helvetica", "bold"); setColor(C_PRIMARY);
          text("\u2713", sx + labelW + markW * i + markW / 2, sy + 3.2, { align: "center" });
          doc.setFont("helvetica", "normal"); setColor(C_TEXT);
        }
      });
      sy += 4.6;
    });
    return sy + 2.5;
  };

  domains.forEach((domain, i) => {
    if (i % 2 === 0) leftY = drawChecklistDomain(ML, leftY, colW, domain);
    else rightY = drawChecklistDomain(col2X, rightY, colW, domain);
  });

  y = Math.max(leftY, rightY) + 2;
  ctx.setY(y);

  // Grading key
    y = ctx.checkBreak(y, 20);
  rect(ML, y, CW, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Grading Key", ML + CW / 2, y + 4, { align: "center" });
  y += 6;
  rect(ML, y, CW, 5, C_ROW_A, C_BORDER);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); setColor(C_TEXT);
  const keyStr = (Object.entries(CHECKLIST_MARK_KEY) as [ChecklistMark, string][]).map(([k, v]) => `${k} = ${v}`).join("      ");
  text(keyStr, ML + 3, y + 3.5);
  y += 8;
  ctx.setY(y);

  y = drawComment(ctx, "Class Teacher's Remark", s(result.teacherComment), undefined, y);
  ctx.setY(y);
  y = drawComment(ctx, "Head Teacher's Remark", s(result.principalComment), undefined, y);
  ctx.setY(y);

    y = ctx.checkBreak(y, 32);
  y += 2;
  y = drawSignatureRow(ctx, y, "Class Teacher's Signature", getTeacherSignature(result.createdBy), "Head Teacher's Signature", getPrincipalSignature());
  ctx.setY(y);
  drawFooter(ctx, result, y);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE: nursery (Image 2) — scored cognitive subjects + 4-3-2-1 rated domains
// ═══════════════════════════════════════════════════════════════════════════

function drawRatedDomainBlock(ctx: Ctx, sx: number, sy: number, sw: number, domain: RatedDomain): number {
  const { rect, text, doc, setColor } = ctx;
  sy = ctx.checkBreak(sy, 6 + domain.items.length * 4.6 + 2);
  rect(sx, sy, sw, 5.5, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.8); setColor(C_WHITE);
  text(domain.title.toUpperCase(), sx + 2, sy + 3.7);
  const numW = sw * 0.08, labelW = sw - numW * 4;
  [4, 3, 2, 1].forEach((n, i) => text(String(n), sx + labelW + numW * i + numW / 2, sy + 3.7, { align: "center" }));
  sy += 5.5;
  domain.items.forEach((item, idx) => {
    const bg = idx % 2 === 0 ? C_ROW_A : C_ROW_B;
    rect(sx, sy, sw, 4.6, bg, C_BORDER);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6); setColor(C_TEXT);
    const lines = doc.splitTextToSize(item.label, labelW - 2);
    text(lines[0], sx + 1.5, sy + 3.2);
    [4, 3, 2, 1].forEach((n, i) => {
      if (item.rating === n) {
        doc.setFont("helvetica", "bold"); setColor(C_PRIMARY);
        text("\u2713", sx + labelW + numW * i + numW / 2, sy + 3.2, { align: "center" });
        doc.setFont("helvetica", "normal"); setColor(C_TEXT);
      }
    });
    sy += 4.6;
  });
  return sy + 2.5;
}

function renderNursery(ctx: Ctx, result: Result): void {
  const { ML, CW, rect, text, doc, setColor } = ctx;
  let y = drawHeader(ctx, result, `${s(result.term).toUpperCase()} TERM PUPIL'S PERFORMANCE REPORT`);

  y = drawInfoBar(ctx, y, [[
    ["Name:", s(result.studentName)], ["Class:", s(result.class)], ["Gender:", s(result.gender)],
  ], [
    ["Session:", s(result.session)], ["Admsn No:", s(result.admissionNumber)], ["Age:", s(result.age)],
  ], [
    ["No of Times School Opened:", String(result.attendance?.opened ?? 0)],
    ["No of Times Present:", String(result.attendance?.present ?? 0)],
    ["No of Times Absent:", String(result.attendance?.absent ?? 0)],
  ]]);

  const leftW = CW * 0.56, rightW = CW * 0.42, gap = CW * 0.02;
  const rightX = ML + leftW + gap;
  let leftY = y, rightY = y;

  const cols: SubjectCol[] = [
    { header: "Subject", width: 0.30, align: "left", get: (sub) => s(sub.name, "Subject") },
    { header: "C.A.", width: 0.13, get: (sub: any) => s(sub.cat1Total ?? sub.notes) },
    { header: "Exam", width: 0.13, get: (sub: any) => s(sub.examScore) },
    { header: "Total", width: 0.14, get: (sub) => s(sub.score) },
    { header: "Grade", width: 0.13, get: (sub) => s(sub.grade) },
    { header: "1st Term", width: 0.17, get: (sub: any) => s(sub.prevTerm1Total) },
  ];
  leftY = drawSubjectTable({ ...ctx, ML: ML, CW: leftW } as Ctx, leftY, cols, result.subjects ?? []);

  rightY = rightY; // start rated domains beside the table
  const domains: RatedDomain[] = (result.ratedDomains && result.ratedDomains.length > 0) ? result.ratedDomains : buildDefaultRatedDomains();
  domains.forEach((d) => { rightY = drawRatedDomainBlock(ctx, rightX, rightY, rightW, d); });

  y = Math.max(leftY, rightY) + 2;
  ctx.setY(y);

    y = ctx.checkBreak(y, 40);
  const totalObtainable = (result.subjects?.length ?? 0) * 100;
  const summaryBottom = drawSummaryBox(ctx, ML, y, CW * 0.5, "Performance Summary", [
    ["Total Obtained", s(result.totalScore, "0")],
    ["Total Obtainable", String(totalObtainable)],
    ["Percentage", result.averageScore != null ? result.averageScore.toFixed(0) + "%" : "—"],
    ["Grade", s(result.overallGrade)],
    ["Remark", s(result.overallGrade ? GRADING_SCALE.find((g) => g.grade === result.overallGrade)?.remark : undefined)],
  ]);
  const scaleBottom = drawGradeScaleBox(ctx, ML + CW * 0.52, y, CW * 0.46, GRADING_SCALE, "Grade Scale");

  y = Math.max(summaryBottom, scaleBottom) + 2;
  ctx.setY(y);

  rect(ML, y, CW, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Domain Rating Key", ML + CW / 2, y + 4, { align: "center" });
  y += 6;
  rect(ML, y, CW, 5, C_ROW_A, C_BORDER);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); setColor(C_TEXT);
  text(NURSERY_RATING_KEY.join("      "), ML + 3, y + 3.5);
  y += 8;
  ctx.setY(y);

  y = drawComment(ctx, "Class Teacher's Remark", s(result.teacherComment), undefined, y);
  ctx.setY(y);
  y = drawComment(ctx, "Head Teacher's Remark", s(result.principalComment), undefined, y);
  ctx.setY(y);

    y = ctx.checkBreak(y, 32);
  y += 2;
  y = drawSignatureRow(ctx, y, "Class Teacher's Signature", getTeacherSignature(result.createdBy), "Head Teacher's Signature", getPrincipalSignature());
  ctx.setY(y);
  drawFooter(ctx, result, y);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE: primary (Image 3) — scores + session-cumulative columns + affective/psychomotor
// ═══════════════════════════════════════════════════════════════════════════

function renderPrimary(ctx: Ctx, result: Result): void {
  const { ML, CW, doc } = ctx;
  let y = drawHeader(ctx, result, `${s(result.term).toUpperCase()} TERM PUPIL'S PERFORMANCE REPORT`);

  const infoW = CW * 0.72, attW = CW * 0.26, attX = ML + infoW + CW * 0.02;
  const infoBottom = drawInfoBar({ ...ctx, CW: infoW } as Ctx, y, [
    [["Name:", s(result.studentName)], ["Gender:", s(result.gender)]],
    [["Class:", s(result.class)], ["Session:", s(result.session)]],
    [["Admsn No:", s(result.admissionNumber)], ["Age:", s(result.age)]],
    [["Ht/Wt:", `${s(result.height, "-")} / ${s(result.weight, "-")}`], ["Fav. Colour:", s(result.favColor)]],
  ]);
  const attBottom = drawAttendanceBox(ctx, attX, y, attW, result);
  y = Math.max(infoBottom, attBottom);
  ctx.setY(y);

  const term = result.term;
  const cols: SubjectCol[] = [
    { header: "Subject", width: 0.22, align: "left", get: (sub) => s(sub.name, "Subject") },
    { header: "C.A.", width: 0.08, get: (sub: any) => s(sub.cat1Total) },
    { header: "Exam", width: 0.08, get: (sub: any) => s(sub.examScore) },
    { header: `${term} Term`, width: 0.10, get: (sub) => s(sub.score) },
  ];
  if (term === "Third") {
    cols.push({ header: "2nd Term", width: 0.09, get: (sub: any) => s(sub.prevTerm2Total) });
    cols.push({ header: "1st Term", width: 0.09, get: (sub: any) => s(sub.prevTerm1Total) });
  } else if (term === "Second") {
    cols.push({ header: "1st Term", width: 0.09, get: (sub: any) => s(sub.prevTerm1Total) });
  }
  cols.push({ header: "Grade", width: 0.08, get: (sub) => s(sub.grade) });
  cols.push({ header: "Subj Pos.", width: 0.09, get: (sub: any) => (sub.subjectPosition ? ordinal(sub.subjectPosition) : "—") });
  cols.push({ header: "Remark", width: 0.13, align: "left", get: (sub) => s(sub.remark) });
  cols.push({ header: "Class Avg", width: 0.08, get: (sub: any) => s(sub.classAvg) });
  // normalize widths to sum to 1
  const total = cols.reduce((a, c) => a + c.width, 0);
  cols.forEach((c) => (c.width = c.width / total));

  const leftW = CW * 0.62, rightW = CW * 0.36, gap = CW * 0.02, rightX = ML + leftW + gap;
  const tableBottom = drawSubjectTable({ ...ctx, CW: leftW } as Ctx, y, cols, result.subjects ?? []);
  let leftY = tableBottom;
  let rightY = y;

  leftY = drawGradeAnalysis(ctx, ML, leftY, leftW, result.subjects ?? [], WAEC_GRADING_SCALE);
  leftY = ctx.checkBreak(leftY, RATING_SCALE_NOTES.length * 4.5 + 8);
  const { rect, text, setColor } = ctx;
  rect(ML, leftY, leftW, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Rating Indices", ML + leftW / 2, leftY + 4, { align: "center" });
  leftY += 6;
  rect(ML, leftY, leftW, RATING_SCALE_NOTES.length * 4.2 + 2, C_ROW_A, C_BORDER);
  RATING_SCALE_NOTES.forEach((note, idx) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); setColor(C_TEXT);
    text(s(note), ML + 2, leftY + 3.2 + idx * 4.2);
  });
  leftY += RATING_SCALE_NOTES.length * 4.2 + 4;

  rightY = drawRatingTable(ctx, rightX, rightY, rightW, "Affective Domain", AFFECTIVE_TRAITS, result.affectiveDomain);
  rightY = ctx.checkBreak(rightY, 10);
  rightY = drawRatingTable(ctx, rightX, rightY, rightW, "Psychomotor Skills", PSYCHOMOTOR_SKILLS, result.psychomotorSkills);

  y = Math.max(leftY, rightY) + 2;
  ctx.setY(y);

    y = ctx.checkBreak(y, 40);
  const sessAvg = result.sessionAverage != null ? result.sessionAverage.toFixed(1) + "%" : (result.averageScore != null ? result.averageScore.toFixed(1) + "%" : "—");
  const summaryBottom = drawSummaryBox(ctx, ML, y, CW * 0.5, "Performance Summary", [
    ["Total Obtained", s(result.totalScore, "0")],
    ["Total Obtainable", String((result.subjects?.length ?? 0) * 100)],
    ["% Average", result.averageScore != null ? result.averageScore.toFixed(1) + "%" : "—"],
    ["Session Average", sessAvg],
    ["Grade", s(result.overallGrade)],
    ["Position in Class", result.position ? ordinal(result.position) : "N/A"],
  ]);
  const scaleBottom = drawGradeScaleBox(ctx, ML + CW * 0.52, y, CW * 0.46, WAEC_GRADING_SCALE, "Grade Scale");
  y = Math.max(summaryBottom, scaleBottom) + 2;
  ctx.setY(y);

  y = drawComment(ctx, "Class Teacher's Remark", s(result.teacherComment), undefined, y);
  ctx.setY(y);
  y = drawComment(ctx, "Head Teacher's Remark", s(result.principalComment), undefined, y);
  ctx.setY(y);

    y = ctx.checkBreak(y, 32);
  y += 2;
  y = drawSignatureRow(ctx, y, "Class Teacher's Signature", getTeacherSignature(result.createdBy), "Head Teacher's Signature", getPrincipalSignature());
  ctx.setY(y);
  drawFooter(ctx, result, y);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE: standard (Images 4-8) — JSS/SS term report: CA + Exam scoring,
// optional prior-term / cumulative columns, optional class min/max/avg,
// affective + psychomotor domains, WAEC or "genius" grading scale.
// ═══════════════════════════════════════════════════════════════════════════

function renderStandard(ctx: Ctx, result: Result): void {
  const { ML, CW, doc, rect, text, setColor } = ctx;
  let y = drawHeader(ctx, result, `${s(result.term).toUpperCase()} TERM STUDENT'S PERFORMANCE REPORT`);

  const infoW = CW * 0.70, attW = CW * 0.28, attX = ML + infoW + CW * 0.02;
  const infoRows: [string, string][][] = [
    [["Name:", s(result.studentName)], ["Gender:", s(result.gender)]],
    [["Class:", s(result.class)], ["Session:", s(result.session)]],
    [["Admsn No:", s(result.admissionNumber)], ["D.O.B:", s((result as any).dob)]],
    [["Age:", s(result.age)], ["Ht/Wt:", `${s(result.height, "-")} / ${s(result.weight, "-")}`]],
    [["Club/Society:", s(result.club)], ["Fav. Colour:", s(result.favColor)]],
  ];
  if (result.house) infoRows[1].push(["House:", s(result.house)] as any);
  const infoBottom = drawInfoBar({ ...ctx, CW: infoW } as Ctx, y, infoRows);
  const attBottom = drawAttendanceBox(ctx, attX, y, attW, result);
  y = Math.max(infoBottom, attBottom);
  ctx.setY(y);

  const scaleVariant = result.gradingScaleVariant && GRADING_SCALE_VARIANTS[result.gradingScaleVariant]
    ? GRADING_SCALE_VARIANTS[result.gradingScaleVariant]
    : WAEC_GRADING_SCALE;

  const subjects = result.subjects ?? [];
  const breakdownCA = subjects.some((sub: any) => sub.notes != null || sub.assignment != null || sub.test != null);
  const detailed = subjects.some((sub: any) => sub.classMin != null || sub.classMax != null || sub.classAvg != null);
  const term = result.term;

  const cols: SubjectCol[] = [{ header: "Subject", width: 0.20, align: "left", get: (sub) => s(sub.name, "Subject") }];
  if (breakdownCA) {
    cols.push({ header: "1st", width: 0.055, get: (sub: any) => s(sub.notes) });
    cols.push({ header: "2nd", width: 0.055, get: (sub: any) => s(sub.assignment) });
    cols.push({ header: "3rd", width: 0.055, get: (sub: any) => s(sub.test) });
  } else {
    cols.push({ header: "C.A.", width: 0.09, get: (sub: any) => s((sub.cat1Total ?? 0) + (sub.cat2Total ?? 0) || sub.cat1Total) });
  }
  cols.push({ header: "Exam", width: 0.09, get: (sub: any) => s(sub.examScore) });
  cols.push({ header: "Total", width: 0.08, get: (sub) => s(sub.score) });
  if (term === "Third") {
    cols.push({ header: "2nd Term", width: 0.08, get: (sub: any) => s(sub.prevTerm2Total) });
    cols.push({ header: "1st Term", width: 0.08, get: (sub: any) => s(sub.prevTerm1Total) });
    cols.push({ header: "Cum. Avg", width: 0.08, get: (sub: any) => {
      const vals = [sub.score, sub.prevTerm1Total, sub.prevTerm2Total].filter((v: any) => typeof v === "number");
      return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : "—";
    }});
  } else if (term === "Second") {
    cols.push({ header: "1st Term", width: 0.09, get: (sub: any) => s(sub.prevTerm1Total) });
  }
  cols.push({ header: "Grade", width: 0.07, get: (sub) => s(sub.grade) });
  cols.push({ header: "Position", width: 0.08, get: (sub: any) => (sub.subjectPosition ? ordinal(sub.subjectPosition) : "—") });
  if (detailed) {
    cols.push({ header: "Cls Min", width: 0.07, get: (sub: any) => s(sub.classMin) });
    cols.push({ header: "Cls Max", width: 0.07, get: (sub: any) => s(sub.classMax) });
    cols.push({ header: "Cls Avg", width: 0.07, get: (sub: any) => s(sub.classAvg) });
  } else {
    cols.push({ header: "Remark", width: 0.14, align: "left", get: (sub) => s(sub.remark) });
  }
  const totalW = cols.reduce((a, c) => a + c.width, 0);
  cols.forEach((c) => (c.width = c.width / totalW));

  y = drawSectionTitle(ctx, y, "ACADEMIC");
  y = drawSubjectTable(ctx, y, cols, subjects);

  const leftW = CW * 0.62, rightW = CW * 0.36, gap = CW * 0.02, rightX = ML + leftW + gap;
  let leftY = y, rightY = y;

  leftY = drawSummaryBox(ctx, ML, leftY, leftW, "Performance Summary", [
    ["Total Obtainable", String(subjects.length * 100)],
    ["Total Obtained", s(result.totalScore, "0")],
    ["Total Subjects", String(subjects.length)],
    ["Average %", result.averageScore != null ? result.averageScore.toFixed(1) + "%" : "—"],
    ["Overall Grade", s(result.overallGrade)],
    ["Position in Class", result.position ? ordinal(result.position) : "N/A"],
  ]);
  leftY = ctx.checkBreak(leftY, 20);
  leftY = drawGradeAnalysis(ctx, ML, leftY, leftW, subjects, scaleVariant);

  rightY = drawRatingTable(ctx, rightX, rightY, rightW, "Affective Domain", AFFECTIVE_TRAITS, result.affectiveDomain);
  rightY = ctx.checkBreak(rightY, 10);
  rightY = drawRatingTable(ctx, rightX, rightY, rightW, "Psychomotor Domain", PSYCHOMOTOR_SKILLS, result.psychomotorSkills);

  y = Math.max(leftY, rightY) + 2;
  ctx.setY(y);

    y = ctx.checkBreak(y, 30);
  const scaleBottom = drawGradeScaleBox(ctx, ML, y, CW * 0.46, scaleVariant, "Grade Scale");
  rect(ML + CW * 0.5, y, CW * 0.48, 6, C_PRIMARY);
  doc.setFont("helvetica", "bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Rating Indices", ML + CW * 0.5 + CW * 0.24, y + 4, { align: "center" });
  let riY = y + 6;
  rect(ML + CW * 0.5, riY, CW * 0.48, RATING_SCALE_NOTES.length * 4.2 + 2, C_ROW_A, C_BORDER);
  RATING_SCALE_NOTES.forEach((note, idx) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(5.8); setColor(C_TEXT);
    text(s(note), ML + CW * 0.5 + 2, riY + 3.2 + idx * 4.2);
  });
  riY += RATING_SCALE_NOTES.length * 4.2 + 4;
  y = Math.max(scaleBottom, riY) + 2;
  ctx.setY(y);

  y = drawComment(ctx, "Teacher's Remark", s(result.teacherComment), getTeacherName(result.createdBy), y);
  ctx.setY(y);
  y = drawComment(ctx, "Principal's Remark", s(result.principalComment), getPrincipalName(), y);
  ctx.setY(y);

    y = ctx.checkBreak(y, 32);
  y += 2;
  y = drawSignatureRow(ctx, y, "Teacher's Signature", getTeacherSignature(result.createdBy), "Principal's Signature", getPrincipalSignature());
  ctx.setY(y);
  drawFooter(ctx, result, y);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE: midterm (Image 9) — 1st/2nd C.A. only, grade-analysis, mid-term summary
// ═══════════════════════════════════════════════════════════════════════════

function renderMidterm(ctx: Ctx, result: Result): void {
  const { ML, CW } = ctx;
  let y = drawHeader(ctx, result, `MID ${s(result.term).toUpperCase()} TERM ${s(result.session)} SESSION REPORT`);
  y = drawSectionTitle(ctx, y, "ACADEMIC");

  const subjects = result.subjects ?? [];
  const cols: SubjectCol[] = [
    { header: "Subject", width: 0.30, align: "left", get: (sub) => s(sub.name, "Subject") },
    { header: "First Test",       width: 0.07, obtainable: "10", get: (sub: any) => s(sub.midtermCA1) },
    { header: "Second Test",      width: 0.07, obtainable: "10", get: (sub: any) => s(sub.midtermCA2) },
    { header: "Total Score",      width: 0.07, get: (sub) => s(sub.score) },
    { header: "Total Obtainable", width: 0.07, get: () => "20" },
    { header: "Percentage",       width: 0.08, get: (sub: any) => (sub.score != null ? `${((sub.score / 20) * 100).toFixed(1)}%` : "—") },
    { header: "Grade",            width: 0.06, get: (sub) => s(sub.grade) },
    { header: "Position",         width: 0.07, get: (sub: any) => (sub.subjectPosition ? ordinal(sub.subjectPosition) : "—") },
    { header: "Lowest",           width: 0.07, get: (sub: any) => s(sub.classMin) },
    { header: "Class Average",    width: 0.07, get: (sub: any) => (sub.classAvg != null ? Number(sub.classAvg).toFixed(1) : "—") },
    { header: "Highest",          width: 0.07, get: (sub: any) => s(sub.classMax) },
  ];
  const totalW = cols.reduce((a, c) => a + c.width, 0);
  cols.forEach((c) => (c.width = c.width / totalW));
  y = drawSubjectTable(ctx, y, cols, subjects);

  // Totals line
  const totalScore = result.totalScore ?? subjects.reduce((a, sub) => a + (sub.score ?? 0), 0);
  const studentAvg = subjects.length ? (totalScore / subjects.length).toFixed(2) : "—";
  const avgs = subjects.map((sub: any) => sub.classAvg).filter((v: any) => typeof v === "number");
  const classAvg = avgs.length ? (avgs.reduce((a: number, b: number) => a + b, 0) / avgs.length).toFixed(2) : "—";
  y = ctx.checkBreak(y, 40);
  const totals: [string, string][] = [
    ["Total Obtainable", String(subjects.length * 20)],
    ["Total Score", String(totalScore)],
    ["Student Average", studentAvg],
    ["Class Average", classAvg],
  ];
  if (result.position) totals.push(["Position", ordinal(result.position)]);
  y = drawTotalsLine(ctx, y + 2, totals);
  y = drawGradeLegend(ctx, y + 1, MIDTERM_GRADING_SCALE);

  y = drawComment(ctx, "Class Teacher's Remark", s(result.teacherComment), getTeacherName(result.createdBy), y);
  y = drawComment(ctx, "Principal's Remark", s(result.principalComment), getPrincipalName(), y);

  y = drawSignatureRow(ctx, y + 2, "Class Teacher's Signature", getTeacherSignature(result.createdBy), "Principal's Signature & Stamp", getPrincipalSignature());
  drawFooter(ctx, result, y, "Next School Begins");
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

const RENDERERS: Record<ReportStyle, (ctx: Ctx, result: Result) => void> = {
  preschool: renderPreschool,
  nursery: renderNursery,
  primary: renderPrimary,
  standard: renderStandard,
  midterm: renderMidterm,
};

export async function generateResultPDF(result: Result): Promise<Blob> {
  const jsPDFModule = await import("jspdf");
  const JsPDF = (jsPDFModule as any).default ?? (jsPDFModule as any).jsPDF ?? jsPDFModule;
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ctx = makeCtx(doc);

  const style = getReportStyle(result.class, result.resultType);
  const renderer = RENDERERS[style] || renderStandard;
  renderer(ctx, result);

  // "page i of N" label, top-left of every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); ctx.setColor(C_PRIMARY);
    doc.text(`page ${i} of ${pages}`, ctx.ML, 9);
  }

  return doc.output("blob");
}

// ─── Download helper ──────────────────────────────────────────────────────────

export async function downloadResultPDF(result: Result): Promise<void> {
  const blob = await generateResultPDF(result);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = s(result.studentName, "Student").replace(/\s+/g, "_");
  const safeSess = s(result.session).replace(/\//g, "-");
  link.href = url;
  link.download = `${safeName}_${s(result.term)}_${s(result.resultType)}_${safeSess}.pdf`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Keep legacy export for any code that imports SchoolInfo / DEFAULT_SCHOOL
export interface SchoolInfo { name: string; motto?: string; address?: string; }
export const DEFAULT_SCHOOL: SchoolInfo = {
  name: "SCHOOL RESULT MANAGEMENT SYSTEM",
  motto: "",
  address: "",
};