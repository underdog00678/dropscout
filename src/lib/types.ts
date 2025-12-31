export type Decision = "green" | "yellow" | "red";

export type ScoreBreakdown = {
  demand: number;
  competition: number;
  margin: number;
  shipping: number;
  trend: number;
  brandability: number;
  total: number;
};

export type ValidationResult = {
  decision: Decision;
  summary: string;
  scores: ScoreBreakdown;
  warnings: string[];
  reasons: string[];
};
