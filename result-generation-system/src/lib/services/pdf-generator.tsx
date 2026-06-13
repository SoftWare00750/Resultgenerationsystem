// PDF Result Generator
// Fix: logo is fetched as base64 at call time so @react-pdf/renderer can embed it;
//      falls back gracefully when the image is unavailable.
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Result, AFFECTIVE_TRAITS, PSYCHOMOTOR_SKILLS, RATING_SCALE_NOTES, GRADING_SCALE } from '@/lib/types';
import { getOrdinalSuffix } from '@/lib/utils';

const COLOR_PRIMARY = '#1f3d2e';
const COLOR_HEADER_BG = '#f3d9b1';

const styles = StyleSheet.create({
  page: { padding: 24, backgroundColor: '#ffffff', fontSize: 8.5 },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', borderBottom: `2px solid ${COLOR_PRIMARY}`, paddingBottom: 6, marginBottom: 6 },
  logo: { width: 50, height: 50, marginRight: 10 },
  headerCenter: { flex: 1, alignItems: 'center' },
  schoolName: { fontSize: 16, fontWeight: 'bold', color: COLOR_PRIMARY, textAlign: 'center' },
  motto: { fontSize: 8, textAlign: 'center', marginTop: 1 },
  addressLine: { fontSize: 7, textAlign: 'center', color: '#444444', marginTop: 1 },
  reportTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 6, textTransform: 'uppercase' },
  reportSubtitle: { fontSize: 9, fontWeight: 'bold', textAlign: 'center', marginTop: 2, textTransform: 'uppercase', color: COLOR_PRIMARY },

  // Student info bar
  infoBar: { borderWidth: 1, borderColor: '#cccccc', padding: 5, marginTop: 6, marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  infoLabel: { fontWeight: 'bold' },

  // Layout columns
  twoCol: { flexDirection: 'row', gap: 8 },
  colLeft: { flex: 2 },
  colRight: { flex: 1 },

  // Subject table
  table: { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  tHeadRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  tRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#dddddd' },
  th: { color: '#ffffff', fontSize: 7, fontWeight: 'bold', padding: 3, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#ffffff33' },
  td: { fontSize: 7.5, padding: 3, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#eeeeee' },
  subjectCol: { width: '26%', textAlign: 'left' },
  scoreCol: { width: '8%' },
  gradeCol: { width: '7%' },
  posCol: { width: '9%' },
  remarkCol: { width: '17%', textAlign: 'left' },
  avgCol: { width: '9%' },

  // Side boxes
  box: { borderWidth: 1, borderColor: '#bbbbbb', marginBottom: 6 },
  boxTitle: { backgroundColor: COLOR_PRIMARY, color: '#ffffff', fontSize: 8, fontWeight: 'bold', padding: 3, textAlign: 'center' },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 3, borderTopWidth: 1, borderTopColor: '#eeeeee' },

  // Ratings table
  ratingHeaderRow: { flexDirection: 'row', backgroundColor: COLOR_PRIMARY },
  ratingLabelCol: { width: '60%', color: '#fff', fontSize: 7, fontWeight: 'bold', padding: 3 },
  ratingNumCol: { width: '8%', color: '#fff', fontSize: 7, fontWeight: 'bold', padding: 3, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: '#ffffff55' },
  ratingRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eeeeee' },
  ratingLabel: { width: '60%', fontSize: 7.5, padding: 3 },
  ratingCell: { width: '8%', fontSize: 8, padding: 3, textAlign: 'center', borderLeftWidth: 1, borderLeftColor: '#eeeeee' },

  // Summary
  summaryBox: { borderWidth: 1, borderColor: '#bbbbbb', marginTop: 4, marginBottom: 6 },
  summaryTitle: { backgroundColor: COLOR_HEADER_BG, fontSize: 8.5, fontWeight: 'bold', padding: 4, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 3, borderTopWidth: 1, borderTopColor: '#eeeeee' },

  // Comments
  commentBox: { borderWidth: 1, borderColor: '#bbbbbb', padding: 5, marginBottom: 6 },
  commentLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  commentText: { fontSize: 8, lineHeight: 1.4, minHeight: 22 },
  signLine: { textAlign: 'right', fontSize: 7.5, marginTop: 2 },

  gradeScaleTitle: { fontSize: 8, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  gradeScaleText: { fontSize: 7, lineHeight: 1.4, textAlign: 'center' },

  footer: { position: 'absolute', bottom: 14, left: 24, right: 24, textAlign: 'center', fontSize: 7, color: '#888888', borderTopWidth: 1, borderTopColor: '#eeeeee', paddingTop: 4 },

  nextTermRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, fontSize: 8 },

  // Placeholder when logo cannot be loaded
  logoPlaceholder: { width: 50, height: 50, marginRight: 10, backgroundColor: '#e5e5e5', borderRadius: 4 },
});

export interface SchoolInfo {
  name: string;
  motto?: string;
  address?: string;
  /** Pass a base64 data URI (data:image/...;base64,...) or leave undefined to skip the logo. */
  logoDataUri?: string;
}

export const DEFAULT_SCHOOL: SchoolInfo = {
  name: 'CHRIST IS THE ANSWER GROUP OF SCHOOLS',
  motto: 'Motto: KNOWLEDGE IS FREEDOM',
  address: 'Idumegan Quarters, Ekpoma, Edo State.',
  // logoDataUri is populated at call time by fetchLogoAsDataUri()
};

/** Path of the logo relative to the public root. */
const LOGO_PUBLIC_PATH = '/images/Result%20Generation%20System.jpg';

/**
 * Fetches the logo image and converts it to a base64 data URI so that
 * @react-pdf/renderer can embed it without CORS or path-resolution issues.
 * Returns undefined if the image cannot be loaded (network error, 404, etc.).
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

// ─── Sub-components ──────────────────────────────────────────────────────────

const Header = ({ result, school }: { result: Result; school: SchoolInfo }) => (
  <View>
    <View style={styles.headerRow}>
      {school.logoDataUri ? (
        <Image style={styles.logo} src={school.logoDataUri} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}
      <View style={styles.headerCenter}>
        <Text style={styles.schoolName}>{school.name}</Text>
        {school.motto && <Text style={styles.motto}>{school.motto}</Text>}
        {school.address && <Text style={styles.addressLine}>{school.address}</Text>}
      </View>
    </View>
    <Text style={styles.reportTitle}>
      {result.resultType === 'Midterm' ? 'Mid Term Report' : `${result.term} Term Student's Performance Report`}
    </Text>
    {result.resultType === 'Midterm' && (
      <Text style={styles.reportSubtitle}>
        {result.term.toUpperCase()} TERM (MID TERM) PERFORMANCE REPORT
      </Text>
    )}
  </View>
);

const StudentInfoBar = ({ result }: { result: Result }) => (
  <View style={styles.infoBar}>
    <View style={styles.infoRow}>
      <Text><Text style={styles.infoLabel}>Name: </Text>{result.studentName}</Text>
      <Text><Text style={styles.infoLabel}>Class: </Text>{result.class}</Text>
      <Text><Text style={styles.infoLabel}>Session: </Text>{result.session}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text><Text style={styles.infoLabel}>Admission No: </Text>{result.admissionNumber}</Text>
      <Text><Text style={styles.infoLabel}>House: </Text>{result.house || '—'}</Text>
      <Text><Text style={styles.infoLabel}>Club/Society: </Text>{result.club || '—'}</Text>
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
    {result.subjects.map((s, i) => (
      <View key={i} style={styles.tRow}>
        <Text style={[styles.td, styles.subjectCol]}>{s.name}</Text>
        <Text style={[styles.td, styles.scoreCol]}>{s.score}</Text>
        <Text style={[styles.td, styles.scoreCol]}>{s.score}</Text>
        <Text style={[styles.td, styles.gradeCol]}>{s.grade}</Text>
        <Text style={[styles.td, styles.posCol]}>-</Text>
        <Text style={[styles.td, styles.remarkCol]}>{s.remark}</Text>
        <Text style={[styles.td, styles.avgCol]}>-</Text>
      </View>
    ))}
  </View>
);

const AttendanceBox = ({ result }: { result: Result }) => {
  const a = result.attendance;
  const pct = a && a.opened > 0 ? ((a.present / a.opened) * 100).toFixed(1) : null;
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>Attendance Summary</Text>
      <View style={styles.boxRow}><Text>Times School Opened</Text><Text>{a?.opened ?? '—'}</Text></View>
      <View style={styles.boxRow}>
        <Text>No of Times Present</Text>
        <Text>{a?.present ?? '—'} {pct ? `(${pct}%)` : ''}</Text>
      </View>
      <View style={styles.boxRow}><Text>No of Times Absent</Text><Text>{a?.absent ?? '—'}</Text></View>
    </View>
  );
};

const SummaryBox = ({ result }: { result: Result }) => (
  <View style={styles.summaryBox}>
    <Text style={styles.summaryTitle}>
      {result.resultType === 'Midterm' ? 'Mid Term Performance Summary' : 'Performance Summary'}
    </Text>
    <View style={styles.summaryRow}><Text>Total Obtainable</Text><Text>{result.subjects.length * 100}</Text></View>
    <View style={styles.summaryRow}><Text>Total Obtained</Text><Text>{result.totalScore}</Text></View>
    <View style={styles.summaryRow}><Text>Total Subjects Offered</Text><Text>{result.subjects.length}</Text></View>
    <View style={styles.summaryRow}><Text>%TAGE</Text><Text>{result.averageScore?.toFixed(1)}%</Text></View>
    <View style={styles.summaryRow}><Text>Grade</Text><Text>{result.overallGrade}</Text></View>
    <View style={styles.summaryRow}>
      <Text>Position</Text>
      <Text>{result.position ? getOrdinalSuffix(result.position) : 'N/A'}</Text>
    </View>
  </View>
);

const GradeScale = () => (
  <View style={styles.box}>
    <Text style={styles.gradeScaleTitle}>Grading Scale</Text>
    <Text style={styles.gradeScaleText}>
      {GRADING_SCALE.map(g => `${g.grade} (${g.min}-${g.max}%): ${g.remark}`).join('   |   ')}
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
      {[5, 4, 3, 2, 1].map((n) => (
        <Text key={n} style={styles.ratingNumCol}>{n}</Text>
      ))}
    </View>
    {labels.map((label) => {
      const value = ratings?.[label] ?? 0;
      return (
        <View key={label} style={styles.ratingRow}>
          <Text style={styles.ratingLabel}>{label}</Text>
          {[5, 4, 3, 2, 1].map((n) => (
            <Text key={n} style={styles.ratingCell}>{value === n ? '✓' : ''}</Text>
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
      <Text style={styles.commentText}>{result.teacherComment || '—'}</Text>
      <Text style={styles.signLine}>Sign: ______________________</Text>
    </View>
    <View style={styles.commentBox}>
      <Text style={styles.commentLabel}>Principal's Remark</Text>
      <Text style={styles.commentText}>{result.principalComment || '—'}</Text>
      <Text style={styles.signLine}>Sign: ______________________</Text>
    </View>
  </View>
);

const Footer = ({ school }: { school: SchoolInfo }) => (
  <View style={styles.footer}>
    <Text>{school.name} © {new Date().getFullYear()} • Generated on {new Date().toLocaleDateString()}</Text>
  </View>
);

// ─── Main document ────────────────────────────────────────────────────────────

interface ResultPDFDocumentProps {
  result: Result;
  school?: SchoolInfo;
}

export const ResultPDFDocument = ({ result, school = DEFAULT_SCHOOL }: ResultPDFDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header result={result} school={school} />
      <StudentInfoBar result={result} />
      <SubjectsTable result={result} />

      <View style={styles.twoCol}>
        <View style={styles.colLeft}>
          <SummaryBox result={result} />
          {result.resultType === 'Examination' && (
            <>
              <RatingTable title="Affective Domain" labels={AFFECTIVE_TRAITS} ratings={result.affectiveDomain} />
              <RatingTable title="Psychomotor Skills" labels={PSYCHOMOTOR_SKILLS} ratings={result.psychomotorSkills} />
            </>
          )}
        </View>
        <View style={styles.colRight}>
          <AttendanceBox result={result} />
          <GradeScale />
          {result.resultType === 'Examination' && <RatingLegend />}
        </View>
      </View>

      <Comments result={result} />

      <View style={styles.nextTermRow}>
        <Text>Next {result.term === 'Third' ? 'Session' : 'Term'} Begins: ____________________</Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>
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

  // Resolve the school info, fetching the logo as base64 so the renderer can embed it
  const logoDataUri = await fetchLogoAsDataUri();
  const resolvedSchool: SchoolInfo = {
    ...(school ?? DEFAULT_SCHOOL),
    logoDataUri,
  };

  const blob = await pdf(
    <ResultPDFDocument result={result} school={resolvedSchool} />
  ).toBlob();

  return blob;
};

export const downloadResultPDF = async (result: Result, school?: SchoolInfo): Promise<void> => {
  const { downloadPDF } = await import('@/lib/export');
  const blob = await generateResultPDF(result, school);
  const filename = `${result.studentName.replace(/\s+/g, '_')}_${result.term}_${result.resultType}_${result.session.replace(/\//g, '-')}.pdf`;
  downloadPDF(blob, filename);
};