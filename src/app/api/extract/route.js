import { NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve) => {
      // یہاں 'this' کی جگہ 'null' کا استعمال کیا گیا ہے جو Next.js کے لیے ضروری ہے
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", errData => {
        console.error("❌ PDF پارسنگ ایرر:", errData.parserError);
        resolve(NextResponse.json({ error: "پی ڈی ایف پڑھنے میں خرابی" }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const rawText = pdfParser.getRawTextContent();
        // ٹیکسٹ کو کلین (Clean) کر کے واپس بھیجنا
        const cleanText = rawText.replace(/\r\n/g, " ").replace(/\n/g, " ");
        resolve(NextResponse.json({ text: cleanText }));
      });

      pdfParser.parseBuffer(buffer);
    });

  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}