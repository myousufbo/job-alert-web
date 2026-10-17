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

    // Dynamic Import کا استعمال تاکہ Turbopack کو مسئلہ نہ ہو
    const PDFParser = (await import('pdf2json')).default;
    
    return new Promise((resolve) => {
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", errData => {
        console.error("❌ PDF پارسنگ ایرر:", errData.parserError);
        resolve(NextResponse.json({ error: "پی ڈی ایف پڑھنے میں خرابی" }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const rawText = pdfParser.getRawTextContent();
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