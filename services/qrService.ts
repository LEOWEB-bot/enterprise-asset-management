import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string, size = 250): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR data url', err);
    return '';
  }
}

export function generateAssetQrPayload(
  assetCode: string,
  assetId: string,
  format: 'PUBLIC_URL' | 'CODE_ONLY' | 'JSON_PAYLOAD' = 'PUBLIC_URL'
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://asset.corp';
  if (format === 'PUBLIC_URL') {
    return `${origin}/asset-view/${assetId}`;
  } else if (format === 'CODE_ONLY') {
    return assetCode;
  } else {
    return JSON.stringify({
      code: assetCode,
      id: assetId,
      sys: 'AssetCorp-EAM',
      v: '1.0',
    });
  }
}

export function generateRfidHex(): string {
  const hexChars = '0123456789ABCDEF';
  let tag = 'E2801170';
  for (let i = 0; i < 16; i++) {
    tag += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return tag;
}

export function generateNfcUid(): string {
  const hexChars = '0123456789ABCDEF';
  let uid = 'NFC-';
  for (let i = 0; i < 8; i++) {
    uid += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    if (i === 3) uid += '-';
  }
  return uid;
}
