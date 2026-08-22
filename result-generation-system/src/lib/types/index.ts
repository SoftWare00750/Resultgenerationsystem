export type UserRole = 'admin' | 'teacher' | 'parent' | 'central_admin';

export interface User {
  $id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  assignedClasses?: string;
  signatureUrl?: string;
  createdAt: string;
}

export interface Student {
  $id: string;
  name: string;
  admissionNumber: string;
  class: string;
  parentId: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
  createdAt: string;
  // Set by the backend when the record was written to the Google Sheets
  // overflow store (i.e. Postgres was out of storage at the time). Absent
  // for normal, DB-backed records.
  storageSource?: 'database' | 'sheets_fallback';
}

export interface Subject {
  name: string;
  score: number;
  grade?: string;
  remark?: string;
  // CAT 1 / CAT 2 breakdown (out of 5 / 5 / 10 => 20 max)
  notes?: number;
  assignment?: number;
  test?: number;
  // Examination breakdown — CAT 1 total + CAT 2 total (40 max) + Exam (60 max)
  cat1Total?: number;
  cat2Total?: number;
  examScore?: number;
  // Midterm breakdown — 1st CA + 2nd CA (out of 10 each => 20 max)
  midtermCA1?: number;
  midtermCA2?: number;
  // Class-wide stats for this subject (detailed "standard" layout, Image 7)
  classMin?: number;
  classMax?: number;
  classAvg?: number;
  // Prior-term totals for this subject, so a term report can show a
  // running "1st Term" / "2nd Term" column (Images 4-6)
  prevTerm1Total?: number;
  prevTerm2Total?: number;
  subjectPosition?: number;
}

export type Term = 'First' | 'Second' | 'Third';
export type ResultType = 'CAT1' | 'CAT2' | 'Examination' | 'Midterm';

export interface Attendance {
  opened: number;
  present: number;
  absent: number;
}

export interface Result {
  $id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  class: string;
  term: Term;
  session: string;
  resultType: ResultType;
  subjects: Subject[];
  totalScore?: number;
  averageScore?: number;
  overallGrade?: string;
  position?: number;
  teacherComment?: string;
  principalComment?: string;
  published: boolean;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  // Additional report-sheet information
  attendance?: Attendance;
  affectiveDomain?: Record<string, number>;
  psychomotorSkills?: Record<string, number>;
  house?: string;
  club?: string;
  age?: string;
  gender?: string;
  dob?: string;
  height?: string;
  weight?: string;
  // Set by the backend when the record was written to the Google Sheets
  // overflow store (i.e. Postgres was out of storage at the time). Absent
  // for normal, DB-backed records.
  storageSource?: 'database' | 'sheets_fallback';
  // ── Report-sheet extras, keyed by class category (see ReportStyle) ──────
  favColor?: string;
  gradingScaleVariant?: GradingScaleVariant;
  // Preschool: checklist domains, each item rated E / S / N
  checklistDomains?: ChecklistDomain[];
  // Nursery: domains rated 4-3-2-1, plus the freeform items checked off
  ratedDomains?: RatedDomain[];
  // Preschool "Class Data" panel (Image 1)
  classSize?: string;
  // Session-cumulative average across all terms so far (Image 3)
  sessionAverage?: number;
}

export type ClassCategory = 'Nursery' | 'Kindergarten' | 'Primary' | 'JSS' | 'SSS';

/**
 * Which result-sheet layout a class/result combination should render as.
 * Derived from the class name (since ClassCategory alone doesn't
 * distinguish Pre-School from Kindergarten/Nursery in every school's
 * naming) and the result type (Midterm always gets its own layout).
 */
export type ReportStyle = 'preschool' | 'nursery' | 'primary' | 'standard' | 'midterm';

export function getReportStyle(className: string, resultType: ResultType): ReportStyle {
  if (resultType === 'Midterm') return 'midterm';
  const c = (className || '').toLowerCase();
  if (c.includes('pre') || c.includes('kg') || c.includes('kindergarten')) return 'preschool';
  if (c.includes('nursery')) return 'nursery';
  if (c.includes('primary') || c.includes('pri ')) return 'primary';
  return 'standard'; // JSS / SS / College
}

export type GradingScaleVariant = 'waec' | 'genius' | 'midterm';

export interface Class {
  $id: string;
  name: string;
  category: ClassCategory;
  assignedTeacherId?: string;
  students: string[];
  subjects?: string[];
  createdAt: string;
}

export interface AuthCode {
  $id: string;
  code: string;
  role: UserRole;
  isUsed: boolean;
  usedBy?: string;
  expiresAt: string;
  createdBy: string;
  createdAt: string;
}

