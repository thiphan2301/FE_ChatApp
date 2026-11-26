import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useAsyncData';

interface ImagePreviewModalProps {
    imageUrl: string;
    caption?: string;
    onClose: () => void;
}

export const ImagePreviewModal = ({ imageUrl, caption, onClose }: ImagePreviewModalProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    useClickOutside(contentRef, onClose, true);

    return (
        <div className="ui-isolated fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div ref={contentRef} role="dialog" aria-modal="true" aria-label="Xem hình ảnh" className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3">
                <div className="flex w-full items-center justify-end gap-2">
                    <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download="hinh-anh.jpg"
                        aria-label="Tải hình ảnh"
                        title="Tải xuống"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                        <i className="fa-solid fa-download text-sm" aria-hidden="true"></i>
                    </a>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng xem ảnh"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    >
                        <i className="fa-solid fa-xmark text-sm" aria-hidden="true"></i>
                    </button>
                </div>
                <img
                    src={imageUrl}
                    alt={caption || 'Hình ảnh xem trước'}
                    className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
                />
                {caption && (
                    <p className="max-w-lg text-center text-sm text-white/90">{caption}</p>
                )}
            </div>
        </div>
    );
};

interface ImageDraftBannerProps {
    imageUrl: string;
    onRemove: () => void;
}

export const ImageDraftBanner = ({ imageUrl, onRemove }: ImageDraftBannerProps) => (
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-paper px-3 py-2">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
            <img src={imageUrl} alt="Ảnh sắp gửi" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink">Ảnh đính kèm</p>
        </div>
        <button
            type="button"
            onClick={onRemove}
            aria-label="Bỏ ảnh đính kèm"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate transition hover:bg-white hover:text-ink"
        >
            <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
        </button>
    </div>
);
