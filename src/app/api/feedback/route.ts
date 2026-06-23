import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize Resend
// Note: User must add RESEND_API_KEY to their .env.local
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, title, message_type, message } = data;

    if (!email || !title || !message_type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Save to Supabase
    const { data: insertData, error: dbError } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: name || null,
          email,
          title,
          message_type,
          message,
        }
      ]);

    if (dbError) {
      console.error('Supabase Error:', dbError);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    // 2. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
      const typeLabel = message_type === 'istek' ? 'İstek' : message_type === 'urun_ekleme' ? 'Ürün Ekleme Talebi' : message_type === 'sikayet' ? 'Şikayet' : 'Teşekkür';
      
      const { error: emailError } = await resend.emails.send({
        from: 'DoppApp Feedback <onboarding@resend.dev>',
        to: ['ayhanbulut91@gmail.com'],
        subject: `[DoppApp ${typeLabel}] ${title}`,
        html: `
          <h2>Yeni Geri Bildirim Geldi</h2>
          <p><strong>Ad Soyad:</strong> ${name || 'Belirtilmedi'}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Tür:</strong> ${typeLabel}</p>
          <p><strong>Başlık:</strong> ${title}</p>
          <hr />
          <p><strong>Mesaj:</strong><br />${message.replace(/\n/g, '<br />')}</p>
        `,
      });

      if (emailError) {
        console.error('Resend Error:', emailError);
        // We still return 200 because DB insert succeeded, but log the email error.
      }
    } else {
      console.warn('RESEND_API_KEY is not set. Email was not sent.');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Feedback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
