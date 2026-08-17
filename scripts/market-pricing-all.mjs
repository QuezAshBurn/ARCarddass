/**
 * Runs only the deployed, authenticated pricing job for every live card.
 *
 * This script never contains card prices. The API reads Supabase evidence and
 * applies the published priority: recent raw sold > raw ask > graded-to-raw.
 *
 * Required environment variables:
 *   MARKET_CRON_BASE_URL=https://arcarddass.vercel.app
 *   CRON_SECRET=<the same value configured in Vercel and GitHub Actions>
 */

const baseUrl = (process.env.MARKET_CRON_BASE_URL ?? "https://arcarddass.vercel.app").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is required. Use the same secret configured in Vercel and GitHub Actions.");
  process.exit(1);
}

try {
  const response = await fetch(`${baseUrl}/api/cron/update-market-prices`, {
    headers: { Authorization: `Bearer ${secret}` }
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Price update failed (${response.status}): ${body}`);
  }

  console.log(body);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
