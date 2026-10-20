import type { ZodIssue } from "zod";

export const formatZodIssues = (issues: ZodIssue[]) => {
  const formatted = issues.map((issue) => {
    const fieldPath = issue.path.filter(
      (p) =>
        p !== "body" &&
        p !== "query" &&
        p !== "params" &&
        typeof p !== "number",
    );
    return { field: fieldPath.join(".") || "request", message: issue.message };
  });

  const uniqueLabels = [...new Set(formatted.map((e) => e.field))];

  return { formattedErrors: formatted, uniqueLabels };
};

export const formatFieldList = (labels: string[]) => {
  if (labels.length === 0) return "fields";
  if (labels.length === 1) return labels[0];
  const last = labels.pop()!;
  return `${labels.join(", ")} and ${last}`;
};
