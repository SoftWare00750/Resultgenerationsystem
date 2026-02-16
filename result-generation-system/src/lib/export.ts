import { Result, Student } from '@/types';

// Export results to CSV
export const exportResultsToCSV = (results: Result[]): string => {
  const headers = [
    'Student Name',
    'Admission Number',
    'Class',
    'Term',
    'Session',
    'Type',
    'Total Score',
    'Average Score',
    'Grade',
    'Position',
    'Published',
  ];

  const rows = results.map(result => [
    result.studentName,
    result.admissionNumber,
    result.class,
    result.term,
    result.session,
    result.resultType,
    result.totalScore?.toString() || '',
    result.averageScore?.toFixed(2) || '',
    result.overallGrade || '',
    result.position?.toString() || '',
    result.published ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

// Export students to CSV
export const exportStudentsToCSV = (students: Student[]): string => {
  const headers = [
    'Name',
    'Admission Number',
    'Class',
    'Gender',
    'Date of Birth',
    'Guardian Name',
    'Guardian Phone',
    'Address',
  ];

  const rows = students.map(student => [
    student.name,
    student.admissionNumber,
    student.class,
    student.gender || '',
    student.dateOfBirth || '',
    student.guardianName || '',
    student.guardianPhone || '',
    student.address || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Download PDF
export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};