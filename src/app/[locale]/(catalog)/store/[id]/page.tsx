import { Locale } from "@/shared/lib/types";
import { StoreDetailClient } from "@/features/catalog/StoreDetailClient";

export default async function StorePage({ params }: { params: Promise<{ locale: Locale, id: string }> }) {
  const { locale, id } = await params;

  return <StoreDetailClient locale={locale} storeId={id} />;
}
