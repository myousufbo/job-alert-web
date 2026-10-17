import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Next.js Turbopack Bypass: ڈائنیمک امپورٹ کا استعمال
    const pdfModule = await import('pdf-parse');
    const pdf = pdfModule.default || pdfModule;
    
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}