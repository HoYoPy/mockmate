declare module "pdf-parse/lib/pdf-parse.js" {
  interface PDFParseResult {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
  }

  function pdfParse(
    buffer: Buffer,
    options?: Record<string, unknown>
  ): Promise<PDFParseResult>;

  export default pdfParse;
}
