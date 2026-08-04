#!/usr/bin/env node

const kpiWeights = {
  transaction: 0.35,
  buyerIntent: 0.2,
  searchDemand: 0.15,
  scarcity: 0.15,
  priceMomentum: 0.1,
  marketBreadth: 0.05
};

const movementCaps = {
  noVerifiedSale: 0.015,
  oneIndependentVerifiedSale: 0.075,
  multipleIndependentVerifiedSales: 0.12
};

const labels = {
  price: "currentPublishedPricePhp",
  sales: "verifiedSaleCount",
  transaction: "transactionScore",
  buyerIntent: "buyerIntentScore",
  searchDemand: "searchDemandScore",
  scarcity: "scarcityScore",
  momentum: "priceMomentumScore",
  breadth: "marketBreadthScore"
};

function readArgs(argv) {
  const parsed = {
    hasFreshMaterialEvidence: true,
    hasMajorOutlier: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--no-evidence") {
      parsed.hasFreshMaterialEvidence = false;
      continue;
    }

    if (token === "--outlier") {
      parsed.hasMajorOutlier = true;
      continue;
    }

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${token}`);
    }

    if (key === "card") {
      parsed.card = value;
    } else if (labels[key]) {
      const number = Number(value.replace(/,/g, ""));

      if (!Number.isFinite(number)) {
        throw new Error(`${token} must be a number.`);
      }

      parsed[labels[key]] = number;
    } else {
      throw new Error(`Unknown option: ${token}`);
    }

    index += 1;
  }

  return parsed;
}

function peso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

function calculateMarketScore(input) {
  const available = [
    ["transaction", input.transactionScore, kpiWeights.transaction],
    ["buyer intent", input.buyerIntentScore, kpiWeights.buyerIntent],
    ["search demand", input.searchDemandScore, kpiWeights.searchDemand],
    ["scarcity", input.scarcityScore, kpiWeights.scarcity],
    ["price momentum", input.priceMomentumScore, kpiWeights.priceMomentum],
    ["market breadth", input.marketBreadthScore, kpiWeights.marketBreadth]
  ];

  const populated = available.filter(([, value]) => typeof value === "number");
  const weightTotal = populated.reduce((sum, [, , weight]) => sum + weight, 0);

  if (weightTotal === 0) {
    return { score: 50, populated };
  }

  const score = populated.reduce(
    (sum, [, value, weight]) => sum + value * (weight / weightTotal),
    0
  );

  return { score: Math.round(score * 100) / 100, populated };
}

function getMovementCap(verifiedSaleCount) {
  if (verifiedSaleCount <= 0) {
    return movementCaps.noVerifiedSale;
  }

  if (verifiedSaleCount === 1) {
    return movementCaps.oneIndependentVerifiedSale;
  }

  return movementCaps.multipleIndependentVerifiedSales;
}

function calculateWeeklyMarketPrice(input) {
  if (input.hasMajorOutlier) {
    const { score } = calculateMarketScore(input);

    return {
      status: "HELD_FOR_REVIEW",
      marketScore: score,
      movementCapPercent: 0,
      calculatedMovementPercent: 0,
      calculatedPricePhp: input.currentPublishedPricePhp
    };
  }

  if (!input.hasFreshMaterialEvidence) {
    return {
      status: "NO_EVIDENCE_NO_MOVEMENT",
      marketScore: 50,
      movementCapPercent: 0,
      calculatedMovementPercent: 0,
      calculatedPricePhp: input.currentPublishedPricePhp
    };
  }

  const { score } = calculateMarketScore(input);
  const movementCap = getMovementCap(input.verifiedSaleCount);
  const rawMovement = ((score - 50) / 50) * movementCap;
  const movement = Math.max(-movementCap, Math.min(movementCap, rawMovement));

  return {
    status: "CALCULATED",
    marketScore: score,
    movementCapPercent: movementCap * 100,
    calculatedMovementPercent: movement * 100,
    calculatedPricePhp: Math.round(input.currentPublishedPricePhp * (1 + movement))
  };
}

function printHelp() {
  console.log(`Market pricing demo\n\nUsage:\n  npm run pricing:update -- --card Boa --price 160000 --sales 1 --transaction 65 --buyerIntent 60 --searchDemand 55 --scarcity 80 --momentum 62 --breadth 40\n\nRequired:\n  --price <php>       Current Published Price, used as the weekly base\n\nUseful options:\n  --card <name>       Label only\n  --sales <count>     Verified sale count this period; default 0\n  --transaction <0-100>\n  --buyerIntent <0-100>\n  --searchDemand <0-100>\n  --scarcity <0-100>\n  --momentum <0-100>\n  --breadth <0-100>\n  --no-evidence       Preserve current price\n  --outlier           Hold for manual review\n`);
}

try {
  const input = readArgs(process.argv.slice(2));

  if (!input.currentPublishedPricePhp) {
    printHelp();
    process.exitCode = 1;
  } else {
    input.verifiedSaleCount ??= 0;

    const { populated } = calculateMarketScore(input);
    const result = calculateWeeklyMarketPrice(input);
    const difference = result.calculatedPricePhp - input.currentPublishedPricePhp;

    console.log("Market Price Update Demo");
    console.log("--------------------------");
    console.log(`Card: ${input.card ?? "Manual input"}`);
    console.log(`Base: ${peso(input.currentPublishedPricePhp)} Current Published Price`);
    console.log(`Fresh evidence: ${input.hasFreshMaterialEvidence ? "yes" : "no"}`);
    console.log(`Verified sales this period: ${input.verifiedSaleCount}`);
    console.log(`Status: ${result.status}`);
    console.log(`Market Score: ${result.marketScore}/100`);
    console.log(`Movement Cap: ±${result.movementCapPercent.toFixed(2)}%`);
    console.log(`Movement: ${result.calculatedMovementPercent >= 0 ? "+" : ""}${result.calculatedMovementPercent.toFixed(2)}%`);
    console.log(`Next Calculated Price: ${peso(result.calculatedPricePhp)}`);
    console.log(`Peso Change: ${difference >= 0 ? "+" : ""}${peso(difference)}`);

    if (populated.length > 0) {
      console.log("\nKPI inputs counted:");
      for (const [name, value, weight] of populated) {
        console.log(`- ${name}: ${value}/100, base weight ${(weight * 100).toFixed(0)}%`);
      }
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  printHelp();
  process.exitCode = 1;
}
