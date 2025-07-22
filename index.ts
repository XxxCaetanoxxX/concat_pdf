import { google } from "googleapis";
import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("documento.docx");
const SERVICE_ACCOUNT_FILE = path.resolve("credentials.json");

async function authorize() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ["https://www.googleapis.com/auth/docs"],
  });

  return await auth.getClient();
}

async function uploadDocx(auth: any) {
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: "Documento Convertido",
    mimeType: "application/vnd.google-apps.document",
    parents: ["1GKEyLB5EpBgmpYVF4r0NxEOwqgxFpg9M"]
  };

  const media = {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    body: fs.createReadStream(FILE_PATH),
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, webViewLink",
  });

  console.log("\n✅ Arquivo enviado e convertido com sucesso!");
  console.log("📄 Nome:", res.data.name);
  console.log("🔗 Link:", res.data.webViewLink);
}

async function main() {
  const auth = await authorize();
  await uploadDocx(auth);
}

main().catch(console.error);
