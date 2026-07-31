/** Heading rule used to introduce a page section (label + trailing fade line). */
export default function SectionDivider({ title }) {
  return (
    <div className="section-divider">
      <h2>{title}</h2>
    </div>
  );
}
