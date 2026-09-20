// Shared content schema — matches the Project shape defined in PLAN.md's
// "Content Model" section. All 5 source projects parse into this same shape.

export interface ArchitectureDecision {
  decision: string;
  what: string;
  why: string;
}

export interface ConceptEntry {
  concept: string;
  wherePracticed: string;
}

export interface Reflection {
  tag: string | null; // e.g. "AI", "Product", "Process", "Technical" — null if untagged
  call: string;
  whyWrong: string;
  correction: string;
}

export interface TechStackEntry {
  layer: string;
  technology: string;
}

export interface Project {
  name: string;
  tagline: string;
  status: string;
  techStack: TechStackEntry[];
  architecture: {
    overview: string;
    keyDecisions: ArchitectureDecision[];
  };
  conceptsPracticed: Record<string, ConceptEntry[]>;
  reflections: Reflection[];
  interviewStory?: string;
  lastParsed: string; // ISO timestamp — internal metadata only, per Decision #3
}
