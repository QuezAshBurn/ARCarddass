import type { Card } from "@/lib/data/cards";
import { cards } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

type CardVersionPriceRow = {
  version_code: string;
  current_published_price_php: number | string | null;
  current_calculated_price_php: number | string | null;
  last_market_update_at: string | null;
  cards: { card_number: string } | { card_number: string }[] | null;
};

function getCardNumber(row: CardVersionPriceRow): string | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0]?.card_number;
  }

  return row.cards?.card_number;
}

function copyStaticCards(): Card[] {
  return cards.map((card) => ({
    ...card,
    versions: card.versions.map((version) => ({ ...version })),
    priceHistory: card.priceHistory.map((point) => ({ ...point }))
  }));
}

export async function getCardsWithLivePrices(): Promise<Card[]> {
  const supabase = getPublicSupabaseClient();
  const liveCards = copyStaticCards();

  if (!supabase) {
    return liveCards;
  }

  const { data, error } = await supabase
    .from("card_versions")
    .select(
      "version_code,current_published_price_php,current_calculated_price_php,last_market_update_at,cards(card_number)"
    )
    .in("pricing_state", ["LIVE", "FROZEN"]);

  if (error || !data) {
    console.warn("Falling back to static card prices:", error?.message);
    return liveCards;
  }

  for (const row of data as CardVersionPriceRow[]) {
    const cardNumber = getCardNumber(row);
    const card = liveCards.find((item) => item.cardNumber === cardNumber);
    const version = card?.versions.find((item) => item.versionCode === row.version_code);
    const publishedPrice = Number(row.current_published_price_php);

    if (!card || !version || !Number.isFinite(publishedPrice)) {
      continue;
    }

    const previousPrice = version.currentPublishedPricePhp;
    version.currentPublishedPricePhp = Math.round(publishedPrice);
    version.weeklyChangePhp = version.currentPublishedPricePhp - previousPrice;
    version.weeklyChangePercent =
      previousPrice === 0 ? 0 : (version.weeklyChangePhp / previousPrice) * 100;

    if (version.versionCode === "JP") {
      const latestPoint = card.priceHistory[card.priceHistory.length - 1];

      if (latestPoint) {
        latestPoint.pricePhp = version.currentPublishedPricePhp;
      }
    }
  }

  return liveCards;
}

export async function getCardWithLivePrices(cardNumber: string): Promise<Card | undefined> {
  const liveCards = await getCardsWithLivePrices();

  return liveCards.find(
    (card) => card.cardNumber.toLowerCase() === cardNumber.toLowerCase()
  );
}
