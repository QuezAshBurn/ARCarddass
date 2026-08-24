import { createClient } from "@supabase/supabase-js";

const cardCode = process.argv[2]?.toUpperCase();

if (!cardCode) {
  console.error("Usage: npm run blog:spotlight -- F03-03");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to save a draft.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const { data: card, error: cardError } = await supabase
  .from("cards")
  .select("card_number,character_name,product_line,summary,sets(name),rarities(code)")
  .eq("card_number", cardCode)
  .maybeSingle();

if (cardError || !card) {
  console.error(cardError?.message ?? `Card ${cardCode} not found.`);
  process.exit(1);
}

const { data: events, error: eventsError } = await supabase
  .from("market_events")
  .select("id,event_type,event_at,marketplace,validation_status")
  .eq("card_code", cardCode)
  .order("event_at", { ascending: false })
  .limit(8);

if (eventsError) {
  console.error(eventsError.message);
  process.exit(1);
}

const slug = `card-spotlight-${cardCode.toLowerCase()}-${card.character_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const content = `## Draft status

This spotlight is generated from structured catalogue and evidence data. Review before publishing.

## Identity

${card.character_name} is catalogued as ${card.card_number}.

## Market evidence

${events?.length ? events.map((event) => `- ${event.event_at}: ${event.marketplace} ${event.event_type} (${event.validation_status})`).join("\n") : "No linked evidence is available yet."}

## Collector notes

Add human review notes here. Do not invent release history or seller motive.`;

const { error } = await supabase
  .from("blog_posts")
  .upsert(
    {
      slug,
      title: `Card Spotlight: ${card.character_name} ${card.card_number}`,
      excerpt: `Draft spotlight for ${card.character_name}, generated from catalogue and evidence data.`,
      content_markdown: content,
      status: "DRAFT",
      category: "Card Spotlight",
      author: "AR Carddass Research Desk",
      seo_title: `${card.card_number} ${card.character_name} - One Piece AR Carddass Formation Spotlight`,
      seo_description: `Draft spotlight for ${card.card_number} ${card.character_name}.`,
      tags: ["card-spotlight", card.card_number.toLowerCase()],
      related_card_codes: [card.card_number],
      related_set_codes: [card.card_number.slice(0, 3)],
      related_evidence_ids: events?.map((event) => event.id) ?? [],
      updated_at: new Date().toISOString()
    },
    { onConflict: "slug" }
  );

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Draft saved: ${slug}`);
