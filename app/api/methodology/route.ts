import { NextResponse } from "next/server";
import {
  conditionNmMultipliers,
  gradeMultipliers,
  kpiWeights,
  methodologyVersion,
  movementCaps,
  versionRelationships
} from "@/config/pricing-rules";

export function GET() {
  return NextResponse.json({
    methodologyVersion,
    principle:
      "Initial pricing runs once; market pricing starts from current published price and only fresh KPI evidence.",
    gradeMultipliers,
    conditionNmMultipliers,
    versionRelationships,
    kpiWeights,
    movementCaps
  });
}