export interface Session {
  $id: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

export const GRADING_SCALE = [
  { min: 75, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 65, max: 74,  grade: 'B', remark: 'Very Good' },
  { min: 55, max: 64,  grade: 'C', remark: 'Good' },
  { min: 45, max: 54,  grade: 'D', remark: 'Fair' },
  { min: 40, max: 44,  grade: 'E', remark: 'Pass' },
  { min: 0,  max: 39,  grade: 'F', remark: 'Fail' },
] as const;

/**
 * Grading scale for a single CAT (CAT 1 or CAT 2).
 * Each CAT = Notes (5) + Assignment (5) + Test (10) = 20 marks max, and is
 * graded against the 0-20 band scale (20=A, 15=B, 10=C, 5=D, 3=E, 0=F).
 * CAT 1 + CAT 2 together cap at 40 marks, then + Examination (60) = 100
 * marks total in the Examination result type, graded on GRADING_SCALE above.
 */
export const CAT_GRADING_SCALE = [
  { min: 20, max: 20, grade: 'A', remark: 'Excellent' },
  { min: 15, max: 19, grade: 'B', remark: 'Very Good' },
  { min: 10, max: 14, grade: 'C', remark: 'Good' },
  { min: 5,  max: 9,  grade: 'D', remark: 'Fair' },
  { min: 3,  max: 4,  grade: 'E', remark: 'Pass' },
  { min: 0,  max: 2,  grade: 'F', remark: 'Fail' },
] as const;

export const CLASS_OPTIONS = [
  'Nursery 1',
  'Nursery 2',
  'Kindergarten 1',
  'Kindergarten 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SS 1',
  'SS 2',
  'SS 3',
] as const;

export const NURSERY_SUBJECTS = [
  'Numeracy',
  'Literacy',
  'Creative Arts',
  'Physical Development',
  'Social Skills',
];

export const KINDERGARTEN_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Phonics',
  'Science',
  'Creative Arts',
  'Physical Education',
];

export const PRIMARY_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Science',
  'Social Studies',
  'Religious Knowledge',
  'Civic Education',
  'Physical Education',
  'Creative Arts',
  'Computer Studies',
  'French',
  'Handwriting',
];

export const JSS_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Basic Science',
  'Basic Technology',
  'Social Studies',
  'Civic Education',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'Physical & Health Education',
  'French Language',
  'Yoruba / Igbo / Hausa',
  'Agricultural Science',
  'Home Economics',
  'Computer Studies',
  'Fine Arts',
  'Music',
  'Business Studies',
];

export const SSS_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Economics',
  'Government',
  'Literature in English',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'Further Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Agricultural Science',
  'Commerce',
  'Accounting',
  'Geography',
  'French Language',
  'Computer Studies',
  'Civic Education',
  'Physical & Health Education',
];

export const getSubjectsByCategory = (className: string): string[] => {
  if (className.includes('Nursery')) return NURSERY_SUBJECTS;
  if (className.includes('Kindergarten')) return KINDERGARTEN_SUBJECTS;
  if (className.startsWith('JSS')) return JSS_SUBJECTS;
  if (className.startsWith('SS')) return SSS_SUBJECTS;
  return PRIMARY_SUBJECTS;
};

// ---------------------------------------------------------------------------
// Result-sheet extras: Affective Domain, Psychomotor Skills, House & Club
// ---------------------------------------------------------------------------

/** Affective Domain traits — each rated on a 1-5 scale */
export const AFFECTIVE_TRAITS = [
  'Attentiveness',
  'Honesty',
  'Neatness',
  'Politeness',
  'Punctuality/Assembly',
  'Self Control/Calmness',
  'Obedience',
  'Reliability',
  'Sense Of Responsibility',
  'Relationship With Others',
] as const;

/** Psychomotor skills — each rated on a 1-5 scale */
export const PSYCHOMOTOR_SKILLS = [
  'Handling Of Tools',
  'Drawing/Painting',
  'Handwriting',
  'Public Speaking',
  'Speech Fluency',
  'Sports & Games',
] as const;

/** Legend describing what each 1-5 rating means (shown on the result sheet) */
export const RATING_SCALE_NOTES = [
  '5 - Maintains an Excellent degree of Observable (Obv) traits',
  '4 - Maintains a High level of Observable (Obv) traits',
  '3 - Acceptable level of Obv traits',
  '2 - Shows Minimal regard for Obv traits',
  '1 - Has No regard for Observable traits',
];

export const HOUSE_OPTIONS = [
  'Red',
  'Blue',
  'Yellow',
  'Green',
] as const;

export const CLUB_OPTIONS = [
  'Scrabble',
  'Debate',
  'JETS',
  'Press',
  'Drama',
  'Red Cross',
] as const;

