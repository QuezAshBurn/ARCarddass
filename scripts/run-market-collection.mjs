/**
 * Runs the deployed, authenticated collection job for every AR Carddass card.
 *
 * Required environment variables:
 *   MARKET_CRON_BASE_URL=https://arcarddass.vercel.app
 *   CRON_SECRET=<the same value configured in Vercel>
 *
 * The server job loads all database-backed Formation, Wanted, and Film Z
 * cards, ingests traceable marketplace evidence, then applies pricing rules.
 */

const baseUrl = (process.env.MARKET_CRON_BASE_URL ?? "https://arcarddass.vercel.app").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is required. Use the same secret configured in Vercel and GitHub Actions.");
  process.exit(1);
}

async function run(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${path} failed (${response.status}): ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

try {
  const collection = await run("/api/cron/collect-market-data");
  const pricing = await run("/api/cron/update-market-prices");

  console.log(JSON.stringify({ collection, pricing }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
