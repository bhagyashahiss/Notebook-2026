type DashboardEvent = {
  type: "submission_changed";
  submissionId: string;
};

type Listener = (event: DashboardEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishSubmissionChange(submissionId: string): void {
  for (const listener of listeners) {
    listener({ type: "submission_changed", submissionId });
  }
}
