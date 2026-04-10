export type StepItem = {
  id: string;
  label: string;
  hint: string;
};

export type OnboardingDraft = {
  firstName: string;
  lastName: string;
  major: string;
  graduationYear: string;
  /** 1:1 with API `profile.bio` (single field; no silent join/split). */
  bio: string;
};

export type PromptGroup = "availability" | "vibe";
type PromptConfigItem = {
  prompt: string;
  placeholder: string;
  required: boolean;
  group: PromptGroup;
};

const promptConfig = {
  plans: {
    prompt: "What kind of plans fit your week best?",
    placeholder: "Coffee, walk, library session, student event...",
    required: true,
    group: "vibe"
  },
  topic: {
    prompt: "A topic you are excited to talk about this week",
    placeholder: "Class ideas, goals, music, clubs, projects...",
    required: true,
    group: "vibe"
  },
  schedule: {
    prompt: "What days/times are easiest for a first meetup?",
    placeholder: "After 6pm weekdays, Saturday afternoon, etc.",
    required: false,
    group: "availability"
  }
} as const satisfies Record<string, PromptConfigItem>;

export type PromptId = keyof typeof promptConfig;

export type QuestionPrompt = {
  id: PromptId;
  prompt: string;
  placeholder: string;
  required: boolean;
  group: PromptGroup;
};

export type PreferenceLevel = "low" | "medium" | "high";

export type PreferencesDraft = {
  campusAreaDistance: PreferenceLevel | "";
  conversationPace: PreferenceLevel | "";
  meetingWindows: PreferenceLevel | "";
};

export const onboardingSteps: StepItem[] = [
  { id: "basics", label: "Basics", hint: "Identity and campus context" },
  {
    id: "bio",
    label: "Bio",
    hint: "How you show up, conversation style, and any meetup boundaries — stored as one profile field"
  }
];

export const onboardingDraft: OnboardingDraft = {
  firstName: "",
  lastName: "",
  major: "",
  graduationYear: "",
  bio: ""
};

export const questionnaireSteps: StepItem[] = [
  { id: "availability", label: "Availability", hint: "This week only" },
  { id: "vibe", label: "Conversation Vibe", hint: "Energy and topic fit" },
  { id: "submit", label: "Review", hint: "Quick final check" }
];

export const questionnairePromptOrder: PromptId[] = ["schedule", "plans", "topic"];

export const weeklyPrompts: QuestionPrompt[] = questionnairePromptOrder.map((id) => ({
  id,
  ...promptConfig[id]
}));

export const preferencesSteps: StepItem[] = [
  { id: "distance", label: "Distance", hint: "Campus area flexibility" },
  { id: "pace", label: "Pace", hint: "Conversation tempo" },
  { id: "windows", label: "Windows", hint: "Meeting window flexibility" }
];

export const preferencesDraft: PreferencesDraft = {
  campusAreaDistance: "",
  conversationPace: "",
  meetingWindows: ""
};

export function getPromptById(id: PromptId) {
  const prompt = promptConfig[id];
  if (!prompt) return undefined;
  return { id, ...prompt };
}

export function getAvailabilityPrompt() {
  // Intentional product coupling: current flow uses one availability prompt keyed as "schedule".
  const schedulePrompt = getPromptById("schedule");
  if (!schedulePrompt || schedulePrompt.group !== "availability") {
    return undefined;
  }
  return schedulePrompt;
}

export function getPromptsByGroup(group: PromptGroup) {
  return questionnairePromptOrder
    .map((id) => ({ id, ...promptConfig[id] }))
    .filter((prompt) => prompt.group === group);
}

export function createInitialAnswers(): Record<PromptId, string> {
  const answers = {} as Record<PromptId, string>;
  for (const id of questionnairePromptOrder) {
    answers[id] = "";
  }
  return answers;
}
