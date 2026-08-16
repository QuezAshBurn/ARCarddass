import Image from "next/image";

export function FormationWordmark() {
  return (
    <Image
      src="/assets/ui/formation-market-wordmark.svg"
      alt="AR King Rare Market"
      width={1200}
      height={420}
      priority
      className="formation-wordmark"
    />
  );
}
