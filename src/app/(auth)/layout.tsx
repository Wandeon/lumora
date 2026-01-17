export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFBF7] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle dawn gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#FEF3C7_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#FDE68A_0%,_transparent_40%)] opacity-30 pointer-events-none" />
      {children}
    </div>
  );
}
