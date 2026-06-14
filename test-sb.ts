import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking connection...");
  const { data, error } = await supabase.from("daily_motion").select("count").limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
