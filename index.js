import PDFMerger from 'pdf-merger-js';
import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

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

async function prepararPDFBuffer(pdfBuffer, originalName) {
  //retornar o caminho do diretorio temporario padrao do sistema
  const tempDir = os.tmpdir();

  //gerar caminhos temporarios no sistema
  const tempInputPath = path.join(tempDir, `${randomUUID()}-${originalName}`); //caminho temporario pdf original
  const tempOutputPath = path.join(tempDir, `cleaned-${originalName}`);//caminho temporario pdf limpo

  // Salva o buffer em um arquivo temporário
  await fs.writeFile(tempInputPath, pdfBuffer);

  const isEncrypted = await isPDFEncrypted(tempInputPath);
  let finalPath = tempInputPath;

  if (isEncrypted) {
    console.log(`${originalName} está criptografado. Descriptografando...`);
    await limparPDF(tempInputPath, tempOutputPath);
    finalPath = tempOutputPath;
  } else {
    console.log(`${originalName} não está criptografado.`);
  }

  // Lê o PDF final como buffer de volta (limpo ou original)
  const resultBuffer = await fs.readFile(finalPath);

  //deletar arquivos temporários
  await fs.unlink(tempInputPath);
  if (isEncrypted) await fs.unlink(tempOutputPath);

  return resultBuffer;
}

async function unirPDFsComBuffer(buffers, destino) {
  const merger = new PDFMerger();

  for (const buffer of buffers) {
    await merger.add(buffer);
  }

  await merger.save(destino);
  console.log(`PDF unido com sucesso em: ${destino}`);
}

async function main() {
  try {
    const buffer1 = await fs.readFile('./documento_protegido.pdf');
    const buffer2 = await fs.readFile('./documento_teste_2.pdf');

    const cleaned1 = await prepararPDFBuffer(buffer1, 'documento_protegido.pdf');
    const cleaned2 = await prepararPDFBuffer(buffer2, 'documento_teste_2.pdf');

    await unirPDFsComBuffer([cleaned1, cleaned2], 'pdfunido.pdf');
  } catch (error) {
    console.error("Falha no processo:", error.message);
  }
}

main();