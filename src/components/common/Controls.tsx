import React from 'react';
import type { ReactNode } from 'react';
import { PrimaryButton } from './PrimaryButton';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}

export const Toggle = ({ checked, onChange, label }: ToggleProps) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
            checked ? 'bg-forest-soft' : 'bg-[#e3e6e2]'
        }`}
    >
    <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
        }`}
    />
    </button>
);

interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    label: string;
}

export const SegmentedControl = <T extends string>({
                                                       options,
                                                       value,
                                                       onChange,
                                                       label,
                                                   }: SegmentedControlProps<T>) => (
    <div role="group" aria-label={label} className="flex shrink-0 gap-1 rounded-xl bg-paper p-1">
        {options.map((option) => {
            const selected = option.value === value;
            return (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(option.value)}
                    className={`min-w-16 rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                        selected ? 'bg-white text-forest-soft shadow-sm' : 'text-slate hover:text-ink'
                    }`}
                >
                    {option.label}
                </button>
            );
        })}
    </div>
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    label: string;
    active?: boolean;
}

export const IconButton = ({ icon, label, active = false, className = '', ...props }: IconButtonProps) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        {...props}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition ${
            active ? 'bg-sage text-forest-soft' : 'text-slate hover:bg-sage hover:text-forest-soft'
        } ${className}`}
    >
        <i className={icon} aria-hidden="true"></i>
    </button>
);

interface StatusPanelProps {
    variant: 'loading' | 'error';
    onRetry?: () => void;
}

export const StatusPanel = ({ variant, onRetry }: StatusPanelProps) => (
    <div role={variant === 'error' ? 'alert' : 'status'} className="ui-isolated flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-sm text-slate">
        {variant === 'loading' ? (
            <>
                <i className="fa-solid fa-circle-notch fa-spin text-lg text-forest-soft" aria-hidden="true"></i>
                <p>Đang tải...</p>
            </>
        ) : (
            <>
                <p>Không tải được dữ liệu. Vui lòng thử lại.</p>
                <PrimaryButton fullWidth={false} onClick={onRetry}>
                    Thử lại
                </PrimaryButton>
            </>
        )}
    </div>
);

interface FormFieldProps {
    id: string;
    label: string;
    hint?: string;
    error?: string;
    aside?: ReactNode;
    children: ReactNode;
}

export const FormField = ({ id, label, hint, error, aside, children }: FormFieldProps) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <label htmlFor={id} className="text-[13px] font-medium text-ink">
                {label}
            </label>
            {aside}
        </div>
        {children}
        {error ? (
            <p id={`${id}-message`} role="alert" className="text-xs text-danger">
                {error}
            </p>
        ) : (
            hint && (
                <p id={`${id}-message`} className="text-xs text-mist">
                    {hint}
                </p>
            )
        )}
    </div>
);