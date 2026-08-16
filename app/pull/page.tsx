import { PullExperience } from "@/components/pull/PullExperience";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export default async function PullPage() {
  const cards = await getCardsWithLivePrices();

  return (
    <section className="hero">
      <div className="page-shell hero__content">
        <div className="hero__copy">
          <span className="hero__eyebrow">Optional nostalgia feature</span>
          <h1>Open a collector pack.</h1>
          <p>
            A visual collector reveal only — no real-money purchase, no odds, no
            gambling loop. Most three-card reveals contain Wanted and Film Z cards;
            a 3% hit contains one shining King Rare. Skip Animation is always
            available and reduced-motion users receive the complete static experience.
          </p>
        </div>
        <PullExperience cards={cards} />
      </div>
    </section>
  );
}
