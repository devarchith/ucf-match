export type DashboardStatus = "awaiting-opt-in" | "opted-in" | "matched" | "paused";

export type DashboardAction = {
  id: string;
  label: string;
  href: string;
  priority: "primary" | "secondary";
};

export type DashboardData = {
  status: DashboardStatus;
  nextMatchWindow: string;
  completion: number;
  participation: {
    optedIn: boolean;
    questionnaireOnFile: boolean;
    preferencesSet: boolean;
  };
  checklist: Array<{ id: string; label: string; done: boolean }>;
  primaryActions: DashboardAction[];
};

export type MatchPreview = {
  firstName: string;
  age: number;
  year: string;
  major: string;
  shortBio: string;
  photoUrl: string;
  sharedInterests: string[];
  compatibilityReasons: string[];
  introPrompt: string;
  safetyNote: string;
};

export const appMeta = {
  name: "UCF Match",
  subtitle: "Weekly student introductions for Knights",
  trustBlurb:
    "Built for UCF students with profile-first matching, safety guardrails, and one intentional match each week."
};

export const dashboardData: DashboardData = {
  status: "awaiting-opt-in",
  nextMatchWindow: "Thursday 8:00 PM ET",
  completion: 68,
  participation: {
    optedIn: false,
    questionnaireOnFile: false,
    preferencesSet: false
  },
  checklist: [
    { id: "email", label: "Verify UCF email", done: true },
    { id: "profile", label: "Finish profile basics", done: true },
    { id: "questionnaire", label: "Complete weekly questionnaire", done: false },
    { id: "preferences", label: "Set weekly preferences", done: false }
  ],
  primaryActions: [
    { id: "opt-in", label: "Complete weekly opt-in", href: "/weekly-opt-in", priority: "primary" },
    { id: "questionnaire", label: "Finish questionnaire", href: "/questionnaire", priority: "secondary" },
    { id: "preferences", label: "Review preferences", href: "/preferences", priority: "secondary" }
  ]
};

export const matchPreview: MatchPreview = {
  firstName: "Alex",
  age: 21,
  year: "Junior",
  major: "Computer Science",
  shortBio:
    "Enjoys structured study sessions, weekend intramural soccer, and trying one new coffee spot each month.",
  photoUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='%23f4f4f5'/><stop offset='100%' stop-color='%23e4e4e7'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><circle cx='240' cy='118' r='58' fill='%23d4d4d8'/><rect x='130' y='196' width='220' height='84' rx='42' fill='%23d4d4d8'/><text x='240' y='302' text-anchor='middle' font-size='18' fill='%2352525b' font-family='Arial'>Profile photo mock</text></svg>",
  sharedInterests: ["Late-night study sessions", "Soccer at RWC", "Thai food"],
  compatibilityReasons: [
    "Both of you prefer low-pressure first meetups and clear planning.",
    "You share overlapping evening availability near main campus.",
    "Conversation interests align around classes, goals, and routines."
  ],
  introPrompt: "What class this semester has surprised you the most?",
  safetyNote: "Only first names are shown until both students accept."
};
