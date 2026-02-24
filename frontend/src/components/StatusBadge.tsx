import React from "react";

type Status = "pending" | "translating" | "done" | "error" | "cancelled";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  },
  translating: {
    label: "Translating",
    classes:
      "bg-blue-100 text-blue-700 animate-pulse dark:bg-blue-900/40 dark:text-blue-300",
  },
  done: {
    label: "Done",
    classes:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  error: {
    label: "Error",
    classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  cancelled: {
    label: "Cancelled",
    classes:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
