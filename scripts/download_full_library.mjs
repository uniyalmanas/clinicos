import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const root = process.cwd();
const illustrationsDir = path.join(root, "apps", "web", "public", "images", "illustrations");
const clinicalDir = path.join(root, "apps", "web", "public", "images", "clinical");
const doctorsDir = path.join(root, "apps", "web", "public", "images", "doctors");

[illustrationsDir, clinicalDir, doctorsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": "DocSphere-ClinicOS" } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(dest));
      });
    }).on("error", (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// 1. Download ALL 32 Pablo Stanley Humaaans SVGs
const humaaansBase = "https://raw.githubusercontent.com/Calinou/humaaans/master/Flat%20Assets";
const allHumaaans = [];

// Sitting 1-8
for (let i = 1; i <= 8; i++) {
  allHumaaans.push({
    remote: `${humaaansBase}/Humaaans/sitting-${i}.svg`,
    local: path.join(illustrationsDir, `humaaan-sitting-${i}.svg`)
  });
}

// Standing 1-24
for (let i = 1; i <= 24; i++) {
  allHumaaans.push({
    remote: `${humaaansBase}/Humaaans/standing-${i}.svg`,
    local: path.join(illustrationsDir, `humaaan-standing-${i}.svg`)
  });
}

// Single Pieces Scenes
allHumaaans.push(
  { remote: `${humaaansBase}/Single%20Pieces/Scene/Home.svg`, local: path.join(illustrationsDir, "scene-home.svg") },
  { remote: `${humaaansBase}/Single%20Pieces/Scene/Wireframe.svg`, local: path.join(illustrationsDir, "scene-wireframe.svg") }
);

// 2. Curated High-Res Professional Healthcare & Clinic Photography
const clinicalPhotos = [
  {
    url: "https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "doctor-tablet-rx.jpg")
  },
  {
    url: "https://images.pexels.com/photos/7088526/pexels-photo-7088526.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "doctor-desk-chamber.jpg")
  },
  {
    url: "https://images.pexels.com/photos/7579831/pexels-photo-7579831.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "front-desk-triage.jpg")
  },
  {
    url: "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "waiting-room-display.jpg")
  },
  {
    url: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "eod-settlement-ledger.jpg")
  },
  {
    url: "https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "doctor-patient-stethoscope.jpg")
  },
  {
    url: "https://images.pexels.com/photos/7089626/pexels-photo-7089626.jpeg?auto=compress&cs=tinysrgb&w=1200",
    dest: path.join(clinicalDir, "clinic-qr-standee.jpg")
  }
];

async function main() {
  console.log("=== DOWNLOADING COMPLETE HUMAAANS SVG REPOSITORY ===");
  let count = 0;
  for (const item of allHumaaans) {
    try {
      await downloadFile(item.remote, item.local);
      count++;
      process.stdout.write(`.`);
    } catch (err) {
      console.error(`\nFailed ${item.remote}:`, err.message);
    }
  }
  console.log(`\n✓ Downloaded ${count} Humaaans SVG assets!`);

  console.log("\n=== DOWNLOADING TARGETED CLINICAL PHOTOGRAPHY ===");
  for (const photo of clinicalPhotos) {
    try {
      await downloadFile(photo.url, photo.dest);
      console.log(`✓ Downloaded ${path.basename(photo.dest)} (${Math.round(fs.statSync(photo.dest).size / 1024)} KB)`);
    } catch (err) {
      console.error(`✗ Failed ${photo.url}:`, err.message);
    }
  }

  console.log("\n=== ASSET LIBRARY DOWNLOAD FINISHED ===");
}

main().catch(console.error);
