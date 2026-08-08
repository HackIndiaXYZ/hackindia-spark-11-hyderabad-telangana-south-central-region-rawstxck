import GlobalNav from '@/components/GlobalNav';
import GlobalPaymentListener from '@/components/GlobalPaymentListener';

export default async function RepoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalNav />
      {children}
      <GlobalPaymentListener />
    </>
  );
}
