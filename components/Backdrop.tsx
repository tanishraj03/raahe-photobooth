/**
 * The room the booth stands in: a drifting field of pink dots, a
 * slow bar of light crossing the screen, and a film grain over the
 * top. All of it is behind everything else and none of it is
 * interactive.
 *
 * Flat dots and one moving highlight — no gradient surfaces, no
 * cards, nothing that competes with the type.
 */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-dots" />
      <div className="backdrop-sweep" />
      <div className="backdrop-grain" />
    </div>
  );
}
