export const config = {
  supabase: {
    get url() {
      return process.env.NEXT_PUBLIC_SUPABASE_URL!;
    },
    get anonKey() {
      return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    },
    get serviceRoleKey() {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return key;
    },
  },
  gemini: {
    get apiKey() {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error("Missing GEMINI_API_KEY");
      return key;
    },
    get apiKeyPipeline() {
      return process.env.GEMINI_API_KEY_PIPELINE || process.env.GEMINI_API_KEY;
    },
    get apiKeyPersona() {
      return process.env.GEMINI_API_KEY_PERSONA || process.env.GEMINI_API_KEY;
    },
    get apiKeyEvaluator() {
      return process.env.GEMINI_API_KEY_EVALUATOR || process.env.GEMINI_API_KEY;
    },
    get modelPipeline() {
      return process.env.MODEL_PIPELINE || "gemini-2.0-flash";
    },
    get modelPersona() {
      return process.env.MODEL_PERSONA || "gemini-2.0-flash";
    },
    get modelEvaluator() {
      return process.env.MODEL_EVALUATOR || "gemini-2.0-flash";
    },
  },
  pipeline: {
    get activeCategories() {
      return Number(process.env.DAILY_ACTIVE_CATEGORIES) || 4;
    },
    get queueTtlDays() {
      return Number(process.env.QUEUE_TTL_DAYS) || 3;
    },
    get reportRetireThreshold() {
      return Number(process.env.REPORT_RETIRE_THRESHOLD) || 3;
    },
    get rssFeeds() {
      try {
        return JSON.parse(
          process.env.RSS_FEEDS_JSON || "{}",
        ) as Record<string, string[]>;
      } catch {
        return {} as Record<string, string[]>;
      }
    },
  },
  get cronSecret() {
    return process.env.CRON_SECRET;
  },
  indoBert: {
    get serviceUrl() {
      return process.env.INDOBERT_SERVICE_URL || null;
    },
  },
} as const;
