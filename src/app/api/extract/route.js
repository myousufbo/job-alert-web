import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    // فائل کو پڑھنے کے لیے بفر (Buffer) میں تبدیل کرنا
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    // نکالا گیا ٹیکسٹ واپس ویب سائٹ کو بھیجنا
    return NextResponse.json({ text: data.text });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}