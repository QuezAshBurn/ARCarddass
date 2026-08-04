#!/usr/bin/env node

const cards = [
  { cardNumber: "F01-01", characterName: "Luffy", price: 194000, weeklyChangePercent: 1.8, demandScore: 72, scarcityScore: 75, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F01-37", characterName: "Ace", price: 86500, weeklyChangePercent: 2.2, demandScore: 78, scarcityScore: 90, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F02-20", characterName: "Boa Hancock", price: 160000, weeklyChangePercent: 2.6, demandScore: 83, scarcityScore: 90, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F02-24", characterName: "Crocodile", price: 60000, weeklyChangePercent: -0.4, demandScore: 49, scarcityScore: 75, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F03-03", characterName: "Zoro", price: 150000, weeklyChangePercent: 2.4, demandScore: 80, scarcityScore: 75, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F03-13", characterName: "Sanji", price: 83500, weeklyChangePercent: 0.6, demandScore: 56, scarcityScore: 60, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F04-13", characterName: "Rob Lucci", price: 110000, weeklyChangePercent: 0.2, demandScore: 52, scarcityScore: 75, directEvidence: 4, modeledEvidence: 0 },
  { cardNumber: "F04-27", characterName: "Sogeking", price: 128000, weeklyChangePercent: 3.1, demandScore: 86, scarcityScore: 90, directEvidence: 4, modeledEvidence: 0 }
];

const kpiWeights = {
  transaction: 0.35,
  buyerIntent: 0.2,
  searchDemand: 0.15,
  scarcity: 0.15,
  priceMomentum: 0.1,
  marketBreadth: 0.05
};

function peso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function marketScore(input) {
  return Math.round(
    (
      input.transactionScore * kpiWeights.transaction +
      input.buyerIntentScore * kpiWeights.buyerIntent +
      input.searchDemandScore * kpiWeights.searchDemand +
      input.scarcityScore * kpiWeights.scarcity +
      input.priceMomentumScore * kpiWeights.priceMomentum +
      input.marketBreadthScore * kpiWeights.marketBreadth
    ) * 100
  ) / 100;
}

function movementCap(sales) {
  if (sales <= 0) return 0.015;
  if (sales === 1) return 0.075;
  return 0.12;
}

function calculate(card) {
  const input = {
    verifiedSaleCount: card.directEvidence >= 4 ? 2 : card.directEvidence > 0 ? 1 : 0,
    transactionScore: clampScore(50 + card.weeklyChangePercent * 4),
    buyerIntentScore: clampScore(card.demandScore),
    searchDemandScore: clampScore(45 + card.demandScore * 0.35),
    scarcityScore: clampScore(card.scarcityScore),
    priceMomentumScore: clampScore(50 + card.weeklyChangePercent * 5),
    marketBreadthScore: clampScore(30 + card.directEvidence * 12 + card.modeledEvidence * 4)
  };
  const score = marketScore(input);
  const cap = movementCap(input.verifiedSaleCount);
  const movement = Math.max(-cap, Math.min(cap, ((score - 50) / 50) * cap));
  const next = Math.round(card.price * (1 + movement));

  return {
    ...card,
    input,
    marketScore: score,
    movementCapPercent: cap * 100,
    movementPercent: movement * 100,
    nextPrice: next,
    pesoChange: next - card.price
  };
}

const updates = cards.map(calculate);

console.log("Weekly Updates For All Cards");
console.log("----------------------------");
for (const update of updates) {
  console.log(
    `${update.characterName.padEnd(12)} ${peso(update.price).padStart(10)} -> ${peso(update.nextPrice).padStart(10)}  ${update.movementPercent >= 0 ? "+" : ""}${update.movementPercent.toFixed(2)}%  score ${update.marketScore}/100`
  );
}

console.log("\nEvery seeded card was processed. In production, these results should be saved as weekly price snapshots in Supabase.");