// ---------------------------------------------------------------------------
// Alternate grading scales (school-specific) — selectable per result via
// `gradingScaleVariant`, used by the "standard" and "midterm" report styles.
// ---------------------------------------------------------------------------

/** 6-band scale used on Primary / JSS / SS term reports (Images 3–7) */
export const WAEC_GRADING_SCALE = [
  { min: 70, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 60, max: 69.9, grade: 'B', remark: 'Very Good' },
  { min: 50, max: 59.9, grade: 'C', remark: 'Good' },
  { min: 40, max: 49.9, grade: 'D', remark: 'Pass' },
  { min: 30, max: 39.9, grade: 'E', remark: 'Fair' },
  { min: 0,  max: 29.9, grade: 'F', remark: 'Weak' },
] as const;

/** 9-point WAEC-style scale with "genius/gifted/smart" labels (Image 8) */
export const GENIUS_GRADING_SCALE = [
  { min: 90, max: 100, grade: 'A1', remark: 'Genius' },
  { min: 80, max: 89.9, grade: 'B2', remark: 'Gifted' },
  { min: 70, max: 79.9, grade: 'B3', remark: 'Very Smart' },
  { min: 60, max: 69.9, grade: 'C4', remark: 'Smart' },
  { min: 55, max: 59.9, grade: 'C5', remark: 'Bright' },
  { min: 50, max: 54.9, grade: 'C6', remark: 'Average' },
  { min: 45, max: 49.9, grade: 'D7', remark: 'Dull' },
  { min: 40, max: 44.9, grade: 'E8', remark: 'Dull' },
  { min: 0,  max: 39.9, grade: 'F9', remark: 'Dumb' },
] as const;

/** 9-point scale used on Midterm reports (Image 9) */
export const MIDTERM_GRADING_SCALE = [
  { min: 85, max: 100, grade: 'A1', remark: 'Excellent' },
  { min: 75, max: 84.9, grade: 'B2', remark: 'Very Good' },
  { min: 70, max: 74.9, grade: 'B3', remark: 'Good' },
  { min: 65, max: 69.9, grade: 'C4', remark: 'Credit' },
  { min: 60, max: 64.9, grade: 'C5', remark: 'Credit' },
  { min: 50, max: 59.9, grade: 'C6', remark: 'Credit' },
  { min: 45, max: 49.9, grade: 'D7', remark: 'Pass' },
  { min: 40, max: 44.9, grade: 'E8', remark: 'Pass' },
  { min: 0,  max: 39.9, grade: 'F9', remark: 'Fail' },
] as const;

export const GRADING_SCALE_VARIANTS: Record<GradingScaleVariant, readonly { min: number; max: number; grade: string; remark: string }[]> = {
  waec: WAEC_GRADING_SCALE,
  genius: GENIUS_GRADING_SCALE,
  midterm: MIDTERM_GRADING_SCALE,
};

export function calculateGradeWithScale(
  score: number,
  scale: readonly { min: number; max: number; grade: string; remark: string }[]
): { grade: string; remark: string } {
  const g = scale.find((row) => score >= row.min && score <= row.max);
  return g ? { grade: g.grade, remark: g.remark } : { grade: scale[scale.length - 1].grade, remark: scale[scale.length - 1].remark };
}

// ---------------------------------------------------------------------------
// Preschool checklist (Image 1) — 7 domains, each item rated E / S / N
// ---------------------------------------------------------------------------

export type ChecklistMark = 'E' | 'S' | 'N';

export interface ChecklistItem {
  label: string;
  mark: ChecklistMark;
}

export interface ChecklistDomain {
  title: string;
  items: ChecklistItem[];
}

export const CHECKLIST_MARK_KEY: Record<ChecklistMark, string> = {
  E: 'Excellent',
  S: 'Satisfactory',
  N: 'Needs Improvement',
};

