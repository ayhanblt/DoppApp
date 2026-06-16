import { CatalogLayout } from "@/features/catalog/CatalogLayout";
import { CatalogProvider } from "@/features/catalog/CatalogContext";
import type { Locale } from "@/shared/lib/types";

export default async function Layout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  return (
    <CatalogProvider>
      <CatalogLayout locale={locale as Locale}>
        {children}
      </CatalogLayout>
    </CatalogProvider>
  );
}
