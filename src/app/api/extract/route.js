import { NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Vercel کے لیے Web Worker کو بند کرنا ضروری ہے
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // PDF کو لوڈ کرنا
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';

    // ہر پیج سے باری باری ٹیکسٹ نکالنا
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + ' \n';
    }

    const cleanText = fullText.replace(/\s+/g, ' ').trim();

    return NextResponse.json({ text: cleanText });

  } catch (error) {
    console.error("❌ PDF Extraction Error:", error);
    return NextResponse.json({ error: "فائل سے ٹیکسٹ نہیں نکالا جا سکا۔" }, { status: 500 });
  }
}