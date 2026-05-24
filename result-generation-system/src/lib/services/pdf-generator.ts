import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Result } from '@/types';
import { getOrdinalSuffix } from '@/lib/utils';

const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #111111',
    paddingBottom: 10,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  schoolInfo: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666666',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  studentInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '40%',
  },
  infoValue: {
    fontSize: 10,
    width: '60%',
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    padding: 8,
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e5e5',
    padding: 8,
  },
  tableCol1: {
    width: '50%',
    fontSize: 10,
  },
  tableCol2: {
    width: '15%',
    fontSize: 10,
    textAlign: 'center',
  },
  tableCol3: {
    width: '15%',
    fontSize: 10,
    textAlign: 'center',
  },
  tableCol4: {
    width: '20%',
    fontSize: 10,
    textAlign: 'center',
  },
  summary: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111111',
  },
  commentsSection: {
    marginTop: 20,
  },
  commentBox: {
    marginBottom: 15,
    padding: 10,
    border: '1px solid #e5e5e5',
    borderRadius: 5,
  },
  commentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111111',
  },
  commentText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
    borderTop: '1px solid #e5e5e5',
    paddingTop: 10,
  },
  gradeScale: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  gradeScaleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gradeScaleText: {
    fontSize: 8,
    lineHeight: 1.4,
  },
});

interface ResultPDFDocumentProps {
  result: Result;
  schoolName?: string;
}

export const ResultPDFDocument = ({ result, schoolName = "Result Generation System" }: ResultPDFDocumentProps) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.schoolName}>{schoolName}</Text>
        <Text style={pdfStyles.schoolInfo}>Academic Excellence • Character Development</Text>
        <Text style={pdfStyles.resultTitle}>
          {result.session} Academic Session - {result.term} Term {result.resultType}
        </Text>
      </View>

      <View style={pdfStyles.studentInfo}>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Student Name:</Text>
          <Text style={pdfStyles.infoValue}>{result.studentName}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Admission Number:</Text>
          <Text style={pdfStyles.infoValue}>{result.admissionNumber}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Class:</Text>
          <Text style={pdfStyles.infoValue}>{result.class}</Text>
        </View>
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Position:</Text>
          <Text style={pdfStyles.infoValue}>
            {result.position ? getOrdinalSuffix(result.position) : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.tableCol1}>Subject</Text>
          <Text style={pdfStyles.tableCol2}>Score</Text>
          <Text style={pdfStyles.tableCol3}>Grade</Text>
          <Text style={pdfStyles.tableCol4}>Remark</Text>
        </View>
        {result.subjects.map((subject, index) => (
          <View key={index} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tableCol1}>{subject.name}</Text>
            <Text style={pdfStyles.tableCol2}>{subject.score}</Text>
            <Text style={pdfStyles.tableCol3}>{subject.grade}</Text>
            <Text style={pdfStyles.tableCol4}>{subject.remark}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.summary}>
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Total Score:</Text>
          <Text style={pdfStyles.summaryValue}>{result.totalScore}</Text>
        </View>
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Average Score:</Text>
          <Text style={pdfStyles.summaryValue}>{result.averageScore?.toFixed(2)}%</Text>
        </View>
        <View style={pdfStyles.summaryRow}>
          <Text style={pdfStyles.summaryLabel}>Overall Grade:</Text>
          <Text style={pdfStyles.summaryValue}>{result.overallGrade}</Text>
        </View>
      </View>

      <View style={pdfStyles.commentsSection}>
        {result.teacherComment && (
          <View style={pdfStyles.commentBox}>
            <Text style={pdfStyles.commentLabel}>Teacher's Comment:</Text>
            <Text style={pdfStyles.commentText}>{result.teacherComment}</Text>
          </View>
        )}
        {result.principalComment && (
          <View style={pdfStyles.commentBox}>
            <Text style={pdfStyles.commentLabel}>Principal's Comment:</Text>
            <Text style={pdfStyles.commentText}>{result.principalComment}</Text>
          </View>
        )}
      </View>

      <View style={pdfStyles.gradeScale}>
        <Text style={pdfStyles.gradeScaleTitle}>Grading Scale:</Text>
        <Text style={pdfStyles.gradeScaleText}>
          A (75-100): Excellent • B (65-74): Very Good • C (55-64): Good • D (45-54): Fair • E (40-44): Pass • F (0-39): Fail
        </Text>
      </View>

      <View style={pdfStyles.footer}>
        <Text>Generated on {new Date().toLocaleDateString()} • Result Generation System</Text>
      </View>
    </Page>
  </Document>
);

export const generateResultPDF = async (result: Result, schoolName?: string): Promise<Blob> => {
  const { pdf } = await import('@react-pdf/renderer');
  return await pdf(<ResultPDFDocument result={result} schoolName={schoolName} />).toBlob();
};
