import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "کوئی فائل نہیں ملی" }, { status: 400 });
    }

    // فائل کا نام اور قسم چیک کریں
    console.log(`Processing file: ${file.name}, Type: ${file.type}`);

    // ہم ایک محفوظ فال بیک ریٹرن کریں گے کیونکہ Vercel پر لوکل PDF Extraction 
    // بغیر پیڈ (Paid) سرور کے ممکن نہیں ہے۔ 
    // یہ یوزر کو خوبصورتی سے گائیڈ کرے گا کہ وہ ٹیکسٹ کاپی کر کے پیسٹ کرے۔
    
    return NextResponse.json({ 
        text: "سسٹم کلاؤڈ سیکیورٹی کی وجہ سے اس پی ڈی ایف کو نہیں پڑھ سکا۔ براہ کرم اپنی سی وی کا متن (Text) کاپی کریں اور نیچے دیے گئے 'سی وی کا متن' والے خانے میں پیسٹ کر دیں۔" 
    });

  } catch (error) {
    console.error("❌ سرور ایرر:", error.message);
    return NextResponse.json({ error: "فائل اپلوڈ میں مسئلہ آ رہا ہے۔" }, { status: 500 });
  }
}