/** Default preschool checklist template — teachers tick E/S/N per item */
export const PRESCHOOL_DOMAIN_TEMPLATE: { title: string; items: string[] }[] = [
  {
    title: 'Sensorial Education',
    items: [
      'Can Identify Colours eg Red, Yellow, Green',
      'Can Identify the Pink Tower',
      'Can Build Pink Tower 1-5',
      'Can Identify the colour of Pink Tower 1-5',
      'Can Identify big and small Pink Tower',
      'Can Identify common shapes',
    ],
  },
  {
    title: 'Social/Emotional Development',
    items: [
      'Follows Directions',
      'Concentrates',
      'Shows Self Confidence',
      'Participates in group activities',
      'Is considerate and Respectful of others',
      'Interacts with Peers',
    ],
  },
  {
    title: 'Knowledge of the World',
    items: [
      'Can identify fruits eg Mango, Paw-paw, orange',
      'Can name animals that crawl eg ant, lizard',
      'Can name some plant trees eg Orange, paw-paw tree',
      'Can identify some animals eg Lion, dog, rat, cat',
      'Can identify classroom objects eg chair, fan, TV',
      'Can identify objects at Home eg table, Chair, TV',
      'Can identify some parts of the body eg head, eyes, ear',
    ],
  },
  {
    title: 'Language/Literacy Development',
    items: [
      'Can sound letters A-F',
      'Can identify letter and sound A-C',
      'Can identify letters A-F with Objects',
      'Can colour letters A-D',
    ],
  },
  {
    title: 'Numeracy',
    items: [
      'Is able to count objects (1 - 10)',
      'Can Identify Numerals (1 - 10)',
      'Can write number symbols 1 - 10',
      'Can count numbers',
      'Can arrange more than two objects from Big - Small, Long - Short',
    ],
  },
  {
    title: 'Creativity/Rhyme',
    items: [
      'Can scribble neatly',
      'Can trace within limits',
      'Can Identify Colours and Shapes eg Circle, triangle',
      'Can colour within limits',
      'Can recite rhymes eg Ringer Ringer roses',
      'Can follow rhymes eg My head, My Shoulder, My Knees',
    ],
  },
  {
    title: 'Practical Life',
    items: [
      'Can walk on a straight line',
      'Can Carry his/her chair',
      'Can blow his/her nose',
      'Can open and close the door',
      'Can blow a Balloon',
      'Can use the toilet with minimal assistance',
      'Can greet eg Good Morning, Good Afternoon',
    ],
  },
];

/** Build a fresh checklist (default mark 'S') from the template above */
export const buildDefaultChecklist = (): ChecklistDomain[] =>
  PRESCHOOL_DOMAIN_TEMPLATE.map((d) => ({
    title: d.title,
    items: d.items.map((label) => ({ label, mark: 'S' as ChecklistMark })),
  }));

// ---------------------------------------------------------------------------
// Nursery rated domains (Image 2) — 5 domains, each item rated 4-3-2-1
// ---------------------------------------------------------------------------

export interface RatedItem {
  label: string;
  rating: number; // 1-4
}

export interface RatedDomain {
  title: string;
  items: RatedItem[];
}

export const NURSERY_DOMAIN_TEMPLATE: { title: string; items: string[] }[] = [
  {
    title: 'Numeracy',
    items: [
      'Can count 1-10',
      'Can Identify Numbers 1-10',
      'Can trace Numbers 1-10',
      'Can count Objects 1-10',
      'Can Identify Numbers 1-20',
      'Can trace Numbers 1-20',
      'Can count Objects with 1-20',
    ],
  },
  {
    title: 'Literacy/Language Development',
    items: [
      'Can Sound A-G',
      'Can identify sounds A and B',
      'Can read pictures of single objects and letters',
      'Can identify, sound and match objects with letters',
      'Can sing Rhymes of the sounds A-G',
      'Can identify, sound and match with objects A-G',
      'Can colour Letters A-G',
    ],
  },
  {
    title: 'Knowledge and Grasp of the World',
    items: [
      'Can identify means of transport eg car, bus, boat',
      'Can identify water',
      'Can identify parts of their body eg head, eye, ear',
      'Can identify classroom objects eg table, chair, fan',
      'Can identify some animals and their young ones',
      'Can identify a house',
    ],
  },
  {
    title: 'Sensorial Education/Practical Life',
    items: [
      'Can identify colours eg Red, Yellow, Blue',
      'Can identify Shapes eg Circle, Triangle, Square',
      'Can open and close doors',
      'Can open and close books',
      'Can carry and pour water from jug to cup',
      'Can Pick Flowers',
    ],
  },
  {
    title: 'Physical and Health',
    items: [
      'Can Run',
      'Can Jump',
      'Can Stamp feet',
      'Can Dance',
      'Can Kick a Ball',
      'Can Clap their Hands',
    ],
  },
];

/** Build a fresh nursery rated-domain checklist (default rating 3) */
export const buildDefaultRatedDomains = (): RatedDomain[] =>
  NURSERY_DOMAIN_TEMPLATE.map((d) => ({
    title: d.title,
    items: d.items.map((label) => ({ label, rating: 3 })),
  }));

/** 4-3-2-1 legend for the Nursery rated domains (Image 2) */
export const NURSERY_RATING_KEY = [
  '4 - Excellent',
  '3 - Very Good',
  '2 - Good',
  '1 - Needs Improvement',
];

/** Build a default 1-5 rating map (defaults to 3) for a list of labels */
export const buildDefaultRatings = (
  labels: readonly string[],
  defaultValue: number = 3
): Record<string, number> =>
  labels.reduce((acc, label) => {
    acc[label] = defaultValue;
    return acc;
  }, {} as Record<string, number>);