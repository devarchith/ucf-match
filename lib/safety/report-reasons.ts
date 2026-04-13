import { ReportReason } from "@prisma/client";

/** Labels for `ReportReason` values accepted by POST /api/reports */
export const reportReasonOptions: Array<{ id: ReportReason; label: string }> = [
  { id: ReportReason.HARASSMENT, label: "Harassment or threatening behavior" },
  { id: ReportReason.SPAM, label: "Spam or repeated unwanted contact" },
  { id: ReportReason.SAFETY_CONCERN, label: "Safety concern or unsafe request" },
  { id: ReportReason.OTHER, label: "Something else" }
];
