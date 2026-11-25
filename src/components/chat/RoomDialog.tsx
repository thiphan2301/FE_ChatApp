import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FormField, SegmentedControl } from '../common/Controls';
import { PrimaryButton } from '../common/PrimaryButton';
import { useClickOutside } from '../../hooks/useAsyncData';
import { fieldInputClass } from '../../utils/helpers';

type DialogMode = 'create' | 'join';

const ROOM_NAME_MAX_LENGTH = 50;
const GENERIC_ERROR = 'Có lỗi xảy ra. Vui lòng thử lại.';

const MODE_OPTIONS: { value: DialogMode; label: string }[] = [
    { value: 'create', label: 'Tạo phòng' },
    { value: 'join', label: 'Tham gia phòng' },
];

const MODE_HINTS: Record<DialogMode, string> = {
    create: 'Bạn sẽ là chủ phòng. Chia sẻ tên phòng để mọi người tham gia.',
    join: 'Nhập chính xác tên phòng mà bạn bè đã chia sẻ.',
};

interface RoomDialogProps {
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
    onJoin: (name: string) => Promise<void>;
}

export const RoomDialog = ({ onClose, onCreate, onJoin }: RoomDialogProps) => {
    const [mode, setMode] = useState<DialogMode>('create');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    useClickOutside(dialogRef, onClose, true);

    const trimmedName = name.trim();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!trimmedName || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await (mode === 'create' ? onCreate(trimmedName) : onJoin(trimmedName));
            onClose();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : GENERIC_ERROR);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="room-dialog-title"
                className="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <h2 id="room-dialog-title" className="text-lg font-semibold text-ink">
                        Phòng chat
                    </h2>
                    <button type="button" onClick={onClose} aria-label="Đóng" className="text-slate hover:text-ink">
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="mt-4">
                    <SegmentedControl
                        label="Chọn thao tác"
                        options={MODE_OPTIONS}
                        value={mode}
                        onChange={(next) => {
                            setMode(next);
                            setError(null);
                        }}
                    />
                </div>

                <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
                    <FormField id="room-name" label="Tên phòng" hint={MODE_HINTS[mode]} error={error ?? undefined}>
                        <input
                            id="room-name"
                            value={name}
                            maxLength={ROOM_NAME_MAX_LENGTH}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                            autoComplete="off"
                            aria-invalid={Boolean(error)}
                            aria-describedby="room-name-message"
                            className={fieldInputClass(Boolean(error))}
                        />
                    </FormField>
                    <PrimaryButton type="submit" disabled={!trimmedName || submitting} className="disabled:opacity-50">
                        {submitting ? 'Đang xử lý...' : mode === 'create' ? 'Tạo phòng' : 'Tham gia'}
                    </PrimaryButton>
                </form>
            </div>
        </div>
    );
};