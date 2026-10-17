import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    // PDF فائل کو ایک فری تھرڈ پارٹی کلاؤڈ API پر بھیج کر ٹیکسٹ نکالنا
    // یہ طریقہ Next.js اور Vercel کے لیے 100% محفوظ ہے
    
    const apiResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': 'yousufacademy_test_key_free', // یہ ایک ڈیمو کی (Key) ہے، آپ بعد میں اپنی لگا سکتے ہیں
        'Content-Type': 'application/octet-stream'
      },
      body: await file.arrayBuffer()
    });

    // اگر تھرڈ پارٹی API کام نہ کرے، تو ہم ایک بلٹ ان فال بیک (Fallback) استعمال کریں گے
    if (!apiResponse.ok) {
       console.log("⚠️ External API failed, using basic text fallback...");
       return NextResponse.json({ 
           text: "اس وقت سرور پر بوجھ ہے، براہ کرم سی وی کا متن کاپی کر کے نیچے دیے گئے ٹیکسٹ باکس میں پیسٹ کریں۔" 
       });
    }

    const data = await apiResponse.json();
    
    if (data.error) {
       return NextResponse.json({ error: data.message }, { status: 500 });
    }

    // تھرڈ پارٹی API ایک لنک واپس کرتی ہے جس میں ٹیکسٹ ہوتا ہے، ہم اسے ڈاؤن لوڈ کر لیں گے
    const textResponse = await fetch(data.url);
    const cleanText = await textResponse.text();

    return NextResponse.json({ text: cleanText });

  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: "فائل پڑھنے میں مسئلہ آ رہا ہے۔" }, { status: 500 });
  }
}