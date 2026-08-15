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

export function GET() {
  return NextResponse.json({
    methodologyVersion,
    pricingRuleVersion,
    principle:
      "Initial pricing runs once. Scheduled checks may run frequently, but published prices only move when fresh validated evidence materially affects KPI scoring.",
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
