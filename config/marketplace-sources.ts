import type { ProductLine } from "@/lib/data/cards";

export type MarketplaceSourceCode =
  | "ebay"
  | "mercari_jp"
  | "yahoo_auction_jp"
  | "jdirect_items"
  | "yahoo_fleamarket_jp"
  | "mandarake"
  | "surugaya"
  | "rakuma"
  | "remambo_proxy";

export type MarketplaceEventCoverage = "SOLD" | "ASKING" | "FORMULA_INPUT";

export type MarketplaceSource = {
  code: MarketplaceSourceCode;
  name: string;
  country: string;
  currency: "USD" | "JPY";
  coverage: MarketplaceEventCoverage[];
  adapter: "official-api" | "partner-feed" | "search-target";
  status: "READY_WITH_CREDENTIALS" | "TARGET_ONLY";
  buildSearchUrl: (query: string) => string;
};

function encodeQuery(query: string) {
  return encodeURIComponent(query.trim().replace(/\s+/g, " "));
}

export const marketplaceSources: MarketplaceSource[] = [
  {
    code: "ebay",
    name: "eBay",
    country: "Global",
    currency: "USD",
    coverage: ["ASKING", "SOLD", "FORMULA_INPUT"],
    adapter: "official-api",
    status: "READY_WITH_CREDENTIALS",
    buildSearchUrl: (query) => `https://www.ebay.com/sch/i.html?_nkw=${encodeQuery(query)}&_sacat=0`
  },
  {
    code: "mercari_jp",
    name: "Mercari Japan",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING", "SOLD"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) => `https://jp.mercari.com/search?keyword=${encodeQuery(query)}`
  },
  {
    code: "yahoo_auction_jp",
    name: "Yahoo Auctions Japan / JDirectItems",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING", "SOLD"],
    adapter: "partner-feed",
    status: "READY_WITH_CREDENTIALS",
    buildSearchUrl: (query) =>
      `https://auctions.yahoo.co.jp/search/search?p=${encodeQuery(query)}&auccat=0`
  },
  {
    code: "jdirect_items",
    name: "JDirectItems auction proxy",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING", "SOLD"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) =>
      `https://www.remambo.jp/auction?keyword=${encodeQuery(query)}`
  },
  {
    code: "yahoo_fleamarket_jp",
    name: "Yahoo Fleamarket Japan",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) =>
      `https://paypayfleamarket.yahoo.co.jp/search/${encodeQuery(query)}`
  },
  {
    code: "mandarake",
    name: "Mandarake",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING", "SOLD"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) =>
      `https://order.mandarake.co.jp/order/listPage/list?keyword=${encodeQuery(query)}`
  },
  {
    code: "surugaya",
    name: "Suruga-ya",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) =>
      `https://www.suruga-ya.jp/search?category=&search_word=${encodeQuery(query)}`
  },
  {
    code: "rakuma",
    name: "Rakuma",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) => `https://fril.jp/search/${encodeQuery(query)}`
  },
  {
    code: "remambo_proxy",
    name: "Remambo multi-market proxy",
    country: "Japan",
    currency: "JPY",
    coverage: ["ASKING", "SOLD"],
    adapter: "search-target",
    status: "TARGET_ONLY",
    buildSearchUrl: (query) => `https://www.remambo.jp/search?keyword=${encodeQuery(query)}`
  }
];

export function buildMarketplaceQuery(input: {
  productLine: ProductLine;
  catalogueGroup?: string;
  cardNumber: string;
  characterName: string;
  printedNumber?: string;
}) {
  const lineTerm =
    input.catalogueGroup === "Film Z"
      ? "Film Z"
      : input.productLine === "Wanted"
        ? "wanted"
        : "king rare";
  const printedNumber = input.printedNumber ? ` ${input.printedNumber}` : "";

  return `One Piece AR Carddass ${lineTerm} ${input.characterName} ${input.cardNumber}${printedNumber}`;
}
