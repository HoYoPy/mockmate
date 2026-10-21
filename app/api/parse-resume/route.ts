export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "请上传文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".docx")) {
      const mammoth = (await import("mammoth")).default as {
        extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
      };
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".pdf")) {
      const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      return Response.json(
        { error: "暂不支持该格式，请上传 txt / md / docx / pdf" },
        { status: 400 }
      );
    }

    const cleaned = text.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
    return Response.json({ text: cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
