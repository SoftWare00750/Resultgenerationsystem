// PDF Result Generator
// Fixes:
//   1. All <Text> children are coerced to strings — @react-pdf/renderer crashes
//      on undefined/null/number children with "Cannot read properties of undefined
//      (reading 'hasOwnProperty')".
//   2. Logo is fetched as a base64 data URI at call time so the renderer can embed it.
//   3. `gap` is not supported in this version of @react-pdf/renderer — replaced with margins.
//   4. borderBottom shorthand is not supported — expanded to borderBottomWidth/Color.

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Coerce any value to a non-empty string safe for <Text> children. */
const str = (v: unknown, fallback = '—'): string => {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s === '' ? fallback : s;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRIMARY = '#1f3d2e';
const COLOR_HEADER_BG = '#f3d9b1';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { padding: 24, backgroundColor: '#ffffff', fontSize: 8.5 },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLOR_PRIMARY,
    paddingBottom: 6,
    marginBottom: 6,
  },
  logo: { width: 50, height: 50, marginRight: 10 },
  logoPlaceholder: { width: 50, height: 50, marginRight: 10, backgroundColor: '#e5e5e5' },
  headerCenter: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: COLOR_PRIMARY, textAlign: 'center' },
  motto: { fontSize: 8, textAlign: 'center', marginTop: 1 },
  addressLine: { fontSize: 7, textAlign: 'center', color: '#444444', marginTop: 1 },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  reportSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'uppercase',
    color: COLOR_PRIMARY,
  },

  // Student info bar
  infoBar: {
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 5,
    marginTop: 6,
    marginBottom: 6,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  infoLabel: { fontWeight: 'bold' },

  // Layout columns — no `gap` (unsupported); use marginRight on left col instead
  twoCol: { flexDirection: 'row' },
  colLeft: { flex: 2, marginRight: 8 },
  colRight: { flex: 1 },

  // Subject table
  table: { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  tHeadRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#dddddd' },
  th: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
    padding: 3,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ffffff33',
  },
  td: {
    fontSize: 7.5,
    padding: 3,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eeeeee',
  },
  subjectCol: { width: '26%', textAlign: 'left' },
  scoreCol: { width: '8%' },
  gradeCol: { width: '7%' },
  posCol: { width: '9%' },
  remarkCol: { width: '17%', textAlign: 'left' },
  avgCol: { width: '9%' },

  // Side boxes
  box: { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  boxTitle: {
    backgroundColor: COLOR_PRIMARY,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    padding: 3,
    textAlign: 'center',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 3,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },

  // Ratings table
  ratingHeaderRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  ratingLabelCol: { width: '60%', color: '#fff', fontSize: 7, fontWeight: 'bold', padding: 3 },
  ratingNumCol: {
    width: '8%',
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
    padding: 3,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#ffffff55',
  },
  ratingRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eeeeee' },
  ratingLabel: { width: '60%', fontSize: 7.5, padding: 3 },
  ratingCell: {
    width: '8%',
    fontSize: 8,
    padding: 3,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eeeeee',
  },

  // Summary
  summaryBox: { borderWidth: 1, borderColor: '#bbbbbb', marginTop: 4, marginBottom: 6 },
  summaryTitle: {
    backgroundColor: COLOR_HEADER_BG,
    fontSize: 8.5,
    fontWeight: 'bold',
    padding: 4,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 3,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },

  // Comments
  commentBox: { borderWidth: 1, borderColor: '#bbbbbb', padding: 5, marginBottom: 6 },
  commentLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  commentText: { fontSize: 8, lineHeight: 1.4, minHeight: 22 },
  signLine: { textAlign: 'right', fontSize: 7.5, marginTop: 2 },

  gradeScaleTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  gradeScaleText: { fontSize: 7, lineHeight: 1.4, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    textAlign: 'center',
    fontSize: 7,
    color: '#888888',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 4,
  },

  nextTermRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 8 },
});

// ─── School info ──────────────────────────────────────────────────────────────

export interface SchoolInfo {
  name: string;
  motto?: string;
  address?: string;
  /** Base64 data URI populated at call time; leave undefined to render a placeholder. */
  logoDataUri?: string;
}

export const DEFAULT_SCHOOL: SchoolInfo = {
  name: 'CHRIST IS THE ANSWER GROUP OF SCHOOLS',
  motto: 'Motto: KNOWLEDGE IS FREEDOM',
  address: 'Idumegan Quarters, Ekpoma, Edo State.',
};

const LOGO_PUBLIC_PATH = '/images/Result%20Generation%20System.jpg';

