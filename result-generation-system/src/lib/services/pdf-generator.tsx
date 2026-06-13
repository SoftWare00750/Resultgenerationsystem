// PDF Result Generator — FULLY FIXED
// Root cause of "Cannot read properties of undefined (reading 'hasOwnProperty')":
//   @react-pdf/renderer internally calls .hasOwnProperty() on every child node.
//   If ANY child is a raw number, boolean, null, or undefined, it crashes.
//   Fix: every value that enters <Text>…</Text> MUST be converted to a string
//   BEFORE reaching JSX. We also guard against undefined/null objects
//   throughout the component tree.

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import {
  Result,
  AFFECTIVE_TRAITS,
  PSYCHOMOTOR_SKILLS,
  RATING_SCALE_NOTES,
  GRADING_SCALE,
} from '@/lib/types';
import { getOrdinalSuffix } from '@/lib/utils';

// ─── Safe string coercer ──────────────────────────────────────────────────────
// NEVER pass the raw value as a JSX child — always call str() first.
const str = (v: unknown, fallback = '—'): string => {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s === '' ? fallback : s;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_PRIMARY   = '#1f3d2e';
const COLOR_HEADER_BG = '#f3d9b1';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: { padding: 24, backgroundColor: '#ffffff', fontSize: 8.5 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLOR_PRIMARY,
    paddingBottom: 6,
    marginBottom: 6,
  },
  logo:            { width: 50, height: 50, marginRight: 10 },
  logoPlaceholder: { width: 50, height: 50, marginRight: 10, backgroundColor: '#e5e5e5' },
  headerCenter:    { flex: 1, alignItems: 'center' },
  schoolName:      { fontSize: 16, fontWeight: 'bold', color: COLOR_PRIMARY, textAlign: 'center' },
  motto:           { fontSize: 8, textAlign: 'center', marginTop: 1 },
  addressLine:     { fontSize: 7, textAlign: 'center', color: '#444444', marginTop: 1 },
  reportTitle:     { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 6, textTransform: 'uppercase' },
  reportSubtitle:  { fontSize: 9, fontWeight: 'bold', textAlign: 'center', marginTop: 2, textTransform: 'uppercase', color: COLOR_PRIMARY },

  infoBar:   { borderWidth: 1, borderColor: '#cccccc', padding: 5, marginTop: 6, marginBottom: 6 },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  infoLabel: { fontWeight: 'bold' },

  twoCol:  { flexDirection: 'row' },
  colLeft: { flex: 2, marginRight: 8 },
  colRight:{ flex: 1 },

  table:    { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  tHeadRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  tRow:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#dddddd' },
  th: {
    color: '#ffffff', fontSize: 7, fontWeight: 'bold', padding: 3,
    textAlign: 'center', borderRightWidth: 1, borderRightColor: '#ffffff33',
  },
  td: {
    fontSize: 7.5, padding: 3, textAlign: 'center',
    borderRightWidth: 1, borderRightColor: '#eeeeee',
  },
  subjectCol: { width: '26%', textAlign: 'left' },
  scoreCol:   { width: '8%' },
  gradeCol:   { width: '7%' },
  posCol:     { width: '9%' },
  remarkCol:  { width: '17%', textAlign: 'left' },
  avgCol:     { width: '9%' },

  box:      { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  boxTitle: { backgroundColor: COLOR_PRIMARY, color: '#ffffff', fontSize: 8, fontWeight: 'bold', padding: 3, textAlign: 'center' },
  boxRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 3, borderTopWidth: 1, borderTopColor: '#eeeeee' },

  ratingHeaderRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  ratingLabelCol:  { width: '60%', color: '#fff', fontSize: 7, fontWeight: 'bold', padding: 3 },
  ratingNumCol: {
    width: '8%', color: '#fff', fontSize: 7, fontWeight: 'bold', padding: 3,
    textAlign: 'center', borderLeftWidth: 1, borderLeftColor: '#ffffff55',
  },
  ratingRow:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eeeeee' },
  ratingLabel: { width: '60%', fontSize: 7.5, padding: 3 },
  ratingCell:  { width: '8%', fontSize: 8, padding: 3, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: '#eeeeee' },

  summaryBox:   { borderWidth: 1, borderColor: '#bbbbbb', marginTop: 4, marginBottom: 6 },
  summaryTitle: { backgroundColor: COLOR_HEADER_BG, fontSize: 8.5, fontWeight: 'bold', padding: 4, textAlign: 'center' },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 3, borderTopWidth: 1, borderTopColor: '#eeeeee' },

  commentBox:   { borderWidth: 1, borderColor: '#bbbbbb', padding: 5, marginBottom: 6 },
  commentLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  commentText:  { fontSize: 8, lineHeight: 1.4, minHeight: 22 },
  signLine:     { textAlign: 'right', fontSize: 7.5, marginTop: 2 },

  gradeScaleTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  gradeScaleText:  { fontSize: 7, lineHeight: 1.4, textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 14, left: 24, right: 24,
    textAlign: 'center', fontSize: 7, color: '#888888',
    borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 4,
  },

  nextTermRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 8 },
});

