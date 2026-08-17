import { buildMarketplaceQuery } from "@/config/marketplace-sources";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Card } from "@/lib/data/cards";
import { buildDuplicateFingerprint, type MarketEventInput } from "@/lib/domain/market-events";
import type { ConditionCategory } from "@/lib/domain/market-rules";
import { reverseGradedRawValue } from "@/lib/domain/pricing";

const defaultUsdToPhpRate = 61.29;

type DbVersionRow = {
  id: string;
  card_id: string;
  version_code: string;
  cards:
    | { card_number: string; character_name: string }
    | { card_number: string; character_name: string }[]
    | null;
};

type EbayItemSummary = {
  itemId?: string;
  title?: string;
  itemWebUrl?: string;
  itemCreationDate?: string;
  price?: {
    value?: string;
    currency?: string;
  };
  seller?: {
    username?: string;
  };
  condition?: string;
};

type EbaySearchResponse = {
  itemSummaries?: EbayItemSummary[];
};

type ActiveMarketplaceAsk = {
  marketplaceListingId: string;
  title: string;
  sourceUrl: string;
  sellerName: string | null;
  currency: string;
  nativeAmount: number;
  phpAmount: number;
  condition: ConditionCategory;
  eventAt: string;
  isGraded: boolean;
  grader: "PSA" | "BGS" | "CGC" | "ARS" | null;
  grade: string | null;
  rawEquivalentPhp: number | null;
};

function getEbayAccessToken() {
  return (
    process.env.EBAY_BROWSE_API_TOKEN ??
    process.env.EBAY_ACCESS_TOKEN ??
    process.env.EBAY_OAUTH_TOKEN ??
    null
  );
}

function getUsdToPhpRate() {
  const configured = Number(process.env.MARKET_USD_TO_PHP_RATE);

  return Number.isFinite(configured) && configured > 0 ? configured : defaultUsdToPhpRate;
}

function getCardNumber(row: DbVersionRow) {
  if (Array.isArray(row.cards)) return row.cards[0]?.card_number;

  return row.cards?.card_number;
}

function normalizeVersionCode(versionCode: string) {
  return versionCode === "CN" || versionCode === "TW" ? "HK" : versionCode;
}

function parseGrade(title: string) {
  const match = title.match(/\b(PSA|BGS|CGC|ARS)\s*(10\+|10\s+PRISTINE|10\s+GEM\s+MINT|9\.5|9|8\.5|8)\b/i);
  if (!match) return null;

  const grader = match[1].toUpperCase() as "PSA" | "BGS" | "CGC" | "ARS";
  const grade = match[2].replace(/\s+/g, " ").replace(/gem mint/i, "Gem Mint").replace(/pristine/i, "Pristine");
  const normalizedGrade = grader === "BGS" && grade === "10" ? "10 Pristine" : grade;

  try {
    return {
      grader,
      grade: normalizedGrade,
      rawEquivalent: (pricePhp: number) => reverseGradedRawValue(pricePhp, grader, normalizedGrade)
    };
  } catch {
    return null;
  }
}

function convertToPhp(amount: number, currency: string) {
  if (currency === "PHP") return Math.round(amount);
  if (currency === "USD") return Math.round(amount * getUsdToPhpRate());

  return null;
}

function getComparableCondition(condition?: string): ConditionCategory {
  const normalized = (condition ?? "").toLowerCase();

  if (normalized.includes("near mint") || normalized.includes("new")) return "NEAR_MINT";
  if (normalized.includes("light")) return "LIGHT_PLAY";
  if (normalized.includes("moderate")) return "MODERATE_PLAY";
  if (normalized.includes("heavy")) return "HEAVY_PLAY";
  if (normalized.includes("damage")) return "DAMAGED";

  return "UNKNOWN";
}

