import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `Analizza questo taglio di capelli come un Master Barber AI (The Prince AI Barber Coach).
Valuta tecnicamente i seguenti aspetti:
- Fade (Sfumatura): la transizione tra le diverse lunghezze è fluida?
- Blend (Connessione): come si collega la sfumatura alla parte superiore?
- Contorni: sono definiti e puliti?
- Simmetria: il taglio è bilanciato su entrambi i lati?
- Consigli tecnici: cosa potrebbe migliorare il barbiere in questo specifico taglio?

Rispondi in modo professionale ed elegante, in lingua italiana.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: image.type,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const analysis = response.text;

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze image" }, { status: 500 });
  }
}
