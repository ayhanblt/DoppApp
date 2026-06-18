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

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

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

    const totalStr = data.total || '';
    const hasLira = totalStr.includes('₺');
    const totalWithoutLira = totalStr.replace('₺', '').trim();

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#fbf5f1',
            borderLeft: '16px solid #fb4824',
            borderRight: '16px solid #fb4824',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: '60px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '60px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158.4 206.81" style={{ width: '40px', height: '52px', marginRight: '16px' }}>
                  <path fill="#ec2e19" d="M3.18,90.56a66.86,66.86,0,0,1-.47-39.24A72,72,0,0,1,27.34,15,70.91,70.91,0,0,1,60.28,1c4.07-.64,8-1.26,12.12-.8a2.76,2.76,0,0,1,2.33,1.36,3.32,3.32,0,0,1,.18,1.4c0,8.44,0,16.88,0,25.32C75,30.7,74,31.81,71.45,32c-12.75,1.08-23.23,6.7-30.7,17-9,12.47-10.3,25.9-2.92,39.69q20,37.35,40.08,74.62a6.88,6.88,0,0,0,1.63,2.31c.57,1.25,1,2.56,1.71,3.77,3.9,7.17,7.8,14.33,11.77,21.46a15.57,15.57,0,0,1,2.27,9.2,21,21,0,0,1-14.91,6.68c-10.88.59-18-4.76-22.92-14-5.86-11-12-21.78-18-32.7-9-16.61-18-33.28-27.09-49.87C9.18,104.32,6,98.42,3.71,92.12,3.52,91.6,3.35,91.09,3.18,90.56Z" />
                  <path fill="#fd4b13" d="M95.29,200.08a15.57,15.57,0,0,0-2.27-9.2c-4-7.13-7.87-14.29-11.77-21.46-.66-1.21-1.14-2.52-1.71-3.77q8.35-15.48,16.72-30.94c3.6-6.64,7.28-13.25,10.85-19.91,4.83-9,9.71-18,14.35-27.09,12.61-24.76-7.7-54.22-34.38-55.42-2.52-.12-3.76-1.51-3.77-4q0-12.14,0-24.26c0-3.13.85-3.88,4.07-3.91,34.82-.28,64.31,26.29,70.11,60.09,2.35,13.68.08,26.63-5.71,38.89-4.69,9.94-10.41,19.38-15.71,29-4.09,7.44-8.27,14.83-12.32,22.29q-11.65,21.48-23.21,43a14.68,14.68,0,0,0-.57,1.43l-1,1.56-.48.52-2.11,2.64Z" />
                  <path fill="#fd9331" d="M86.74,32.29A39.21,39.21,0,0,1,108.3,40.1c22.31,1.78,37.53,8,47.65,14.49C148,23.5,119.91-.17,87,.1,83.82.13,83,.88,83,4q0,12.14,0,24.26C83,30.78,84.22,32.17,86.74,32.29Z" />
                  <path fill="#fd4c13" d="M34.92,60A42.47,42.47,0,0,1,40.75,49c7.47-10.31,18-15.93,30.7-17,2.54-.21,3.5-1.32,3.48-3.78-.06-8.44-.05-16.88,0-25.32a3.18,3.18,0,0,0-.19-1.4A2.09,2.09,0,0,0,73.56.46C36.35,15.11,33,43,34.92,60Z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600.43 127.86" style={{ width: '150px', height: '32px' }}>
                  <path fill="#000000" d="M0,0H31.14C63.72,0,78.43,15.86,78.43,47.86c0,25.57-10.14,52.29-47,52.29H0ZM21.72,82.15h8c20.43,0,26.28-13,26.28-32.29C56,25.72,45.43,18,29.57,18H21.72Z" />
                  <path fill="#000000" d="M90.43,60.15C90.43,35.29,100.86,18,127.57,18c27.86,0,36.58,16.57,36.58,41.57s-10.57,42.15-37.29,42.15C99.14,101.72,90.43,85.15,90.43,60.15Zm37.14,24.71c11,0,14.43-8,14.43-24.43,0-16.71-4.14-25.57-15.28-25.57-9.86,0-14.15,8-14.15,24.43C112.57,76,116.72,84.86,127.57,84.86Z" />
                  <path fill="#000000" d="M213.15,100.58a55.19,55.19,0,0,1-12.43-1.29v28.57H179.29V19.43h15.86l4.57,6.86h.57c3-3.57,9.14-8.29,19.29-8.29,17.71,0,29.85,13.29,29.85,38.43C249.43,86.15,232.58,100.58,213.15,100.58Zm-2.57-17.43c10.42,0,16.85-6,16.85-24.86,0-16-6.71-22.86-15.14-22.86a14.13,14.13,0,0,0-11.86,6.14V80.72C203.58,82.58,208.43,83.15,210.58,83.15Z" />
                  <path fill="#000000" d="M298.43,100.58A55.26,55.26,0,0,1,286,99.29v28.57H264.57V19.43h15.86L285,26.29h.58c3-3.57,9.14-8.29,19.28-8.29,17.72,0,29.86,13.29,29.86,38.43C334.72,86.15,317.86,100.58,298.43,100.58Zm-2.57-17.43c10.43,0,16.86-6,16.86-24.86,0-16-6.72-22.86-15.14-22.86a14.13,14.13,0,0,0-11.86,6.14V80.72C288.86,82.58,293.72,83.15,295.86,83.15Z" />
                  <path fill="#000000" d="M402.86,0l30.43,100.15H410.43l-6.28-23H370.58l-6.43,23h-22L372.43,0ZM375.58,59.15h23.57l-3.86-14c-3.86-13.85-5.86-21.14-7.57-30h-.57c-1.72,8.58-3.86,16.72-7.43,29.43Z" />
                  <path fill="#000000" d="M478.86,100.58a55.26,55.26,0,0,1-12.43-1.29v28.57H445V19.43h15.86l4.57,6.86H466c3-3.57,9.15-8.29,19.29-8.29,17.72,0,29.86,13.29,29.86,38.43C515.15,86.15,498.29,100.58,478.86,100.58Zm-2.57-17.43c10.43,0,16.86-6,16.86-24.86,0-16-6.72-22.86-15.15-22.86a14.13,14.13,0,0,0-11.85,6.14V80.72C469.29,82.58,474.15,83.15,476.29,83.15Z" />
                  <path fill="#000000" d="M564.15,100.58a55.19,55.19,0,0,1-12.43-1.29v28.57H530.29V19.43h15.86l4.57,6.86h.57c3-3.57,9.14-8.29,19.29-8.29,17.71,0,29.85,13.29,29.85,38.43C600.43,86.15,583.58,100.58,564.15,100.58Zm-2.57-17.43c10.42,0,16.85-6,16.85-24.86,0-16-6.71-22.86-15.14-22.86a14.13,14.13,0,0,0-11.86,6.14V80.72C554.57,82.58,559.43,83.15,561.58,83.15Z" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fb4824', padding: '12px 20px', borderRadius: '24px', color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>
                <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M11.035 7.69a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                {data.locale === 'tr' ? 'Hayalimdeki Sipariş' : 'My Dream Order'}
              </div>
            </div>

            {/* Total Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', width: '100%' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '4px', color: '#9ca3af', marginBottom: '8px' }}>
                {data.locale === 'tr' ? 'TOPLAM HARCAMA' : 'TOTAL SPENT'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '100px', fontWeight: 'bold', color: '#fb4824', letterSpacing: '-2px' }}>
                {hasLira && (
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '56px', height: '84px', marginRight: '8px', marginTop: '10px' }} fill="#fb4824" viewBox="0 0 12.72 23.35">
                    <path d="M2.31,14.27,0,15.87V13.45l2.31-1.6V9.58L0,11.17V8.75L2.31,7.16V0H5.49V5.11L9.73,2.16V4.58l-4.24,3V9.81l4.24-3V9.27l-4.24,3v7.23A5.09,5.09,0,0,0,10,14.18a7.08,7.08,0,0,0-.1-1.29l2.63-.84a10.51,10.51,0,0,1,.2,1.95c0,6.32-4.11,9.54-10.41,9.34Z" />
                  </svg>
                )}
                <b style={{ textShadow: '1px 1px 0 #fb4824, -1px -1px 0 #fb4824, 1px -1px 0 #fb4824, -1px 1px 0 #fb4824, 0 2px 0 #fb4824, 2px 0 0 #fb4824, -2px 0 0 #fb4824, 0 -2px 0 #fb4824' }}>{totalWithoutLira}</b>
              </div>
            </div>

            {/* Items List Box */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, backgroundColor: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', marginBottom: '30px' }}>
              {data.items.slice(0, 5).map((item: { name: string, qty: number, image?: string }, idx: number) => {
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '24px', borderBottom: '2px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#fee2e2', borderRadius: '8px', marginRight: '24px', fontWeight: 'bold', color: '#fb4824', fontSize: '20px' }}>
                      {item.qty}
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: '600', color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
              {data.items.length > 5 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '24px', borderBottom: '2px solid #e5e7eb' }}>
                  <span style={{ fontSize: '20px', fontWeight: '500', color: '#9ca3af', flex: 1, textAlign: 'center' }}>
                    ... ve {data.items.length - 5} {data.locale === 'tr' ? 'ürün daha' : 'more items'}
                  </span>
                </div>
              )}
              {/* Empty space filler for the rest of the box */}
              <div style={{ display: 'flex', flex: 1, backgroundColor: '#ffffff' }}></div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#9ca3af' }}>
              <span style={{ marginRight: '16px' }}>Favorilerini keşfet, sepetini oluştur ve paylaş!</span>
              <span>·</span>
              <span style={{ color: '#fb4824', marginLeft: '16px' }}>doppapp.com</span>
            </div>
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
