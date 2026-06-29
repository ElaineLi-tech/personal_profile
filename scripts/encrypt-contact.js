const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (!current.startsWith('--')) continue;
    const key = current.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function escapeJsString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  const mimeType = mimeMap[ext];
  if (!mimeType) {
    throw new Error(`Unsupported image type: ${ext}`);
  }
  return mimeType;
}

function toMaskedPhone(phone) {
  if (!/^\d{7,20}$/.test(phone)) {
    throw new Error('Phone must be 7-20 digits.');
  }
  if (phone.length < 8) {
    return `${phone.slice(0, 2)}****${phone.slice(-2)}`;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function encryptText(plaintext, secret) {
  return CryptoJS.AES.encrypt(plaintext, secret).toString();
}

function buildOutput(payload) {
  return `window.SECURE_CONTACT_DATA = {
  version: 1,
  algorithm: 'AES',
  hashParam: 'k',
  hint: '仅限持有专属访问链接的访客查看完整联系方式。',
  maskedPhone: '${escapeJsString(payload.maskedPhone)}',
  validatorCiphertext: '${escapeJsString(payload.validatorCiphertext)}',
  phoneCiphertext: '${escapeJsString(payload.phoneCiphertext)}',
  qrCiphertext: '${escapeJsString(payload.qrCiphertext)}'
};
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const imagePath = args.image ? path.resolve(args.image) : null;
  const phone = args.phone;
  const baseUrl = args['base-url'] || 'https://your-name.github.io/your-repo/';
  const outputPath = path.resolve(args.out || 'secure-contact-data.js');

  if (!imagePath || !phone) {
    console.error('Usage: npm run encrypt:contact -- --image /abs/path/qr.jpg --phone 13800138000 [--base-url https://example.com/] [--out secure-contact-data.js]');
    process.exit(1);
  }

  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = getMimeType(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;
  const secret = crypto.randomBytes(32).toString('hex');

  const payload = {
    maskedPhone: toMaskedPhone(phone),
    validatorCiphertext: encryptText('contact-access-granted', secret),
    phoneCiphertext: encryptText(phone, secret),
    qrCiphertext: encryptText(imageDataUrl, secret)
  };

  fs.writeFileSync(outputPath, buildOutput(payload), 'utf8');

  const hashKey = `k=${encodeURIComponent(secret)}`;
  const accessUrl = `${baseUrl.replace(/#.*$/, '')}#${hashKey}`;

  console.log(`Encrypted data written to: ${outputPath}`);
  console.log(`Masked phone stored in source: ${payload.maskedPhone}`);
  console.log('Exclusive access URL:');
  console.log(accessUrl);
  console.log('');
  console.log('Security note: keep the generated hash key private. It is not written to the repository.');
}

main();
