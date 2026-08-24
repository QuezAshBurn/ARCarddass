"use client";

import { useEffect, useMemo, useState } from "react";
import type { Card } from "@/lib/data/cards";
import { checklistStorageKey, calculateChecklistCompletion, normalizeChecklistState, type ChecklistState } from "@/lib/domain/checklist";

type ChecklistClientProps = {
  cards: Card[];
};

export function ChecklistClient({ cards }: ChecklistClientProps) {
  const [setFilter, setSetFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [state, setState] = useState<ChecklistState>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(checklistStorageKey);
      setState(stored ? normalizeChecklistState(JSON.parse(stored)) : {});
    } catch {
      setState({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(checklistStorageKey, JSON.stringify(state));
  }, [state]);

  const setOptions = useMemo(
    () => Array.from(new Set(cards.map((card) => card.formationSet))).sort(),
    [cards]
  );
  const rarityOptions = useMemo(
    () => Array.from(new Set(cards.map((card) => card.rarity))).sort(),
    [cards]
  );
  const visibleCards = cards.filter((card) => {
    return (
      (setFilter === "all" || card.formationSet === setFilter) &&
      (rarityFilter === "all" || card.rarity === rarityFilter)
    );
  });
  const completion = calculateChecklistCompletion(
    visibleCards.map((card) => card.cardNumber),
    state
  );

  function toggle(cardNumber: string, key: "owned" | "wanted") {
    setState((current) => ({
      ...current,
      [cardNumber]: {
        owned: current[cardNumber]?.owned ?? false,
        wanted: current[cardNumber]?.wanted ?? false,
        [key]: !current[cardNumber]?.[key]
      }
    }));
  }

  return (
    <div className="checklist-app">
      <div className="content-card checklist-summary">
        <div>
          <span className="label">Completion</span>
          <strong>{completion.percent}%</strong>
          <p>
            {completion.owned} owned, {completion.wanted} wanted, {completion.total} visible cards.
          </p>
        </div>
        <label>
          Set
          <select value={setFilter} onChange={(event) => setSetFilter(event.target.value)}>
            <option value="all">All sets</option>
            {setOptions.map((set) => (
              <option value={set} key={set}>{set}</option>
            ))}
          </select>
        </label>
        <label>
          Rarity
          <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
            <option value="all">All rarities</option>
            {rarityOptions.map((rarity) => (
              <option value={rarity} key={rarity}>{rarity}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap checklist-table-wrap">
        <table className="checklist-table">
          <thead>
            <tr>
              <th>Card</th>
              <th>Set</th>
              <th>Rarity</th>
              <th>Version</th>
              <th>Owned</th>
              <th>Wanted</th>
            </tr>
          </thead>
          <tbody>
            {visibleCards.map((card) => (
              <tr key={card.cardNumber}>
                <td data-label="Card">
                  <img src={card.frontImagePath} alt="" />
                  <div>
                    <strong>{card.characterName}</strong>
                    <span>{card.cardNumber}</span>
                  </div>
                </td>
                <td data-label="Set">{card.formationSet}</td>
                <td data-label="Rarity">{card.rarity}</td>
                <td data-label="Version">{card.versions.map((version) => version.versionCode).join(" / ")}</td>
                <td data-label="Owned">
                  <input
                    aria-label={`Mark ${card.characterName} owned`}
                    type="checkbox"
                    checked={Boolean(state[card.cardNumber]?.owned)}
                    onChange={() => toggle(card.cardNumber, "owned")}
                  />
                </td>
                <td data-label="Wanted">
                  <input
                    aria-label={`Mark ${card.characterName} wanted`}
                    type="checkbox"
                    checked={Boolean(state[card.cardNumber]?.wanted)}
                    onChange={() => toggle(card.cardNumber, "wanted")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