// ─── School info ──────────────────────────────────────────────────────────────
export interface SchoolInfo {
  name: string;
  motto?: string;
  address?: string;
  logoDataUri?: string;
}

export const DEFAULT_SCHOOL: SchoolInfo = {
  name:    'CHRIST IS THE ANSWER GROUP OF SCHOOLS',
  motto:   'Motto: KNOWLEDGE IS FREEDOM',
  address: 'Idumegan Quarters, Ekpoma, Edo State.',
};

const LOGO_PUBLIC_PATH = '/images/Result%20Generation%20System.jpg';

export async function fetchLogoAsDataUri(): Promise<string | undefined> {
  try {
    const response = await fetch(LOGO_PUBLIC_PATH);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Header = ({ result, school }: { result: Result; school: SchoolInfo }) => {
  // Build all dynamic strings in JS — never in JSX interpolation
  const titleText = result.resultType === 'Midterm'
    ? 'Mid Term Report'
    : str(result.term) + " Term Student's Performance Report";

  const subtitleText = result.resultType === 'Midterm'
    ? str(result.term).toUpperCase() + ' TERM (MID TERM) PERFORMANCE REPORT'
    : '';

  return (
    <View>
      <View style={styles.headerRow}>
        {school.logoDataUri
          ? <Image style={styles.logo} src={school.logoDataUri} />
          : <View  style={styles.logoPlaceholder} />
        }
        <View style={styles.headerCenter}>
          <Text style={styles.schoolName}>{str(school.name)}</Text>
          {school.motto   ? <Text style={styles.motto}      >{str(school.motto)}</Text>   : null}
          {school.address ? <Text style={styles.addressLine}>{str(school.address)}</Text> : null}
        </View>
      </View>
      <Text style={styles.reportTitle}>{titleText}</Text>
      {subtitleText ? <Text style={styles.reportSubtitle}>{subtitleText}</Text> : null}
    </View>
  );
};

const StudentInfoBar = ({ result }: { result: Result }) => {
  // Pre-build every label+value pair as a single string
  const nameText    = 'Name: '    + str(result.studentName);
  const classText   = 'Class: '   + str(result.class);
  const sessionText = 'Session: ' + str(result.session);
  const admText     = 'Admission No: ' + str(result.admissionNumber);
  const ageText     = 'Age: '     + str((result as any).age);
  const houseText   = 'House: '   + str(result.house);
  const clubText    = 'Club/Society: ' + str(result.club);

  return (
    <View style={styles.infoBar}>
      <View style={styles.infoRow}>
        <Text>{nameText}</Text>
        <Text>{classText}</Text>
        <Text>{sessionText}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text>{admText}</Text>
        <Text>{ageText}</Text>
        <Text>{houseText}</Text>
        <Text>{clubText}</Text>
      </View>
    </View>
  );
};

const SubjectsTable = ({ result }: { result: Result }) => (
  <View style={styles.table}>
    <View style={styles.tHeadRow}>
      <Text style={[styles.th, styles.subjectCol]}>{'Subject'}</Text>
      <Text style={[styles.th, styles.scoreCol]}>{'Score'}</Text>
      <Text style={[styles.th, styles.scoreCol]}>{'%'}</Text>
      <Text style={[styles.th, styles.gradeCol]}>{'Grade'}</Text>
      <Text style={[styles.th, styles.posCol]}>{'Position'}</Text>
      <Text style={[styles.th, styles.remarkCol]}>{'Remark'}</Text>
      <Text style={[styles.th, styles.avgCol]}>{'Class Avg'}</Text>
    </View>

    {(result.subjects ?? []).map((s, i) => {
      // Convert ALL values to strings here, before JSX
      const name  = str(s?.name,  'Subject');
      // score may be a number — must be stringified
      const score = s?.score != null ? String(s.score) : '0';
      const grade = str(s?.grade);
      const remark = str(s?.remark);

      return (
        <View key={String(i)} style={styles.tRow}>
          <Text style={[styles.td, styles.subjectCol]}>{name}</Text>
          <Text style={[styles.td, styles.scoreCol]}>{score}</Text>
          <Text style={[styles.td, styles.scoreCol]}>{score}</Text>
          <Text style={[styles.td, styles.gradeCol]}>{grade}</Text>
          <Text style={[styles.td, styles.posCol]}>{'—'}</Text>
          <Text style={[styles.td, styles.remarkCol]}>{remark}</Text>
          <Text style={[styles.td, styles.avgCol]}>{'—'}</Text>
        </View>
      );
    })}
  </View>
);

const AttendanceBox = ({ result }: { result: Result }) => {
  const a = result.attendance ?? { opened: 0, present: 0, absent: 0 };
  // Convert numbers to strings up-front
  const opened  = String(a.opened  ?? 0);
  const present = String(a.present ?? 0);
  const absent  = String(a.absent  ?? 0);
  const openedNum = Number(a.opened ?? 0);
  const presentNum = Number(a.present ?? 0);
  const pct = openedNum > 0
    ? present + ' (' + ((presentNum / openedNum) * 100).toFixed(1) + '%)'
    : present;

  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>{'Attendance Summary'}</Text>
      <View style={styles.boxRow}>
        <Text>{'Times School Opened'}</Text>
        <Text>{opened}</Text>
      </View>
      <View style={styles.boxRow}>
        <Text>{'No of Times Present'}</Text>
        <Text>{pct}</Text>
      </View>
      <View style={styles.boxRow}>
        <Text>{'No of Times Absent'}</Text>
        <Text>{absent}</Text>
      </View>
    </View>
  );
};

const SummaryBox = ({ result }: { result: Result }) => {
  const subjects = result.subjects ?? [];
  // All arithmetic done in JS — results stored as strings
  const totalObtainable = String(subjects.length * 100);
  const totalObtained   = result.totalScore != null ? String(result.totalScore) : '0';
  const avg = result.averageScore != null
    ? result.averageScore.toFixed(1) + '%'
    : '—';
  const pos          = result.position ? getOrdinalSuffix(result.position) : 'N/A';
  const subjectCount = String(subjects.length);
  const grade        = str(result.overallGrade);

  const title = result.resultType === 'Midterm'
    ? 'Mid Term Performance Summary'
    : 'Performance Summary';

  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <View style={styles.summaryRow}><Text>{'Total Obtainable'}</Text>  <Text>{totalObtainable}</Text></View>
      <View style={styles.summaryRow}><Text>{'Total Obtained'}</Text>    <Text>{totalObtained}</Text></View>
      <View style={styles.summaryRow}><Text>{'Total Subjects Offered'}</Text><Text>{subjectCount}</Text></View>
      <View style={styles.summaryRow}><Text>{'%TAGE'}</Text>             <Text>{avg}</Text></View>
      <View style={styles.summaryRow}><Text>{'Grade'}</Text>             <Text>{grade}</Text></View>
      <View style={styles.summaryRow}><Text>{'Position'}</Text>          <Text>{pos}</Text></View>
    </View>
  );
};

