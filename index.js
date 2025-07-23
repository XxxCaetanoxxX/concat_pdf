import PDFMerger from 'pdf-merger-js';
import { exec, spawn } from 'child_process';

function isPDFEncrypted(filePath) {
  return new Promise((resolve, reject) => {
    const qpdf = spawn('qpdf', ['--show-encryption', filePath]);

    let stdout = '';
    let stderr = '';

    qpdf.stdout.on('data', data => {
      stdout += data.toString();
    });

    qpdf.stderr.on('data', data => {
      stderr += data.toString();
    });

    qpdf.on('close', (code) => {
      if (code !== 0 && stdout === '') {
        return reject(new Error(stderr));
      }

      const isEncrypted = stdout.includes('encryption');
      resolve(isEncrypted);
    });
  });
}

function limparPDF(input, output) {
  return new Promise((resolve, reject) => {
    exec(`pdftk "${input}" output "${output}"`, (err, stdout, stderr) => {
      if (err) {
        console.error(`Erro ao limpar ${input}:`, stderr);
        return reject(err);
      }
      console.log(`PDF salvo sem proteção como ${output}`);
      resolve(output);
    });
  });
}

async function prepararPDF(pdfPath, outputPath) {
  const encrypted = await isPDFEncrypted(pdfPath);
  if (encrypted) {
    console.log(`${pdfPath} está criptografado. Descriptografando...`);
    await limparPDF(pdfPath, outputPath);
    return outputPath;
  } else {
    console.log(`${pdfPath} não está criptografado.`);
    return pdfPath;
  }
}

async function unirPDFs(arquivos, destino) {
  const merger = new PDFMerger();

  for (const arquivo of arquivos) {
    await merger.add(arquivo);
  }

  await merger.save(destino);
  console.log(`PDF unido com sucesso em: ${destino}`);
}

async function main() {
  try {
    const doc1 = await prepararPDF('documento_protegido.pdf', 'documento_protegido_limpo.pdf');
    const doc2 = await prepararPDF('documento_teste_2.pdf', 'documento_teste_2_limpo.pdf');

    await unirPDFs([doc1, doc2], 'pdfunido.pdf');
  } catch (error) {
    console.error("Falha no processo:", error.message);
  }
}

main();