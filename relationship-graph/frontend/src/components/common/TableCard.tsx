/** The surface every admin table sits on. */
export function TableCard({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl bg-card shadow-soft">{children}</div>;
}