async function searchEbayAsks(card: Card, limit = 50): Promise<ActiveMarketplaceAsk[]> {
  const accessToken = getEbayAccessToken();

  if (!accessToken) return [];

  const query = buildMarketplaceQuery({
    productLine: card.productLine,
    catalogueGroup: card.catalogueGroup,
    cardNumber: card.cardNumber,
    characterName: card.characterName,
    printedNumber: card.printedNumber
  });
  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`eBay Browse API ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as EbaySearchResponse;
  const now = new Date().toISOString();

  return (data.itemSummaries ?? [])
    .map((item) => {
      const title = item.title ?? "";
      const nativeAmount = Number(item.price?.value);
      const currency = (item.price?.currency ?? "USD").toUpperCase();
      const phpAmount = convertToPhp(nativeAmount, currency);

      if (
        !item.itemId ||
        !item.itemWebUrl ||
        !title ||
        !Number.isFinite(nativeAmount) ||
        !phpAmount
      ) {
        return null;
      }
      const parsedGrade = parseGrade(title);

      return {
        marketplaceListingId: item.itemId,
        title,
        sourceUrl: item.itemWebUrl,
        sellerName: item.seller?.username ?? null,
        currency,
        nativeAmount,
        phpAmount,
        condition: getComparableCondition(item.condition),
        eventAt: item.itemCreationDate ?? now,
        isGraded: Boolean(parsedGrade),
        grader: parsedGrade?.grader ?? null,
        grade: parsedGrade?.grade ?? null,
        rawEquivalentPhp: parsedGrade ? parsedGrade.rawEquivalent(phpAmount) : null
      };
    })
    .filter((item): item is ActiveMarketplaceAsk => item !== null);
}

export async function ingestEbayRawAsks(options: {
  cards: Card[];
  supabase: SupabaseClient;
  now?: Date;
}) {
  const accessToken = getEbayAccessToken();
  const now = options.now ?? new Date();

  if (!accessToken) {
    await options.supabase.from("market_source_status").upsert(
      {
        source_code: "ebay",
        status: "PENDING_CREDENTIALS",
        last_check_at: now.toISOString(),
        error_message: "Set EBAY_BROWSE_API_TOKEN or EBAY_ACCESS_TOKEN in Vercel to ingest active raw eBay asks.",
        updated_at: now.toISOString()
      },
      { onConflict: "source_code" }
    );

    return {
      status: "PENDING_CREDENTIALS" as const,
      source: "ebay",
      insertedCount: 0,
      checkedCardCount: 0,
      message: "Missing eBay API token; discovery targets were generated but no prices were ingested."
    };
  }

  const { data: dbVersions, error } = (await options.supabase
    .from("card_versions")
    .select("id,card_id,version_code,cards(card_number,character_name)")) as {
      data: DbVersionRow[] | null;
      error: { message: string } | null;
    };

  if (error || !dbVersions) {
    throw new Error(error?.message ?? "Could not load card_versions for eBay ingestion.");
  }

  const primaryVersionByCardNumber = new Map<string, DbVersionRow>();
  for (const row of dbVersions) {
    const cardNumber = getCardNumber(row);
    const versionCode = normalizeVersionCode(row.version_code);

    if (cardNumber && !primaryVersionByCardNumber.has(cardNumber) && ["JP", "HK"].includes(versionCode)) {
      primaryVersionByCardNumber.set(cardNumber, row);
    }
  }

  let insertedCount = 0;
  let checkedCardCount = 0;
  let highestRawAskPhp = 0;

  for (const card of options.cards) {
    const dbVersion = primaryVersionByCardNumber.get(card.cardNumber);

    if (!dbVersion) continue;

    checkedCardCount += 1;
    const asks = await searchEbayAsks(card);

    for (const ask of asks) {
      if (!ask.isGraded) {
        highestRawAskPhp = Math.max(highestRawAskPhp, ask.phpAmount);
      }
      const eventInput: MarketEventInput = {
        cardCode: card.cardNumber,
        version: normalizeVersionCode(dbVersion.version_code),
        marketplace: "eBay",
        sourceUrl: ask.sourceUrl,
        marketplaceListingId: ask.marketplaceListingId,
        sellerId: ask.sellerName,
        sellerName: ask.sellerName,
        eventType: "NEW_LISTING",
        eventAt: ask.eventAt,
        currency: ask.currency,
        nativeAmount: ask.nativeAmount,
        phpAmount: ask.phpAmount,
        listingPrice: ask.phpAmount,
        condition: ask.condition,
        validationStatus: "ACCEPTED",
        sellerConfidence: 80,
        versionConfidence: 80,
        comparabilityConfidence: 80,
        evidenceConfidence: 85,
        notes: ask.isGraded
          ? `Auto-ingested active graded ask: ${ask.title}. Raw-equivalent fallback is ${ask.rawEquivalentPhp ?? "unavailable"} PHP.`
          : `Auto-ingested active raw ask: ${ask.title}`
      };
      const duplicateFingerprint = buildDuplicateFingerprint(eventInput);
      const { error: upsertError } = await options.supabase.from("market_events").upsert(
        {
          card_id: dbVersion.card_id,
          card_version_id: dbVersion.id,
          card_code: eventInput.cardCode,
          version: eventInput.version,
          marketplace: eventInput.marketplace,
          source_url: eventInput.sourceUrl,
          marketplace_listing_id: eventInput.marketplaceListingId,
          seller_id: eventInput.sellerId,
          seller_name: eventInput.sellerName,
          event_type: eventInput.eventType,
          event_at: eventInput.eventAt,
          discovered_at: now.toISOString(),
          processed_at: null,
          currency: eventInput.currency,
          native_amount: eventInput.nativeAmount,
          php_amount: eventInput.phpAmount,
          fx_rate: eventInput.currency === "USD" ? getUsdToPhpRate() : null,
          fx_rate_timestamp: now.toISOString(),
          listing_price: eventInput.listingPrice,
          is_graded: ask.isGraded,
          grader: ask.grader,
          grade: ask.grade,
          raw_equivalent_php: ask.rawEquivalentPhp,
          condition: eventInput.condition,
          condition_confidence: 70,
          validation_status: eventInput.validationStatus,
          seller_confidence: eventInput.sellerConfidence,
          version_confidence: eventInput.versionConfidence,
          comparability_confidence: eventInput.comparabilityConfidence,
          evidence_confidence: eventInput.evidenceConfidence,
          independence_confidence: 75,
          duplicate_fingerprint: duplicateFingerprint,
          idempotency_key: `ebay:${ask.marketplaceListingId}:${card.cardNumber}`,
          notes: eventInput.notes,
          updated_at: now.toISOString()
        },
        { onConflict: "idempotency_key" }
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }

      insertedCount += 1;
    }
  }

  await options.supabase.from("market_source_status").upsert(
    {
      source_code: "ebay",
      status: "ONLINE",
      last_check_at: now.toISOString(),
      last_successful_check_at: now.toISOString(),
      last_material_event_at: insertedCount > 0 ? now.toISOString() : null,
      error_message: null,
      cursor: {
        checkedCardCount,
        insertedCount,
        highestRawAskPhp
      },
      updated_at: now.toISOString()
    },
    { onConflict: "source_code" }
  );

  return {
    status: "COMPLETED" as const,
    source: "ebay",
    insertedCount,
    checkedCardCount,
    highestRawAskPhp
  };
}
