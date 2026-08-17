import { getPublicSupabaseClient } from "@/lib/database/supabase";
import type { CatalogueResearchReference, MarketEvidenceItem } from "@/components/MarketEvidencePanel";

type MarketEventRow = {
  id: string;
  marketplace: string;
  source_url: string;
  event_type: string;
  event_at: string;
  php_amount: number | string | null;
  sale_price: number | string | null;
  listing_price: number | string | null;
  is_graded: boolean | null;
  grader: string | null;
  grade: string | null;
  raw_equivalent_php: number | string | null;
  validation_status: string;
  notes: string | null;
};

type CatalogueReferenceRow = {
  research_pricing_source: string | null;
  research_pricing_url: string | null;
  research_pricing_confidence: string | null;
};

export type CardMarketEvidence = {
  evidence: MarketEvidenceItem[];
  catalogueReference: CatalogueResearchReference | null;
};

function toNumber(value: number | string | null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

/** Public, database-backed proof for a single card across its released versions. */
export async function getMarketEvidenceForCard(cardNumber: string): Promise<CardMarketEvidence> {
  const supabase = getPublicSupabaseClient();

  if (!supabase) return { evidence: [], catalogueReference: null };

  const { data: catalogueData, error: catalogueError } = await supabase
    .from("cards")
    .select("research_pricing_source,research_pricing_url,research_pricing_confidence")
    .eq("card_number", cardNumber)
    .maybeSingle();

  if (catalogueError) {
    console.warn(`Could not load catalogue research for ${cardNumber}:`, catalogueError.message);
  }

  const catalogue = catalogueData as CatalogueReferenceRow | null;
  const catalogueReference =
    catalogue?.research_pricing_source && catalogue.research_pricing_url
      ? {
          source: catalogue.research_pricing_source,
          sourceUrl: catalogue.research_pricing_url,
          confidence: catalogue.research_pricing_confidence
        }
      : null;

  const { data, error } = await supabase
    .from("market_events")
    .select(
      "id,marketplace,source_url,event_type,event_at,php_amount,sale_price,listing_price,is_graded,grader,grade,raw_equivalent_php,validation_status,notes"
    )
    .eq("card_code", cardNumber)
    .in("validation_status", ["ACCEPTED", "REVIEW_REQUIRED"])
    .order("event_at", { ascending: false })
    .limit(24);

  if (error) {
    console.warn(`Could not load public market evidence for ${cardNumber}:`, error.message);
    return { evidence: [], catalogueReference };
  }

  const evidence = ((data ?? []) as MarketEventRow[]).map((event) => ({
    id: event.id,
    marketplace: event.marketplace,
    sourceUrl: event.source_url,
    eventType: event.event_type,
    eventAt: event.event_at,
    phpAmount: toNumber(event.php_amount ?? event.sale_price ?? event.listing_price),
    isGraded: Boolean(event.is_graded),
    grader: event.grader,
    grade: event.grade,
    rawEquivalentPhp: toNumber(event.raw_equivalent_php),
    validationStatus: event.validation_status,
    notes: event.notes
  }));

  return { evidence, catalogueReference };
}
