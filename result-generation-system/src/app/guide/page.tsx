"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  GRADING_SCALE,
  CAT_GRADING_SCALE,
  WAEC_GRADING_SCALE,
  GENIUS_GRADING_SCALE,
  MIDTERM_GRADING_SCALE,
  UserRole,
} from "@/lib/types";

/* ─────────────────────────── small building blocks ─────────────────────────── */

function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-4">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">{s.title}</p>
            <div className="text-sm leading-relaxed text-muted-foreground">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Note({ children, warn }: { children: ReactNode; warn?: boolean }) {
  const Icon = warn ? AlertTriangle : Info;
  return (
    <div
      className={
        "flex items-start gap-2.5 rounded-lg border p-3 text-sm " +
        (warn ? "border-amber-300 bg-amber-50 text-amber-900" : "bg-muted/50 text-muted-foreground")
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t align-top">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 text-muted-foreground">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScaleTable({ scale }: { scale: readonly { min: number; max: number; grade: string; remark: string }[] }) {
  return (
    <SimpleTable
      head={["Score", "Grade", "Remark"]}
      rows={scale.map((r) => [`${r.min} – ${r.max}`, <strong key="g">{r.grade}</strong>, r.remark])}
    />
  );
}

const Path = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{children}</code>
);

/* ─────────────────────────────── tab content ─────────────────────────────── */

function Overview() {
  return (
    <div className="space-y-6">
      <Section
        title="What this system does"
        description="Result Generation System (RGS) lets a school record scores, produce printable report sheets, and share them with parents."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          The school’s Admin sets everything up, Teachers enter scores for their own classes and publish them, and Parents see only
          what has been published for their own children. Every report sheet can be downloaded as a PDF carrying the school’s logo,
          name, address and the principal’s and teacher’s signatures.
        </p>
        <SimpleTable
          head={["Role", "Signs in at", "What they do"]}
          rows={[
            [<strong key="a">Admin / School Owner / School Proprietor</strong>, <Path key="p1">/auth/admin</Path>,
              "Sets up the school, sessions and classes; issues auth codes; manages users and students; views and downloads every result."],
            [<strong key="t">Teacher</strong>, <Path key="p2">/auth/login</Path>,
              "Works only in the classes assigned to them: manages students, creates results, publishes them and downloads PDFs."],
            [<strong key="p">Parent</strong>, <Path key="p3">/auth/login</Path>,
              "Registers their children (wards) and reads published results."],
            [<strong key="c">Central Admin</strong>, <Path key="p4">/auth/admin</Path>,
              "Platform operator: onboards and suspends schools, sees all users, storage and platform settings."],
          ]}
        />
      </Section>

      <Section title="How the pieces fit together" description="The normal life of a result, from setup to the parent’s screen.">
        <Steps
          items={[
            { title: "Admin prepares the school", body: "Registers the school, completes School Settings, creates an academic session and sets it active, then creates classes and assigns teachers." },
            { title: "Admin issues auth codes", body: "A 6-digit code is generated for each teacher and parent who needs an account. Codes are role-specific, single-use and expire after 7 days." },
            { title: "Teachers and parents register", body: "They sign up at Create an account using their code. Parents can then be selected as the guardian when a student is added." },
            { title: "Students are added", body: "An Admin or Teacher adds each student with a unique admission number, class and parent. Parents can also register their own wards." },
            { title: "Teacher creates a result", body: "Four steps: Student, Scores, Report, Comments. It is saved as a Draft that only staff can see." },
            { title: "Teacher publishes", body: "Publishing makes the result visible to the parent. It can be unpublished again at any time." },
            { title: "Parent reads it", body: "The parent opens View Results, picks a ward and opens the report." },
          ]}
        />
      </Section>

      <Section title="Creating your account" description="Open the site and choose Get Started, or go straight to the sign-up page.">
        <div className="space-y-5">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Admin / School Owner / School Proprietor</h4>
            <Steps
              items={[
                { title: "Choose the role and verify your email", body: <>On <Path>/auth/register</Path> pick the Admin role, enter your name and email, and press <em>Send verification code</em>. Enter the 6-digit code from your inbox. A resend timer prevents repeated requests.</> },
                { title: "Pick a plan", body: <>Choose Starter, Standard or Premium and enter the number of students you expect. See the <Link href="/pricing" className="underline">Pricing</Link> page for what each plan includes.</> },
                { title: "Enter school details", body: "School name, address and the principal’s signature image are required. The school logo is required too (maximum 3 MB). The motto is optional." },
                { title: "Add payment details", body: "A card is verified through Paystack. You are not charged the plan price until the free trial ends." },
                { title: "Set a password", body: "At least 8 characters, entered twice. Then press Create account." },
              ]}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Teacher</h4>
            <Steps
              items={[
                { title: "Get a Teacher auth code from your Admin", body: "It is a 6-digit number." },
                { title: "Fill in the form", body: "Name, email, optional phone, the Teacher role, the auth code, the school name (it must match the school’s name exactly) and an image of your signature." },
                { title: "Set a password and submit", body: "At least 8 characters." },
              ]}
            />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Parent</h4>
            <Steps
              items={[
                { title: "Get a Parent auth code from the school", body: "The school’s Admin generates it." },
                { title: "Fill in the form", body: "Name, email, optional phone, the Parent role and the auth code, then choose a password and submit." },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Signing in and password recovery">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Teachers and parents sign in on <Path>/auth/login</Path>. Admins who try there are redirected to <Path>/auth/admin</Path>.</li>
          <li>
            <strong className="text-foreground">Forgot password?</strong> Enter your email, then the 6-digit code that is emailed to you,
            then a new password (8 characters or more). If the code does not arrive, wait for the countdown and press Resend.
          </li>
          <li>Use <strong className="text-foreground">Sign Out</strong> at the bottom of the left menu, especially on shared computers.</li>
        </ul>
      </Section>
    </div>
  );
}

function AdminGuide() {
  return (
    <div className="space-y-6">
      <Section
        title="First-time setup checklist"
        description="Work through these in order. Teachers cannot create results until steps 1 and 2 are done."
      >
        <Steps
          items={[
            { title: "School Settings", body: <>Open <strong>School Settings</strong>. Confirm the school name, address, motto, logo and the principal’s signature. These appear on every PDF. Until this is complete the dashboard shows a “School setup incomplete” banner with a Setup Now button.</> },
            { title: "Sessions", body: <>Open <strong>Sessions</strong> → Create Academic Session, enter the year such as <Path>2025/2026</Path>, then press <em>Set Active</em>. Only one session is active; the active session cannot be deleted. Teachers see “No Active Session” until you do this.</> },
            { title: "Classes", body: <>Open <strong>Classes</strong> → add a class by choosing its name (Nursery 1 through SS 3). The category is detected automatically. Pick the <em>Assigned Teacher</em> and adjust the subject list, which starts from sensible defaults for that level. You can edit a class later.</> },
            { title: "Auth Codes", body: <>Open <strong>Auth Codes</strong> → Generate, choose Teacher or Parent, then copy the code and share it privately. You can filter by role and by Active, Used or Expired, and delete codes you no longer want.</> },
            { title: "Students", body: <>Open <strong>Students</strong> → add each learner: full name, a unique admission number, class, gender and the parent/guardian. Date of birth, guardian name and phone, and address are optional.</> },
          ]}
        />
        <Note warn>
          Auth codes expire after 7 days and work once. A teacher who registers after the code expires needs a fresh one.
        </Note>
      </Section>

      <Section title="Everyday tasks">
        <SimpleTable
          head={["Menu item", "What you can do"]}
          rows={[
            [<strong key="d">Dashboard</strong>, "Counts of teachers, parents, students and classes, recent results, and quick actions."],
            [<strong key="u">Manage Users</strong>, "See all users, filter by role and delete accounts. You cannot delete your own account."],
            [<strong key="s">Students</strong>, "Add, edit or delete students. Admission numbers must be unique."],
            [<strong key="r">Results</strong>, "Overview of every result in the school, filterable by class and term, showing Published or Draft. Download any result as a PDF."],
            [<strong key="c">Classes</strong>, "Create or edit classes, reassign teachers, edit each class’s subject list."],
            [<strong key="se">Sessions</strong>, "Create sessions and switch the active one when a new academic year starts."],
          ]}
        />
        <Note>
          Starting a new academic year: create the new session and press Set Active. Results created afterwards are filed under it,
          and earlier sessions remain available to parents through the session filter.
        </Note>
      </Section>
    </div>
  );
}

function TeacherGuide() {
  return (
    <div className="space-y-6">
      <Section title="Before you start" description="Two things must be true for the result form to work.">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>The Admin has assigned you at least one class (see <strong className="text-foreground">My Classes</strong>).</li>
          <li>The Admin has set an academic session active. Otherwise <strong className="text-foreground">Create Results</strong> shows “No Active Session”.</li>
          <li>Upload your signature under <strong className="text-foreground">My Profile</strong> so it prints on your students’ report sheets. You can also update your name and phone there.</li>
        </ul>
      </Section>

      <Section title="Managing your students" description="My Students lists the learners in your assigned classes only.">
        <Steps
          items={[
            { title: "Add a student", body: "Press the add button and fill in full name, admission number, class, gender and parent/guardian. Date of birth, guardian name and phone, address and a photograph (up to 5 MB) are optional." },
            { title: "Edit or delete", body: "Use the row actions. Admission numbers must be unique; you will be told if one already exists." },
          ]}
        />
      </Section>

      <Section title="Creating a result" description="Open Create Results → Create New Result. The form has four tabs and fills the session in for you.">
        <Steps
          items={[
            { title: "1. Student", body: "Choose the student, the term (First, Second or Third) and the result type: CAT 1, CAT 2, Examination or Midterm. Fill in house, club and bio details; the fields offered depend on the student’s class level." },
            { title: "2. Scores", body: "Subjects are pre-filled from the class’s subject list. Type each score; values above the maximum are clamped, and the grade and remark appear automatically. Use Add Subject for extra subjects. The table changes by result type and class level, see below." },
            { title: "3. Report", body: "Enter the attendance summary (times school opened, present, absent) and rate the Affective Domain and Psychomotor Skills. Nursery uses a 4–3–2–1 rated checklist and Pre-School uses an E/S/N skills checklist." },
            { title: "4. Comments", body: "Write the class teacher’s comment. The principal’s comment is optional. Press Save." },
          ]}
        />
        <p className="text-sm font-semibold">What you enter on the Scores tab</p>
        <SimpleTable
          head={["Class level / type", "Fields per subject", "Total"]}
          rows={[
            ["CAT 1 or CAT 2 (any level)", "Notes (max 5) + Assignment (max 5) + Test (max 10)", "20"],
            ["Examination: JSS and SS", "CAT 1 total (max 20) + CAT 2 total (max 20) + Exam (max 60)", "100"],
            ["Examination: Nursery and Primary", "C.A. (max 40) + Exam (max 60)", "100"],
            ["Midterm (any class)", "1st C.A. (max 10) + 2nd C.A. (max 10), graded as a percentage", "20"],
            ["Pre-School / Kindergarten", "No scores. Tick E, S or N for each skill in the checklist.", "None"],
          ]}
        />
        <Note>
          JSS and SS Examination results also offer a <strong>Grading Scale</strong> choice: Standard (A–F) or Genius (A1–F9).
          The tables are on the Grading tab.
        </Note>
      </Section>

      <Section title="After saving" description="Every result you create appears under My Results.">
        <SimpleTable
          head={["Action", "Effect"]}
          rows={[
            [<strong key="1">Draft / Published badge</strong>, "New results start as Draft. Parents cannot see drafts."],
            [<strong key="2">Publish / Unpublish</strong>, "Toggles whether the parent can see the result. Unpublish to hide it while you correct something."],
            [<strong key="3">Download</strong>, "Generates the report sheet as a PDF in the layout that matches the class (Pre-School, Nursery, Primary, standard JSS/SS or Midterm), including class statistics and previous-term columns where available."],
            [<strong key="4">Delete</strong>, "Removes the result after a confirmation prompt."],
          ]}
        />
        <Note warn>
          Check scores and comments before publishing. Parents see a result the moment it is published.
        </Note>
      </Section>
    </div>
  );
}

function ParentGuide() {
  return (
    <div className="space-y-6">
      <Section title="See your child’s results" description="You only need three screens: Dashboard, My Wards and View Results.">
        <Steps
          items={[
            { title: "Register your account", body: "Use the auth code the school gave you (see the Overview tab)." },
            { title: "Check My Wards", body: "If the school has already added your child and chosen you as the parent, they appear here automatically. If not, press Register New Ward and enter the child’s full name, admission number, class and gender." },
            { title: "Open View Results", body: "Select a ward, then narrow by Session and Term if you wish. Press view on a row to open the full report, including position when it is available." },
          ]}
        />
        <Note>
          You can only see results the teacher has published. If a result is missing, it is most likely still a draft. Ask the class teacher.
        </Note>
        <Note warn>
          “This admission number is already registered” usually means the school has already added your child. Ask the school to link
          that record to your account instead of registering again.
        </Note>
      </Section>
    </div>
  );
}

function CentralAdminGuide() {
  return (
    <Section title="Central Admin" description="For the platform operator who manages all schools.">
      <SimpleTable
        head={["Menu item", "What it does"]}
        rows={[
          [<strong key="o">Overview</strong>, "Platform totals: schools, school admins, teachers and parents, estimated database storage and schools by storage footprint."],
          [<strong key="s">Schools</strong>, "Onboard a school together with its first admin, suspend or reactivate a school, or remove it. Removal is recoverable."],
          [<strong key="u">All Users</strong>, "See users across schools, filter by role and remove a user (recoverable)."],
          [<strong key="st">Storage</strong>, "Per-school database storage breakdown."],
          [<strong key="se">Platform Settings</strong>, "Platform name and support email."],
        ]}
      />
      <Note>Sign in on the Admin portal, <Path>/auth/admin</Path>.</Note>
    </Section>
  );
}

function GradingGuide() {
  return (
    <div className="space-y-6">
      <Section
        title="Report sheet layouts"
        description="The layout is chosen from the student’s class name and the result type."
      >
        <SimpleTable
          head={["Class name contains", "Layout", "Scores"]}
          rows={[
            ["Midterm result type (any class)", "Midterm", "1st and 2nd C.A."],
            ["Pre, KG or Kindergarten", "Pre-School", "E / S / N skills checklist"],
            ["Nursery", "Nursery", "C.A. + Exam, plus a 4–3–2–1 rated checklist"],
            ["Primary", "Primary", "C.A. + Exam, plus Affective and Psychomotor ratings"],
            ["Anything else (JSS, SS)", "Standard", "CAT 1 + CAT 2 + Exam"],
          ]}
        />
      </Section>

      <Section title="Grading scales" description="Different result types and layouts use different bands.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Examination total (out of 100)</p>
            <ScaleTable scale={GRADING_SCALE} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Single CAT (out of 20)</p>
            <ScaleTable scale={CAT_GRADING_SCALE} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Standard report sheet (A–F)</p>
            <ScaleTable scale={WAEC_GRADING_SCALE} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Genius scale (A1–F9)</p>
            <ScaleTable scale={GENIUS_GRADING_SCALE} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Midterm (percentage of 20)</p>
            <ScaleTable scale={MIDTERM_GRADING_SCALE} />
          </div>
        </div>
        <Note>
          The grade shown while entering scores uses the Examination or CAT bands above. The Grading Scale you choose for a
          JSS/SS result controls the grades and grade key printed on the PDF. The overall grade badge always uses the
          Examination (A–F) bands.
        </Note>
      </Section>
    </div>
  );
}

const FAQ: { q: string; a: ReactNode }[] = [
  { q: "My auth code is rejected.", a: "Codes are for one person, match one role, and expire after 7 days. Check that you chose the same role the code was issued for, then ask your Admin for a new one if needed." },
  { q: "Registration says the school name must match.", a: "Teachers must type the school’s name exactly as it appears in School Settings. Copy it from your Admin if unsure." },
  { q: "I never received the verification or reset email.", a: "Wait for the resend countdown and press Resend, and check spam. If the server’s email service is not configured, it shows a notice and the code is printed in the backend logs instead." },
  { q: "“No Active Session” appears when I create a result.", a: "An Admin must open Sessions and press Set Active on the current academic year." },
  { q: "“No classes assigned” appears on My Classes.", a: "An Admin must assign you in Classes → Assigned Teacher." },
  { q: "A student is missing from the result form.", a: "Only students in your assigned classes appear, and only if the record was saved to the server. Press Refresh on the Results page. If you added the student while offline, add them again once you are connected." },
  { q: "The PDF has no logo or signature.", a: "The Admin must complete School Settings (logo, address, principal’s signature), and each teacher must upload a signature in My Profile. Settings apply to PDFs generated afterwards." },
  { q: "A parent cannot see a result.", a: "Confirm the result is Published, the student is linked to that parent’s account, and the Session and Term filters are not hiding it." },
  { q: "“Could not reach the API server.”", a: "The backend is unreachable. Check your connection; if you run the app yourself, make sure the backend is running and NEXT_PUBLIC_API_URL or BACKEND_URL is correct." },
  { q: "“Student saved to backup storage.”", a: "The main database is full, so the record went to the backup store. It still appears everywhere as normal; tell the platform administrator." },
];

function Faq() {
  return (
    <Section title="Troubleshooting and FAQ">
      <div className="divide-y rounded-lg border">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ───────────────────────────────── the page ───────────────────────────────── */

type TabKey = "overview" | "admin" | "teacher" | "parent" | "central_admin" | "grading" | "faq";

function GuideBody({ role, initialTab }: { role: UserRole | null; initialTab: TabKey }) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Guide</h1>
        <p className="text-sm text-muted-foreground">
          Step-by-step help for every role in the Result Generation System.
          {role ? "" : " Signed in users see the guide inside their own portal."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Getting started</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="parent">Parent</TabsTrigger>
            {role === "central_admin" && <TabsTrigger value="central_admin">Central Admin</TabsTrigger>}
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4"><Overview /></TabsContent>
        <TabsContent value="admin" className="mt-4"><AdminGuide /></TabsContent>
        <TabsContent value="teacher" className="mt-4"><TeacherGuide /></TabsContent>
        <TabsContent value="parent" className="mt-4"><ParentGuide /></TabsContent>
        <TabsContent value="central_admin" className="mt-4"><CentralAdminGuide /></TabsContent>
        <TabsContent value="grading" className="mt-4"><GradingGuide /></TabsContent>
        <TabsContent value="faq" className="mt-4"><Faq /></TabsContent>
      </Tabs>
    </div>
  );
}

const VALID_TABS: TabKey[] = ["overview", "admin", "teacher", "parent", "central_admin", "grading", "faq"];

export default function GuidePage() {
  const { user, setUser } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [initialTab, setInitialTab] = useState<TabKey>("overview");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await authService.getCurrentUser().catch(() => null);
      if (cancelled) return;
      if (current) setUser(current);

      // ?tab=teacher wins; otherwise open the tab for the signed-in role.
      const requested = new URLSearchParams(window.location.search).get("tab") as TabKey | null;
      if (requested && VALID_TABS.includes(requested)) setInitialTab(requested);
      else if (current?.role && VALID_TABS.includes(current.role as TabKey)) setInitialTab(current.role as TabKey);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [setUser]);

  if (!ready) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Loading guide…</div>;
  }

  const role = (user?.role as UserRole | undefined) ?? null;

  // Signed in: show the guide inside the user's own portal layout.
  if (role) {
    return (
      <DashboardLayout role={role}>
        <GuideBody role={role} initialTab={initialTab} />
      </DashboardLayout>
    );
  }

  // Signed out: a plain public page.
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg border">
              <Image src="/images/Result%20Generation%20System.jpg" alt="Result Generation System logo" fill className="object-cover" />
            </span>
            <span className="text-sm font-semibold">Result Generation System</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/"><ArrowLeft className="mr-1.5 h-4 w-4" />Home</Link></Button>
            <Button asChild size="sm"><Link href="/auth/login">Sign in</Link></Button>
          </div>
        </div>
      </header>
      <main className="px-4 py-8">
        <GuideBody role={null} initialTab={initialTab} />
      </main>
    </div>
  );
}