/**
 * Fetches the school logo and converts it to a base64 data URI so that
 * @react-pdf/renderer can embed it without path-resolution issues.
 * Returns undefined on any failure — the PDF still generates without the logo.
 */
export async function fetchLogoAsDataUri(): Promise<string | undefined> {
  try {
    const response = await fetch(LOGO_PUBLIC_PATH);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Header = ({ result, school }: { result: Result; school: SchoolInfo }) => (
  <View>
    <View style={styles.headerRow}>
      {school.logoDataUri ? (
        <Image style={styles.logo} src={school.logoDataUri} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}
      <View style={styles.headerCenter}>
        <Text style={styles.schoolName}>{str(school.name)}</Text>
        {school.motto ? <Text style={styles.motto}>{str(school.motto)}</Text> : null}
        {school.address ? <Text style={styles.addressLine}>{str(school.address)}</Text> : null}
      </View>
    </View>
    <Text style={styles.reportTitle}>
      {result.resultType === 'Midterm'
        ? 'Mid Term Report'
        : `${str(result.term)} Term Student's Performance Report`}
    </Text>
    {result.resultType === 'Midterm' ? (
      <Text style={styles.reportSubtitle}>
        {str(result.term).toUpperCase()} TERM (MID TERM) PERFORMANCE REPORT
      </Text>
    ) : null}
  </View>
);

const StudentInfoBar = ({ result }: { result: Result }) => (
  <View style={styles.infoBar}>
    <View style={styles.infoRow}>
      <Text><Text style={styles.infoLabel}>{'Name: '}</Text>{str(result.studentName)}</Text>
      <Text><Text style={styles.infoLabel}>{'Class: '}</Text>{str(result.class)}</Text>
      <Text><Text style={styles.infoLabel}>{'Session: '}</Text>{str(result.session)}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text><Text style={styles.infoLabel}>{'Admission No: '}</Text>{str(result.admissionNumber)}</Text>
      <Text><Text style={styles.infoLabel}>{'House: '}</Text>{str(result.house)}</Text>
      <Text><Text style={styles.infoLabel}>{'Club/Society: '}</Text>{str(result.club)}</Text>
    </View>
  </View>
);

const SubjectsTable = ({ result }: { result: Result }) => (
  <View style={styles.table}>
    <View style={styles.tHeadRow}>
      <Text style={[styles.th, styles.subjectCol]}>Subject</Text>
      <Text style={[styles.th, styles.scoreCol]}>Score</Text>
      <Text style={[styles.th, styles.scoreCol]}>%</Text>
      <Text style={[styles.th, styles.gradeCol]}>Grade</Text>
      <Text style={[styles.th, styles.posCol]}>Position</Text>
      <Text style={[styles.th, styles.remarkCol]}>Remark</Text>
      <Text style={[styles.th, styles.avgCol]}>Class Avg</Text>
    </View>
    {(result.subjects ?? []).map((s, i) => (
      <View key={i} style={styles.tRow}>
        <Text style={[styles.td, styles.subjectCol]}>{str(s.name)}</Text>
        <Text style={[styles.td, styles.scoreCol]}>{str(s.score, '0')}</Text>
        <Text style={[styles.td, styles.scoreCol]}>{str(s.score, '0')}</Text>
        <Text style={[styles.td, styles.gradeCol]}>{str(s.grade)}</Text>
        <Text style={[styles.td, styles.posCol]}>-</Text>
        <Text style={[styles.td, styles.remarkCol]}>{str(s.remark)}</Text>
        <Text style={[styles.td, styles.avgCol]}>-</Text>
      </View>
    ))}
  </View>
);

const AttendanceBox = ({ result }: { result: Result }) => {
  const a = result.attendance;
  const pct =
    a && a.opened > 0 ? `(${((a.present / a.opened) * 100).toFixed(1)}%)` : '';
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>Attendance Summary</Text>
      <View style={styles.boxRow}>
        <Text>Times School Opened</Text>
        <Text>{str(a?.opened, '—')}</Text>
      </View>
      <View style={styles.boxRow}>
        <Text>No of Times Present</Text>
        <Text>{`${str(a?.present, '—')} ${pct}`}</Text>
      </View>
      <View style={styles.boxRow}>
        <Text>No of Times Absent</Text>
        <Text>{str(a?.absent, '—')}</Text>
      </View>
    </View>
  );
};

const SummaryBox = ({ result }: { result: Result }) => {
  const subjects = result.subjects ?? [];
  const totalObtainable = subjects.length * 100;
  const totalObtained = str(result.totalScore, '0');
  const avg = result.averageScore != null ? `${result.averageScore.toFixed(1)}%` : '—';
  const pos = result.position ? getOrdinalSuffix(result.position) : 'N/A';

  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryTitle}>
        {result.resultType === 'Midterm' ? 'Mid Term Performance Summary' : 'Performance Summary'}
      </Text>
      <View style={styles.summaryRow}><Text>Total Obtainable</Text><Text>{String(totalObtainable)}</Text></View>
      <View style={styles.summaryRow}><Text>Total Obtained</Text><Text>{totalObtained}</Text></View>
      <View style={styles.summaryRow}><Text>Total Subjects Offered</Text><Text>{String(subjects.length)}</Text></View>
      <View style={styles.summaryRow}><Text>%TAGE</Text><Text>{avg}</Text></View>
      <View style={styles.summaryRow}><Text>Grade</Text><Text>{str(result.overallGrade)}</Text></View>
      <View style={styles.summaryRow}><Text>Position</Text><Text>{pos}</Text></View>
    </View>
  );
};