const GradeScale = () => {
  const scaleText = GRADING_SCALE
    .map(g => g.grade + ' (' + String(g.min) + '-' + String(g.max) + '%): ' + g.remark)
    .join('  |  ');

  return (
    <View style={styles.box}>
      <Text style={styles.gradeScaleTitle}>{'Grading Scale'}</Text>
      <Text style={styles.gradeScaleText}>{scaleText}</Text>
    </View>
  );
};

const RatingTable = ({
  title,
  labels,
  ratings,
}: {
  title:    string;
  labels:   readonly string[];
  ratings?: Record<string, number>;
}) => {
  const ratingNums = [5, 4, 3, 2, 1];

  return (
    <View style={styles.box}>
      <View style={styles.ratingHeaderRow}>
        <Text style={styles.ratingLabelCol}>{str(title)}</Text>
        {ratingNums.map(n => (
          <Text key={String(n)} style={styles.ratingNumCol}>{String(n)}</Text>
        ))}
      </View>

      {labels.map(label => {
        // value is always a number (or defaulted to 0) — convert cells to strings
        const value = ratings?.[label] ?? 0;
        return (
          <View key={label} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{str(label)}</Text>
            {ratingNums.map(n => {
              // Produce a plain string — never a conditional expression that
              // could return a number or boolean
              const cellText: string = value === n ? '\u2713' : ' ';
              return (
                <Text key={String(n)} style={styles.ratingCell}>{cellText}</Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const RatingLegend = () => (
  <View style={styles.box}>
    <Text style={styles.boxTitle}>{'Rating Indices'}</Text>
    <View style={{ padding: 4 }}>
      {RATING_SCALE_NOTES.map((line, i) => (
        <Text key={String(i)} style={{ fontSize: 6.5, lineHeight: 1.4 }}>{str(line)}</Text>
      ))}
    </View>
  </View>
);

const Comments = ({ result }: { result: Result }) => {
  const teacherComment   = str(result.teacherComment);
  const principalComment = str(result.principalComment);

  return (
    <View>
      <View style={styles.commentBox}>
        <Text style={styles.commentLabel}>{"Class Teacher's Remark"}</Text>
        <Text style={styles.commentText}>{teacherComment}</Text>
        <Text style={styles.signLine}>{'Sign: ______________________'}</Text>
      </View>
      <View style={styles.commentBox}>
        <Text style={styles.commentLabel}>{"Principal's Remark"}</Text>
        <Text style={styles.commentText}>{principalComment}</Text>
        <Text style={styles.signLine}>{'Sign: ______________________'}</Text>
      </View>
    </View>
  );
};

const Footer = ({ school }: { school: SchoolInfo }) => {
  const footerText =
    str(school.name) +
    ' \u00A9 ' +
    String(new Date().getFullYear()) +
    ' \u2022 Generated on ' +
    new Date().toLocaleDateString();

  return (
    <View style={styles.footer}>
      <Text>{footerText}</Text>
    </View>
  );
};

// ─── Next-term row ────────────────────────────────────────────────────────────
const NextTermRow = ({ result }: { result: Result }) => {
  const label = result.term === 'Third' ? 'Session' : 'Term';
  const nextText = 'Next ' + label + ' Begins: ____________________';
  const dateText = 'Date: ' + new Date().toLocaleDateString();

  return (
    <View style={styles.nextTermRow}>
      <Text>{nextText}</Text>
      <Text>{dateText}</Text>
    </View>
  );
};

// ─── Main document ────────────────────────────────────────────────────────────
interface ResultPDFDocumentProps {
  result: Result;
  school?: SchoolInfo;
}

export const ResultPDFDocument = ({
  result,
  school = DEFAULT_SCHOOL,
}: ResultPDFDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header result={result} school={school} />
      <StudentInfoBar result={result} />
      <SubjectsTable result={result} />

      <View style={styles.twoCol}>
        <View style={styles.colLeft}>
          <SummaryBox result={result} />
          {result.resultType === 'Examination' ? (
            <>
              <RatingTable
                title="Affective Domain"
                labels={AFFECTIVE_TRAITS}
                ratings={result.affectiveDomain}
              />
              <RatingTable
                title="Psychomotor Skills"
                labels={PSYCHOMOTOR_SKILLS}
                ratings={result.psychomotorSkills}
              />
            </>
          ) : null}
        </View>
        <View style={styles.colRight}>
          <AttendanceBox result={result} />
          <GradeScale />
          {result.resultType === 'Examination' ? <RatingLegend /> : null}
        </View>
      </View>

      <Comments result={result} />
      <NextTermRow result={result} />
      <Footer school={school} />
    </Page>
  </Document>
);

// ─── Public API ───────────────────────────────────────────────────────────────

export const generateResultPDF = async (
  result: Result,
  school?: SchoolInfo,
): Promise<Blob> => {
  const { pdf } = await import('@react-pdf/renderer');

  // Deep-sanitize the result object so no numeric/null/undefined value
  // can leak into a <Text> child inside the document tree.
  const safeSubjects = (result.subjects ?? [])
    .filter(Boolean)
    .map(s => ({
      name:   typeof s?.name  === 'string' ? s.name  : 'Subject',
      // Ensure score is always a number (never undefined/null/string)
      score:  typeof s?.score === 'number' ? s.score : (parseFloat(String(s?.score)) || 0),
      grade:  typeof s?.grade  === 'string' ? s.grade  : '',
      remark: typeof s?.remark === 'string' ? s.remark : '',
    }));

  const safeResult: Result = {
    ...result,
    subjects:         safeSubjects,
    totalScore:       typeof result.totalScore   === 'number' ? result.totalScore   : 0,
    averageScore:     typeof result.averageScore  === 'number' ? result.averageScore  : 0,
    overallGrade:     result.overallGrade ?? '',
    position:         typeof result.position === 'number' ? result.position : undefined,
    teacherComment:   result.teacherComment   ?? '',
    principalComment: result.principalComment ?? '',
    house:            result.house ?? '',
    club:             result.club  ?? '',
    age:              result.age   ?? '',
    attendance:       result.attendance ?? { opened: 0, present: 0, absent: 0 },
    affectiveDomain:  result.affectiveDomain  ?? {},
    psychomotorSkills: result.psychomotorSkills ?? {},
  };

  const logoDataUri = await fetchLogoAsDataUri();
  const resolvedSchool: SchoolInfo = {
    ...(school ?? DEFAULT_SCHOOL),
    logoDataUri,
  };

  return pdf(
    <ResultPDFDocument result={safeResult} school={resolvedSchool} />
  ).toBlob();
};

export const downloadResultPDF = async (
  result:  Result,
  school?: SchoolInfo,
): Promise<void> => {
  const { downloadPDF } = await import('@/lib/export');
  const blob     = await generateResultPDF(result, school);
  const safeName = result.studentName.replace(/\s+/g, '_');
  const safeSess = result.session.replace(/\//g, '-');
  const filename = `${safeName}_${result.term}_${result.resultType}_${safeSess}.pdf`;
  downloadPDF(blob, filename);
};