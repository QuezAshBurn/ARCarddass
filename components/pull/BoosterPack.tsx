import Image from "next/image";

export type BoosterPackProps = {
  state?: "sealed" | "opening" | "opened";
};

export function BoosterPack({ state = "sealed" }: BoosterPackProps) {
  return (
    <div className="booster-pack" data-state={state}>
      <Image
        src="/assets/ui/booster-pack-original-placeholder.svg"
        alt="AR Formation digital collector pack"
        width={760}
        height={1320}
        priority
      />
    </div>
  );
}
