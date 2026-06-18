import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ data?: string, id?: string }> }): Promise<Metadata> {
  const { data, id } = await searchParams;
  if (!data && !id) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doppapp.com';
  let imageUrl = '';

  if (id) {
    imageUrl = `${baseUrl}/api/receipt?id=${id}`;
  } else if (data) {
    imageUrl = `${baseUrl}/api/receipt?data=${data}`;
  }

  return {
    title: 'DoppApp Sepetim',
    description: 'İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin?',
    openGraph: {
      title: 'DoppApp Sepetim',
      description: 'İşte benim DoppApp sepetim!',
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      images: [imageUrl],
    },
  };
}

export default function SharePage() {
  redirect('/');
}
