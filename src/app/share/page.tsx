import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ data?: string, id?: string }> }): Promise<Metadata> {
  const { data, id } = await searchParams;
  if (!data && !id) return {};

  const headersList = await headers();
  const host = headersList.get('host') || 'doppapp.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
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

export default async function SharePage({ searchParams }: { searchParams: Promise<{ data?: string, id?: string }> }) {
  const { data, id } = await searchParams;
  let imageUrl = '';
  
  if (id) {
    imageUrl = `/api/receipt?id=${id}`;
  } else if (data) {
    imageUrl = `/api/receipt?data=${data}`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6">
      <h1 className="text-2xl font-black mb-6 text-zinc-800">İşte Benim Siparişim!</h1>
      {imageUrl && (
        <div className="rounded-3xl overflow-hidden shadow-2xl mb-8 max-w-md w-full border border-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="DoppApp Sepetim" className="w-full h-auto object-contain" />
        </div>
      )}
      <Link 
        href="/"
        className="px-8 py-4 rounded-xl bg-[var(--accent)] text-white font-bold hover:opacity-90 transition-opacity"
      >
        Uygulamaya Git
      </Link>
    </div>
  );
}
