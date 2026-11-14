// Natural language search — free text ("My car stopped") -> structured
// intent. See docs/06-smart-matching.md §1: this is intentionally the seam
// between free-text intake and the deterministic matching pipeline, so
// swapping the rule-based default for a real model never touches matching.
export interface ClassifiedIntent {
  categoryId: string;
  confidence: number; // 0..1
  urgency: "NORMAL" | "EMERGENCY";
}

export interface IntentClassifier {
  classify(freeText: string, locale: string): Promise<ClassifiedIntent>;
}