const GradeScale = () => (
  <View style={styles.box}>
    <Text style={styles.gradeScaleTitle}>Grading Scale</Text>
    <Text style={styles.gradeScaleText}>
      {GRADING_SCALE.map(g => `${g.grade} (${g.min}-${g.max}%): ${g.remark}`).join('  |  ')}
    </Text>
  </View>
);

const RatingTable = ({
  title,
  labels,
  ratings,
}: {
  title: string;
  labels: readonly string[];
  ratings?: Record<string, number>;
}) => (
  <View style={styles.box}>
    <View style={styles.ratingHeaderRow}>
      <Text style={styles.ratingLabelCol}>{title}</Text>
      {[5, 4, 3, 2, 1].map(n => (
        <Text key={n} style={styles.ratingNumCol}>{String(n)}</Text>
      ))}
    </View>
    {labels.map(label => {
      const value = ratings?.[label] ?? 0;
      return (
        <View key={label} style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>{label}</Text>
          {[5, 4, 3, 2, 1].map(n => (
            <Text key={n} style={styles.ratingCell}>{value === n ? '\u2713' : ' '}</Text>
          ))}
        </View>
      );
    })}
  </View>
);

const RatingLegend = () => (
  <View style={styles.box}>
    <Text style={styles.boxTitle}>Rating Indices</Text>
    <View style={{ padding: 4 }}>
      {RATING_SCALE_NOTES.map((line, i) => (
        <Text key={i} style={{ fontSize: 6.5, lineHeight: 1.4 }}>{line}</Text>
      ))}
    </View>
  </View>
);

const Comments = ({ result }: { result: Result }) => (
  <View>
    <View style={styles.commentBox}>
      <Text style={styles.commentLabel}>Class Teacher's Remark</Text>
      <Text style={styles.commentText}>{str(result.teacherComment)}</Text>
      <Text style={styles.signLine}>Sign: ______________________</Text>
    </View>
    <View style={styles.commentBox}>
      <Text style={styles.commentLabel}>Principal's Remark</Text>
      <Text style={styles.commentText}>{str(result.principalComment)}</Text>
      <Text style={styles.signLine}>Sign: ______________________</Text>
    </View>
  </View>
);

const Footer = ({ school }: { school: SchoolInfo }) => (
  <View style={styles.footer}>
    <Text>{`${str(school.name)} \u00A9 ${new Date().getFullYear()} \u2022 Generated on ${new Date().toLocaleDateString()}`}</Text>
  </View>
);

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

      <View style={styles.nextTermRow}>
        <Text>{`Next ${result.term === 'Third' ? 'Session' : 'Term'} Begins: ____________________`}</Text>
        <Text>{`Date: ${new Date().toLocaleDateString()}`}</Text>
      </View>

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

  const logoDataUri = await fetchLogoAsDataUri();
  const resolvedSchool: SchoolInfo = {
    ...(school ?? DEFAULT_SCHOOL),
    logoDataUri,
  };

  return pdf(
    <ResultPDFDocument result={result} school={resolvedSchool} />
  ).toBlob();
};

export const downloadResultPDF = async (
  result: Result,
  school?: SchoolInfo,
): Promise<void> => {
  const { downloadPDF } = await import('@/lib/export');
  const blob = await generateResultPDF(result, school);
  const safeName = result.studentName.replace(/\s+/g, '_');
  const safeSession = result.session.replace(/\//g, '-');
  const filename = `${safeName}_${result.term}_${result.resultType}_${safeSession}.pdf`;
  downloadPDF(blob, filename);
};