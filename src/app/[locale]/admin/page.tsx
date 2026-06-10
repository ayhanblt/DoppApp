import { notFound } from "next/navigation";
import { AdminPanel } from "@/features/admin/AdminPanel";
import { isLocale } from "@/shared/i18n/config";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AdminPanel locale={locale} />;
}
