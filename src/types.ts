export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  dueDate: string | null;
  project: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  project: string | null;
  dueDate: string | null;
}

export interface PriorityIndicatorProps {
  priority: "low" | "medium" | "high";
  size?: "sm" | "md";
}

export interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}
