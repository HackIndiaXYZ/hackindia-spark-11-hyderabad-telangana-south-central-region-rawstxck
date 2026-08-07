import GlobalNav from "@/components/GlobalNav";

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalNav />
      {children}
    </>
  );
}
