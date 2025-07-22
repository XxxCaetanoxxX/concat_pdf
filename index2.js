import fs from "fs";
import { PDFDocument } from "pdf-lib";
import path from "path";

async function unirPDFs(caminhosEntrada, caminhoSaida) {
  const pdfFinal = await PDFDocument.create();

  for (const arquivo of caminhosEntrada) {
    const pdfBytes = fs.readFileSync(arquivo);
    const pdf = await PDFDocument.load(pdfBytes);
    const paginas = await pdfFinal.copyPages(pdf, pdf.getPageIndices());

    paginas.forEach((pagina) => {
      pdfFinal.addPage(pagina);
    });
  }

  const pdfBytesFinal = await pdfFinal.save();
  fs.writeFileSync(caminhoSaida, pdfBytesFinal);

  console.log(`PDF unido salvo em: ${caminhoSaida}`);
}

unirPDFs(
  ['./documento_teste_1.pdf', './documento_teste_2.pdf'],
  './pdfunido.pdf'
);
