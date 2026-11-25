const MAX_UPLOAD_DIMENSION = 1600;
const JPEG_UPLOAD_QUALITY = 0.85;
const COMPRESS_THRESHOLD_BYTES = 800 * 1024;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

export const IMAGE_ACCEPT_TYPES = IMAGE_ACCEPT;
export const IMAGE_MAX_SIZE_LABEL = '10 MB';

const prepareImageBlob = async (file: File): Promise<{ blob: Blob; fileName: string }> => {
    if (file.type === 'image/gif' || file.size <= COMPRESS_THRESHOLD_BYTES) {
        return { blob: file, fileName: file.name || 'image.jpg' };
    }

    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return { blob: file, fileName: file.name || 'image.jpg' };

        ctx.drawImage(bitmap, 0, 0, width, height);
        const compressed = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', JPEG_UPLOAD_QUALITY),
        );
        if (!compressed) return { blob: file, fileName: file.name || 'image.jpg' };

        const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
        return { blob: compressed, fileName: `${baseName}.jpg` };
    } finally {
        bitmap.close();
    }
};

const uploadToCloudinary = async (blob: Blob, fileName: string, cloudName: string, preset: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('upload_preset', preset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Không thể tải ảnh lên Cloudinary.');
    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) throw new Error('Phản hồi từ Cloudinary không hợp lệ.');
    return data.secure_url;
};

const uploadToImgBb = async (blob: Blob, fileName: string, apiKey: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', blob, fileName);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Không thể tải ảnh lên ImgBB.');
    const data = (await response.json()) as { data?: { url?: string; display_url?: string } };
    const url = data.data?.url || data.data?.display_url;
    if (!url) throw new Error('Phản hồi từ ImgBB không hợp lệ.');
    return url;
};

const uploadToDevProxy = async (blob: Blob, fileName: string): Promise<string> => {
    const formData = new FormData();
    formData.append('files[]', blob, fileName);

    const response = await fetch('/__upload-uguu', {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) throw new Error('Không thể tải ảnh lên máy chủ lưu trữ.');
    const data = (await response.json()) as { success?: boolean; files?: { url?: string }[] };
    const url = data.files?.[0]?.url;
    if (!data.success || !url) throw new Error('Không nhận được đường dẫn ảnh.');
    return url;
};

export const uploadImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
        throw new Error('Vui lòng chọn tệp hình ảnh hợp lệ.');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Ảnh quá lớn. Giới hạn tối đa ${IMAGE_MAX_SIZE_LABEL}.`);
    }

    const { blob, fileName } = await prepareImageBlob(file);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim();
    if (cloudName && uploadPreset) {
        return uploadToCloudinary(blob, fileName, cloudName, uploadPreset);
    }

    const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY?.trim();
    if (imgbbKey) {
        return uploadToImgBb(blob, fileName, imgbbKey);
    }

    if (import.meta.env.DEV) {
        return uploadToDevProxy(blob, fileName);
    }

    throw new Error('Chưa cấu hình dịch vụ tải ảnh (VITE_IMGBB_API_KEY hoặc VITE_CLOUDINARY_*).');
};

export const extractClipboardImage = (items: DataTransferItemList | undefined): File | null => {
    if (!items) return null;
    for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            return item.getAsFile();
        }
    }
    return null;
};
