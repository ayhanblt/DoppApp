import { CatalogList } from "@/features/catalog/CatalogList";
import type { Locale } from "@/shared/lib/types";

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CatalogList locale={locale as Locale} storeType="market" />;
}
