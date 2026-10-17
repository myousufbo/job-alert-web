import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json({ error: "کوئی متن نہیں ملا" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: "Vercel پر Gemini API Key موجود نہیں ہے۔" }, { status: 500 });
    }

    // جیمنائی کو پرامپٹ (Prompt) دینا تاکہ وہ درست ڈیٹا نکالے
    const prompt = `
    آپ ایک ماہر HR اسسٹنٹ ہیں۔ نیچے دیے گئے CV کے متن کو پڑھیں اور اس میں سے یہ 3 چیزیں نکال کر صرف اور صرف JSON فارمیٹ میں جواب دیں۔ کوئی اور لفظ مت لکھیں:
    {
      "full_name": "امیدوار کا مکمل نام",
      "target_job": "اس کی مہارت کے لحاظ سے مناسب ترین جاب ٹائٹل جیسے Python Developer",
      "location": "شہر یا ملک کا نام"
    }
    
    CV Text:
    ${text.substring(0, 3000)}
    `;

    // بغیر کسی لائبریری کے ڈائریکٹ کلاؤڈ Fetch (Vercel کے لیے 100% محفوظ)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    
    if (result.error) {
        throw new Error(result.error.message);
    }

    const jsonText = result.candidates[0].content.parts[0].text;
    const parsedData = JSON.parse(jsonText);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error("❌ AI Parsing Error:", error.message);
    return NextResponse.json({ error: "ڈیٹا نکالنے میں مسئلہ آ رہا ہے۔" }, { status: 500 });
  }
}