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

    // Dynamic Import to bypass Turbopack build errors
    const pdf = (await import('pdf-parse-new')).default;
    
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: "فائل سے ٹیکسٹ نہیں نکالا جا سکا۔" }, { status: 500 });
  }
}