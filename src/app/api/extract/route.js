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

    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1); // 1 = صرف ٹیکسٹ نکالنے کے لیے

      pdfParser.on("pdfParser_dataError", errData => {
        console.error("❌ PDF پارسنگ ایرر:", errData.parserError);
        resolve(NextResponse.json({ error: "پی ڈی ایف پڑھنے میں خرابی" }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", pdfData => {
        const rawText = pdfParser.getRawTextContent();
        resolve(NextResponse.json({ text: rawText }));
      });

      pdfParser.parseBuffer(buffer);
    });

  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}