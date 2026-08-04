type LiquidRouteLayerProps = {
  state?: "idle" | "enter" | "exit";
};

export function LiquidRouteLayer({ state = "idle" }: LiquidRouteLayerProps) {
  return <div className="liquid-route-layer" data-state={state} aria-hidden="true" />;
}
