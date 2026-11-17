export const runtime = "nodejs";

// 单个简历文件最大 10MB，防止超大文件拖垮 serverless 函数。
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "请上传文件" }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ error: "文件为空，请重新上传" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "文件不能超过 10MB，请压缩后重试" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    let text = "";

    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".docx")) {
      // DOCX 是压缩包结构，交给 mammoth 提取纯文本。
      const mammoth = (await import("mammoth")).default as {
        extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }>;
      };
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".pdf")) {
      // pdf-parse 只能读取带文字层的 PDF；扫描版会在下面给出明确提示。
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

    // 扫描版 PDF 没有文字层，提取结果会接近空，提示用户改用图片 OCR。
    if (name.endsWith(".pdf") && cleaned.length < 20) {
      return Response.json(
        {
          error:
            "该 PDF 可能是扫描版，未检测到文字层。请上传清晰的简历截图，使用「识别图片」功能，或换一份可复制文字的 PDF。"
        },
        { status: 422 }
      );
    }

    if (!cleaned) {
      return Response.json(
        { error: "未从文件中提取到文字，请检查文件内容" },
        { status: 422 }
      );
    }

    return Response.json({ text: cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
