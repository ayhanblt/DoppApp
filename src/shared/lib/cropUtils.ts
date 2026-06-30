export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Her zaman 1080x1080 kare çıktı verir
  const TARGET_SIZE = 1080;
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  // Boşlukları (görselin dışına çıkıldığında) beyaz ile doldur
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Kırpma alanını 1080x1080 boyutuna ölçekle
  const scale = TARGET_SIZE / pixelCrop.width;

  ctx.scale(scale, scale);
  // Kırpma alanının (pixelCrop) sol üst köşesini canvas'ın (0,0) noktasına hizala
  ctx.translate(-pixelCrop.x, -pixelCrop.y);

  // Görseli orijinal koordinatında çiz
  ctx.drawImage(image, 0, 0);

  // Context'i eski haline getir (zorunlu değil ama temizlik için)
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas boş'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95 // Kalite %95
    );
  });
}
