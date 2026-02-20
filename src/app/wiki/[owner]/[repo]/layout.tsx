export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex h-screen overflow-hidden">{children}</div>;
}
