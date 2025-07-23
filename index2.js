import PDFMerger from 'pdf-merger-js';
import { exec } from 'child_process';

function limparPDF(input, output) {
  return new Promise((resolve, reject) => {
    exec(`pdftk ${input} output ${output}`, (err, stdout, stderr) => {
      if (err) {
        console.error('Erro ao limpar PDF:', stderr);
        return reject(err);
      }
      console.log(`PDF salvo sem proteção como ${output}`);
      resolve();
    });
  });
}

async function unirPDFs() {
  const merger = new PDFMerger();

  await merger.add('./documento_limpo.pdf');
  await merger.add('./documento_teste_2.pdf');

  await merger.save('./pdfunido.pdf');
  console.log("PDF unido com sucesso!");
}

async function main() {
  try {
    await limparPDF('documento_protegido.pdf', 'documento_limpo.pdf');
    await unirPDFs();
  } catch (error) {
    console.error("Falha no processo:", error.message);
  }
}

main();
