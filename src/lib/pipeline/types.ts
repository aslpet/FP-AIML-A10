export type CategoryId =
  | "politik_hukum"
  | "ekonomi"
  | "teknologi"
  | "sosial_pendidikan"
  | "lingkungan";

export type ClaimForm = "kebijakan" | "fakta" | "nilai";
export type StancePolicy = "kontrarian" | "berpendirian";
export type RhetoricStyle =
  | "penuntut"
  | "skeptis"
  | "pragmatis"
  | "idealis"
  | "analis_data";

export interface RssArticle {
  title: string;
  url: string;
  published: Date;
  summary: string;
}

export interface CandidateMotion {
  motion_text: string;
  context: string;
  claim_form: ClaimForm;
  quality_score: number;
  flags: {
    beban: boolean;
    reframed: boolean;
  };
  reject: string | null;
}

export interface LlmGenerateResponse {
  candidates: CandidateMotion[];
}

export interface PromoteInput {
  motion_id: string;
  category: CategoryId;
}

export type PipelineSource = "fresh" | "queue" | "fallback";

export interface PipelineResult {
  category: CategoryId;
  source: PipelineSource;
  motion_id: string | null;
  error?: string;
}

export const ALL_CATEGORIES: CategoryId[] = [
  "politik_hukum",
  "ekonomi",
  "teknologi",
  "sosial_pendidikan",
  "lingkungan",
];

export const RHETORIC_STYLES: RhetoricStyle[] = [
  "penuntut",
  "skeptis",
  "pragmatis",
  "idealis",
  "analis_data",
];

export const STANCE_POLICIES: StancePolicy[] = ["kontrarian", "berpendirian"];
