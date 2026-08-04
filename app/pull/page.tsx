import { PullExperience } from "@/components/pull/PullExperience";

export default function PullPage() {
  return (
    <section className="hero">
      <div className="page-shell hero__content">
        <div className="hero__copy">
          <span className="hero__eyebrow">Optional nostalgia feature</span>
          <h1>Open a Formation Pack.</h1>
          <p>
            A visual collector reveal only — no real-money purchase, no odds, no
            gambling loop. Skip Animation is always available and reduced-motion
            users receive the complete static experience.
          </p>
        </div>
        <PullExperience />
      </div>
    </section>
  );
}
