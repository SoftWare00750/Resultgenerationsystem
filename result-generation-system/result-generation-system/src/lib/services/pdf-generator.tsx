/**
 * pdf-generator.tsx
 *
 * jsPDF-based result sheet generator with:
 * - School logo, name, address, motto (from school info store)
 * - Student passport photo (from student record)
 * - Teacher's signature
 * - Principal's signature
 * - Full affective/psychomotor domain tables
 */

import {
  Result,
  GRADING_SCALE,
  AFFECTIVE_TRAITS,
  PSYCHOMOTOR_SKILLS,
  RATING_SCALE_NOTES,
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
const C_PRIMARY   = "#1f3d2e";
const C_HEADER_BG = "#f3d9b1";
const C_WHITE     = "#ffffff";
const C_LIGHT     = "#f9f9f9";
const C_BORDER    = "#bbbbbb";
const C_TEXT      = "#111111";
const C_MUTED     = "#555555";

// ─── Resolve student photo from local storage ─────────────────────────────────

function getStudentPhoto(admissionNumber: string): string | null {
  try {
    // Try system_students_backup (teacher-managed with photos)
    const backup = JSON.parse(localStorage.getItem("system_students_backup") || "[]");
    const match = backup.find(
      (s: any) => s.admissionNumber === admissionNumber && s.photo
    );
    if (match?.photo) return match.photo;

    // Fall back to main students store
    const students = getStore<any>(KEYS.students);
    const s2 = students.find(
      (s: any) => s.admissionNumber === admissionNumber && s.photo
    );
    return s2?.photo || null;
  } catch {
    return null;
  }
}

// ─── Resolve teacher signature ────────────────────────────────────────────────

function getTeacherSignature(createdBy: string): string | null {
  return getSignatures()[createdBy] || null;
}

// ─── Resolve principal (admin) signature ─────────────────────────────────────

function getPrincipalSignature(): string | null {
  const sigs = getSignatures();
  // Admin users have role=admin; find first admin user and get their signature
  const users = getStore<any>(KEYS.users);
  const admin = users.find((u: any) => u.role === "admin");
  if (admin) return sigs[admin.$id] || null;
  return sigs["admin-001"] || null;
}

// ─── Add image safely ────────────────────────────────────────────────────────

function safeAddImage(
  doc: any,
  dataUrl: string,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  try {
    if (!dataUrl || !dataUrl.startsWith("data:")) return false;
    const fmt = dataUrl.includes("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(dataUrl, fmt, x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

export async function generateResultPDF(result: Result): Promise<Blob> {
  const jsPDFModule = await import("jspdf");
  const JsPDF =
    (jsPDFModule as any).default ?? (jsPDFModule as any).jsPDF ?? jsPDFModule;
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Pull runtime data
  const schoolInfo = getSchoolInfo();
  const schoolName    = schoolInfo?.name    || "SCHOOL RESULT MANAGEMENT SYSTEM";
  const schoolAddress = schoolInfo?.address || "";
  const schoolMotto   = schoolInfo?.motto   || "";
  const schoolLogo    = schoolInfo?.logo    || null;

  const studentPhoto      = getStudentPhoto(result.admissionNumber);
  const teacherSignature  = getTeacherSignature(result.createdBy);
  const principalSignature = getPrincipalSignature();

  const PW = 210;
  const PH = 297;
  const ML = 14;
  const MR = 14;
  const CW = PW - ML - MR;
  let y = 12;

  // ── doc helpers ──────────────────────────────────────────────────────────────
  const setColor = (hex: string) => { const [r,g,b]=hex2rgb(hex); doc.setTextColor(r,g,b); };
  const setFill  = (hex: string) => { const [r,g,b]=hex2rgb(hex); doc.setFillColor(r,g,b); };
  const setDraw  = (hex: string) => { const [r,g,b]=hex2rgb(hex); doc.setDrawColor(r,g,b); };

  const rect = (x:number,yy:number,w:number,h:number,fill:string,stroke?:string) => {
    setFill(fill);
    if (stroke) { setDraw(stroke); doc.rect(x,yy,w,h,"FD"); }
    else         { doc.rect(x,yy,w,h,"F"); }
  };

  const text = (txt:string,x:number,yy:number,opts:{align?:"left"|"center"|"right";maxWidth?:number}={}) => {
    doc.text(txt,x,yy,opts as any);
  };

  const line = (x1:number,y1:number,x2:number,y2:number,color=C_BORDER) => {
    setDraw(color); doc.line(x1,y1,x2,y2);
  };

  const checkBreak = (needed:number) => {
    if (y+needed > PH-14) { doc.addPage(); y=14; }
  };

  // ── HEADER ────────────────────────────────────────────────────────────────

  const HEADER_H = 28;
  rect(ML, y, CW, HEADER_H, "#f0f4f0");

  // Logo (left)
  const LOGO_SIZE = 22;
  if (schoolLogo) {
    safeAddImage(doc, schoolLogo, ML + 3, y + 3, LOGO_SIZE, LOGO_SIZE);
  }

  // Student passport photo (right)
  const PHOTO_W = 18;
  const PHOTO_H = 22;
  const photoX  = ML + CW - PHOTO_W - 3;
  if (studentPhoto) {
    safeAddImage(doc, studentPhoto, photoX, y + 3, PHOTO_W, PHOTO_H);
    setDraw(C_BORDER);
    doc.rect(photoX, y + 3, PHOTO_W, PHOTO_H);
  } else {
    rect(photoX, y + 3, PHOTO_W, PHOTO_H, "#e5e7eb", C_BORDER);
    doc.setFontSize(5.5);
    setColor(C_MUTED);
    text("PHOTO", photoX + PHOTO_W / 2, y + 3 + PHOTO_H / 2 + 1.5, { align: "center" });
  }

  // School name (centred, avoiding logo and photo)
  const textLeft  = ML + LOGO_SIZE + 6;
  const textRight = photoX - 3;
  const textCX    = (textLeft + textRight) / 2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  setColor(C_PRIMARY);
  text(schoolName, textCX, y + 7, { align: "center" });

  if (schoolMotto) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    setColor(C_MUTED);
    text(schoolMotto, textCX, y + 13, { align: "center" });
  }
  if (schoolAddress) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    text(schoolAddress, textCX, y + 19, { align: "center" });
  }

  y += HEADER_H + 3;

  // Title bar
  const isMidterm = result.resultType === "Midterm";
  const titleText = isMidterm
    ? `MID TERM REPORT — ${s(result.term).toUpperCase()} TERM`
    : `${s(result.term).toUpperCase()} TERM STUDENT'S PERFORMANCE REPORT`;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  setColor(C_PRIMARY);
  text(titleText, PW / 2, y, { align: "center" });
  y += 2;
  line(ML, y, ML + CW, y, C_PRIMARY);
  y += 4;

  // ── STUDENT INFO BAR ──────────────────────────────────────────────────────

  rect(ML, y, CW, 16, "#f5f5f5", C_BORDER);
  doc.setFontSize(7.5);
  const col1 = ML + 3, col2 = ML + CW * 0.38, col3 = ML + CW * 0.70;
  const r1y = y + 5, r2y = y + 11;

  doc.setFont("helvetica","bold"); setColor(C_TEXT);
  text("Name:", col1, r1y);
  doc.setFont("helvetica","normal");
  text(s(result.studentName), col1 + 13, r1y);

  doc.setFont("helvetica","bold");
  text("Class:", col2, r1y);
  doc.setFont("helvetica","normal");
  text(s(result.class), col2 + 12, r1y);

  doc.setFont("helvetica","bold");
  text("Session:", col3, r1y);
  doc.setFont("helvetica","normal");
  text(s(result.session), col3 + 17, r1y);

  doc.setFont("helvetica","bold");
  text("Adm No:", col1, r2y);
  doc.setFont("helvetica","normal");
  text(s(result.admissionNumber), col1 + 16, r2y);

  doc.setFont("helvetica","bold");
  text("Age:", col2, r2y);
  doc.setFont("helvetica","normal");
  text(s((result as any).age), col2 + 9, r2y);

  doc.setFont("helvetica","bold");
  text("House:", col3, r2y);
  doc.setFont("helvetica","normal");
  text(s(result.house), col3 + 14, r2y);

  y += 19;

  // ── SUBJECTS TABLE ────────────────────────────────────────────────────────

  checkBreak(30);
  const COL = {
    subject: CW * 0.28, cat1: CW * 0.09, cat2: CW * 0.09,
    exam: CW * 0.09, total: CW * 0.09, grade: CW * 0.08,
    pos: CW * 0.09, remark: CW * 0.19,
  };
  const ROW_H = 6, TH_H = 7;
  const widths = Object.values(COL);
  const headers = ["Subject","CAT 1","CAT 2","EXAM","Total","Grade","Position","Remark"];

  let cx = ML;
  rect(cx, y, CW, TH_H, C_PRIMARY);
  doc.setFontSize(7); doc.setFont("helvetica","bold"); setColor(C_WHITE);
  headers.forEach((h,i) => {
    const cx2 = cx + widths.slice(0,i).reduce((a,b)=>a+b,0);
    text(h, cx2 + widths[i]/2, y + TH_H - 1.5, { align:"center" });
  });
  y += TH_H;

  (result.subjects ?? []).forEach((sub,idx) => {
    checkBreak(ROW_H + 2);
    const bg = idx % 2 === 0 ? C_WHITE : C_LIGHT;
    rect(ML, y, CW, ROW_H, bg, C_BORDER);
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); setColor(C_TEXT);
    let xx = ML;
    const sa = sub as any;
    const cells = [
      s(sub?.name,"Subject"),
      s(sa?.cat1 != null ? sa.cat1 : ""),
      s(sa?.cat2 != null ? sa.cat2 : ""),
      s(sa?.exam != null ? sa.exam : ""),
      s(sub?.score),
      s(sub?.grade),
      "—",
      s(sub?.remark),
    ];
    widths.forEach((w,i) => {
      const align = (i===0||i===7) ? "left" : "center";
      const tx = align==="center" ? xx+w/2 : xx+2;
      text(cells[i], tx, y+ROW_H-1.5, { align });
      xx += w;
    });
    y += ROW_H;
  });
  line(ML, y, ML+CW, y);
  y += 5;

  // ── TWO COLUMN SECTION ────────────────────────────────────────────────────

  checkBreak(60);
  const leftW  = CW * 0.62;
  const rightW = CW * 0.36;
  const gap    = CW * 0.02;
  const leftX  = ML;
  const rightX = ML + leftW + gap;
  let leftY = y, rightY = y;

  // ── LEFT: Summary ──────────────────────────────────────────────────────────

  rect(leftX, leftY, leftW, 6, C_HEADER_BG, C_BORDER);
  doc.setFont("helvetica","bold"); doc.setFontSize(8); setColor(C_PRIMARY);
  text(isMidterm ? "Mid Term Performance Summary" : "Performance Summary", leftX+leftW/2, leftY+4, {align:"center"});
  leftY += 6;

  const totalObtainable = (result.subjects?.length ?? 0) * 100;
  const summaryRows = [
    ["Total Obtainable", String(totalObtainable)],
    ["Total Obtained",   s(result.totalScore, "0")],
    ["Total Subjects",   String(result.subjects?.length ?? 0)],
    ["Average %",        result.averageScore != null ? result.averageScore.toFixed(1)+"%" : "—"],
    ["Overall Grade",    s(result.overallGrade)],
    ["Position in Class",result.position ? ordinal(result.position) : "N/A"],
  ];

  summaryRows.forEach(([label, val], idx) => {
    const bg = idx%2===0 ? C_WHITE : C_LIGHT;
    rect(leftX, leftY, leftW, 5.5, bg, C_BORDER);
    doc.setFont("helvetica","normal"); doc.setFontSize(7.5); setColor(C_TEXT);
    text(label, leftX+3, leftY+3.8);
    doc.setFont("helvetica","bold");
    text(val, leftX+leftW-3, leftY+3.8, {align:"right"});
    leftY += 5.5;
  });
  leftY += 4;

  // ── LEFT: Affective + Psychomotor (exam only) ─────────────────────────────

  if (!isMidterm) {
    const drawRatingTable = (
      sx:number, sy:number, sw:number,
      title:string,
      labels:readonly string[],
      ratings:Record<string,number>|undefined
    ) => {
      rect(sx, sy, sw, 6, C_PRIMARY);
      doc.setFont("helvetica","bold"); doc.setFontSize(7); setColor(C_WHITE);
      text(title, sx+sw*0.30, sy+4);
      const labelW = sw*0.60, numW = sw*0.08;
      [5,4,3,2,1].forEach((n,i) => text(String(n), sx+labelW+numW*i+numW/2, sy+4, {align:"center"}));
      sy += 6;
      labels.forEach((label,idx) => {
        const bg = idx%2===0 ? C_WHITE : C_LIGHT;
        rect(sx, sy, sw, 5, bg, C_BORDER);
        doc.setFont("helvetica","normal"); doc.setFontSize(6.5); setColor(C_TEXT);
        text(s(label), sx+2, sy+3.5);
        const val = ratings?.[label] ?? 0;
        [5,4,3,2,1].forEach((n,i) => {
          if (val===n) {
            const cx2 = sx+labelW+numW*i+numW/2;
            doc.setFont("helvetica","bold"); setColor(C_PRIMARY);
            text("✓", cx2, sy+3.5, {align:"center"});
            doc.setFont("helvetica","normal"); setColor(C_TEXT);
          }
        });
        sy += 5;
      });
      return sy+2;
    };
    leftY = drawRatingTable(leftX,leftY,leftW,"Affective Domain",AFFECTIVE_TRAITS,result.affectiveDomain);
    checkBreak(10);
    leftY = drawRatingTable(leftX,leftY,leftW,"Psychomotor Skills",PSYCHOMOTOR_SKILLS,result.psychomotorSkills);
  }

  // ── RIGHT: Attendance ──────────────────────────────────────────────────────

  rect(rightX, rightY, rightW, 6, C_PRIMARY);
  doc.setFont("helvetica","bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Attendance", rightX+rightW/2, rightY+4, {align:"center"});
  rightY += 6;

  const att = result.attendance ?? { opened:0, present:0, absent:0 };
  [["School Days",String(att.opened??0)],["Present",String(att.present??0)],["Absent",String(att.absent??0)]].forEach(([l,v],idx)=>{
    const bg = idx%2===0 ? C_WHITE : C_LIGHT;
    rect(rightX,rightY,rightW,5.5,bg,C_BORDER);
    doc.setFont("helvetica","normal"); doc.setFontSize(7); setColor(C_TEXT);
    text(l,rightX+2,rightY+3.8);
    doc.setFont("helvetica","bold");
    text(v,rightX+rightW-2,rightY+3.8,{align:"right"});
    rightY += 5.5;
  });
  rightY += 4;

  // ── RIGHT: Grading Scale ───────────────────────────────────────────────────

  rect(rightX,rightY,rightW,6,C_PRIMARY);
  doc.setFont("helvetica","bold"); doc.setFontSize(7); setColor(C_WHITE);
  text("Grading Scale",rightX+rightW/2,rightY+4,{align:"center"});
  rightY += 6;

  GRADING_SCALE.forEach(({min,max,grade,remark},idx)=>{
    const bg = idx%2===0 ? C_WHITE : C_LIGHT;
    rect(rightX,rightY,rightW,5,bg,C_BORDER);
    doc.setFont("helvetica","bold"); doc.setFontSize(7); setColor(C_PRIMARY);
    text(grade,rightX+3,rightY+3.5);
    doc.setFont("helvetica","normal"); setColor(C_TEXT);
    text(`(${min}–${max}%) ${remark}`,rightX+9,rightY+3.5);
    rightY += 5;
  });
  rightY += 4;

  // ── RIGHT: Rating key ──────────────────────────────────────────────────────

  if (!isMidterm) {
    rect(rightX,rightY,rightW,6,C_PRIMARY);
    doc.setFont("helvetica","bold"); doc.setFontSize(7); setColor(C_WHITE);
    text("Rating Key",rightX+rightW/2,rightY+4,{align:"center"});
    rightY += 6;
    rect(rightX,rightY,rightW,RATING_SCALE_NOTES.length*5+2,C_WHITE,C_BORDER);
    RATING_SCALE_NOTES.forEach((note,idx)=>{
      doc.setFont("helvetica","normal"); doc.setFontSize(6); setColor(C_TEXT);
      text(s(note),rightX+2,rightY+3.5+idx*5);
    });
    rightY += RATING_SCALE_NOTES.length*5+4;
  }

  y = Math.max(leftY,rightY)+4;

  // ── COMMENTS ─────────────────────────────────────────────────────────────

  checkBreak(30);
  const COMMENT_H = 20;

  const drawComment = (title:string,comment:string,startY:number):number => {
    rect(ML,startY,CW,5.5,C_PRIMARY);
    doc.setFont("helvetica","bold"); doc.setFontSize(7.5); setColor(C_WHITE);
    text(title,ML+3,startY+3.8);
    startY += 5.5;
    rect(ML,startY,CW,COMMENT_H,C_WHITE,C_BORDER);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); setColor(C_TEXT);
    const wrapped = doc.splitTextToSize(s(comment,""),CW-6);
    wrapped.slice(0,3).forEach((ln:string,i:number)=>text(ln,ML+3,startY+5+i*5));
    doc.setFontSize(7); setColor(C_MUTED);
    text("Sign: ______________________",ML+CW-3,startY+COMMENT_H-3,{align:"right"});
    return startY+COMMENT_H+3;
  };

  y = drawComment("Class Teacher's Remark",s(result.teacherComment),y);
  checkBreak(30);
  y = drawComment("Principal's Remark",s(result.principalComment),y);

  // ── SIGNATURE ROW ─────────────────────────────────────────────────────────

  checkBreak(32);
  y += 4;

  const SIG_W = CW * 0.42;
  const SIG_H = 20;
  const sigGap = CW - 2 * SIG_W;

  // Teacher signature box
  rect(ML, y, SIG_W, SIG_H, C_WHITE, C_BORDER);
  doc.setFontSize(7); doc.setFont("helvetica","bold"); setColor(C_PRIMARY);
  text("Class Teacher's Signature", ML + SIG_W/2, y + 4, {align:"center"});
  if (teacherSignature) {
    safeAddImage(doc, teacherSignature, ML + 4, y + 5, SIG_W - 8, SIG_H - 10);
  }
  doc.setFont("helvetica","normal"); setColor(C_MUTED); doc.setFontSize(6.5);
  text("Signature & Date: _______________", ML + 4, y + SIG_H - 3);

  // Principal signature box
  const pSigX = ML + SIG_W + sigGap;
  rect(pSigX, y, SIG_W, SIG_H, C_WHITE, C_BORDER);
  doc.setFontSize(7); doc.setFont("helvetica","bold"); setColor(C_PRIMARY);
  text("Principal's Signature", pSigX + SIG_W/2, y + 4, {align:"center"});
  if (principalSignature) {
    safeAddImage(doc, principalSignature, pSigX + 4, y + 5, SIG_W - 8, SIG_H - 10);
  }
  doc.setFont("helvetica","normal"); setColor(C_MUTED); doc.setFontSize(6.5);
  text("Signature & Date: _______________", pSigX + 4, y + SIG_H - 3);

  y += SIG_H + 5;

  // ── NEXT TERM + FOOTER ────────────────────────────────────────────────────

  checkBreak(14);
  doc.setFont("helvetica","normal"); doc.setFontSize(8); setColor(C_TEXT);
  const nextLabel = result.term==="Third" ? "Next Session" : "Next Term";
  text(`${nextLabel} Begins: ____________________`, ML, y);
  text(`Date: ${new Date().toLocaleDateString()}`, ML+CW, y, {align:"right"});

  line(ML, PH-12, ML+CW, PH-12);
  doc.setFontSize(6.5); setColor(C_MUTED);
  text(
    `${schoolName} © ${new Date().getFullYear()} • Generated ${new Date().toLocaleDateString()}`,
    PW/2, PH-8, {align:"center"}
  );

  return doc.output("blob");
}

// ─── Download helper ──────────────────────────────────────────────────────────

export async function downloadResultPDF(result: Result): Promise<void> {
  const blob = await generateResultPDF(result);
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = s(result.studentName,"Student").replace(/\s+/g,"_");
  const safeSess = s(result.session).replace(/\//g,"-");
  link.href     = url;
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