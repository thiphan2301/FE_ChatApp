import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
                                                         children,
                                                         fullWidth = true,
                                                         className = '',
                                                         ...props
                                                     }) => {
    return (
        <button
            {...props}
            className={`bg-[#2D5A4C] hover:bg-[#23473c] text-white font-medium py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer ${
                fullWidth ? 'w-full' : ''
            } ${className}`}
        >
            {children}
        </button>
    );
};