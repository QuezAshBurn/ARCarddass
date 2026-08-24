export type ChecklistCardState = {
  owned: boolean;
  wanted: boolean;
};

export type ChecklistState = Record<string, ChecklistCardState>;

export const checklistStorageKey = "ar-carddass-checklist-v1";

export function normalizeChecklistState(value: unknown): ChecklistState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, Record<string, unknown>] => {
        return Boolean(entry[0]) && Boolean(entry[1]) && typeof entry[1] === "object" && !Array.isArray(entry[1]);
      })
      .map(([cardNumber, state]) => [
        cardNumber,
        {
          owned: Boolean(state.owned),
          wanted: Boolean(state.wanted)
        }
      ])
  );
}

export function calculateChecklistCompletion(cardNumbers: string[], state: ChecklistState) {
  const total = cardNumbers.length;
  const owned = cardNumbers.filter((cardNumber) => state[cardNumber]?.owned).length;
  const wanted = cardNumbers.filter((cardNumber) => state[cardNumber]?.wanted).length;

  return {
    total,
    owned,
    wanted,
    percent: total ? Math.round((owned / total) * 100) : 0
  };
}
