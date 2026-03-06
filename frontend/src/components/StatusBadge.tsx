import React from "react";

type Status = "pending" | "translating" | "done" | "error" | "cancelled";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes:
      "bg-warning/20 text-warning-content dark:bg-dark-warning/20 dark:text-dark-warning",
  },
  translating: {
    label: "Translating",
    classes:
      "bg-primary-100 text-primary-700 animate-pulse dark:bg-primary-900/40 dark:text-primary-300",
  },
  done: {
    label: "Done",
    classes:
      "bg-success/20 text-success dark:bg-dark-success/20 dark:text-dark-success",
  },
  error: {
    label: "Error",
    classes: "bg-error/20 text-error dark:bg-dark-error/20 dark:text-dark-error",
  },
  cancelled: {
    label: "Cancelled",
    classes:
      "bg-warning/20 text-warning-content dark:bg-dark-warning/20 dark:text-dark-warning",
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
