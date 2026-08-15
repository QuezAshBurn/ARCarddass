import { NextResponse } from "next/server";
import {
  conditionNmMultipliers,
  gradeMultipliers,
  kpiWeights,
  methodologyVersion,
  movementCaps,
  versionRelationships
} from "@/config/pricing-rules";
import {
  autonomousKpiWeights,
  conditionCategories,
  marketEventTypes,
  pricingRuleVersion,
  signalWindowsDays,
  validationStatuses
} from "@/lib/domain/market-rules";
import { collectorPricingRuleVersion } from "@/lib/domain/collector-pricing";

export function GET() {
  return NextResponse.json({
    methodologyVersion,
    pricingRuleVersion,
    collectorPricingRuleVersion,
    principle:
      "Initial pricing runs once. Scheduled checks may run frequently, but published prices only move when fresh validated evidence materially affects KPI scoring.",
    collectorPricePrinciple:
      "Collector Price is separate from Market Index and is based primarily on accepted comparable verified sales. If there is not enough sale evidence, it remains null.",
    noEvidenceRule: "No meaningful evidence means zero market-price movement.",
    transactionRule:
      "Verified transactions influence pricing but do not automatically reset published prices.",
    gradeMultipliers,
    conditionNmMultipliers,
    versionRelationships,
    kpiWeights,
    autonomousKpiWeights,
    movementCaps,
    signalWindowsDays,
    eventTypes: marketEventTypes,
    validationStatuses,
    conditionCategories
  });
}
