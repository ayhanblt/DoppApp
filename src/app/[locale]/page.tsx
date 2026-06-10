import { notFound } from "next/navigation";
import { FoodDeliveryApp } from "@/features/catalog/FoodDeliveryApp";
import { isLocale } from "@/shared/i18n/config";

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <FoodDeliveryApp locale={locale} />;
}
