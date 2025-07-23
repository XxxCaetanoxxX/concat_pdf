import PDFMerger from 'pdf-merger-js';
import { exec, spawn } from 'child_process';

function isPDFEncrypted(filePath) {
  return new Promise((resolve, reject) => {
    //Esse comando mostra se o PDF possui criptografia.
    const qpdf = spawn('qpdf', ['--show-encryption', filePath]);

    let stdout = '';
    let stderr = '';

    //retorna informações sobre criptografia
    qpdf.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
      stdout += data.toString();
    });

    //warnings ou mensagens de erro
    qpdf.stderr.on('data', data => {
      console.log(`stderr: ${data}`);
      stderr += data.toString();
    });

    qpdf.on('close', (code) => {
      if (code !== 0 && stdout === '') {
        return reject(new Error(stderr));
      }


      //Aqui a função verifica se a palavra "encryption" aparece no resultado. Se sim, o PDF está criptografado.
      const isEncrypted = stdout.includes('encryption');
      resolve(isEncrypted);
    });
  });
}

function limparPDF(input, output) {
  return new Promise((resolve, reject) => {
    //vai executar o comando do pdftk para clonar o pdf descriptografado
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
    //se o pdf for criptografado, vai executar a função de limpar o pdf, caso contrario só vai retornar o caminho do pdf normalmente
    console.log(`${pdfPath} está criptografado. Descriptografando...`);
    await limparPDF(pdfPath, outputPath);
    return outputPath;
  } else {
    console.log(`${pdfPath} não está criptografado.`);
    return pdfPath;
  }
}

async function unirPDFs(arquivos, destino) {
  //criar novo pdf
  const merger = new PDFMerger();

  for (const arquivo of arquivos) {
    await merger.add(arquivo);
  }

  //salva o novo pdf
  await merger.save(destino);
  console.log(`PDF unido com sucesso em: ${destino}`);
}

async function main() {
  try {
    const doc1 = await prepararPDF('documento_protegido.pdf', 'documento_protegido_limpo.pdf'); //colocar nome dos documentos de entrada e saida
    const doc2 = await prepararPDF('documento_teste_2.pdf', 'documento_teste_2_limpo.pdf'); //colocar nome dos documentos de entrada e saida

    await unirPDFs([doc1, doc2], 'pdfunido.pdf');
  } catch (error) {
    console.error("Falha no processo:", error.message);
  }
}

main();