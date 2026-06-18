import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataParam = searchParams.get('data');
    const idParam = searchParams.get('id');

    let data;
    if (idParam) {
      const { data: row } = await supabase.from('shared_receipts').select('data').eq('id', idParam).single();
      if (!row) {
        return new Response("Receipt not found", { status: 404 });
      }
      data = row.data;
    } else if (dataParam) {
      data = JSON.parse(decodeURIComponent(dataParam));
    } else {
      return new Response("Missing data or id parameter", { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#fb4824',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}
            >
              D
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#fb4824', margin: 0 }}>
              DoppApp
            </h1>
          </div>
          
          <h2 style={{ fontSize: '28px', color: '#4a4a4a', marginBottom: '40px' }}>
            {data.locale === 'tr' ? 'İşte DoppApp Sepetim!' : 'My DoppApp Cart!'}
          </h2>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '80%', backgroundColor: '#f9f9f9', borderRadius: '20px', padding: '30px' }}>
            {data.items.slice(0, 4).map((item: {name: string, qty: number, image?: string}, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', borderBottom: idx < data.items.slice(0,4).length - 1 ? '1px solid #eaeaea' : 'none', paddingBottom: idx < data.items.slice(0,4).length - 1 ? '15px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.image && (
                    <img src={item.image} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', marginRight: '15px' }} />
                  )}
                  <span style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>{item.qty}x {item.name}</span>
                </div>
              </div>
            ))}
            {data.items.length > 4 && (
              <div style={{ display: 'flex', fontSize: '20px', color: '#888', marginTop: '10px' }}>
                + {data.items.length - 4} {data.locale === 'tr' ? 'ürün daha' : 'more items'}
              </div>
            )}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', marginTop: '30px', fontSize: '32px', fontWeight: '900', color: '#222' }}>
            {data.locale === 'tr' ? 'Toplam:' : 'Total:'} {data.total}
          </div>
          
          <div style={{ marginTop: '30px', fontSize: '20px', color: '#888' }}>
            doppapp.com
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
      }
    );
  } catch (e) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
