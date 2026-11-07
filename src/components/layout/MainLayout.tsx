import React from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen w-full gap-[16px] overflow-hidden bg-cream p-[20px]">
            <Sidebar />

            <main className="flex h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-[28px] bg-paper">
                <Outlet />
            </main>
        </div>
    );
};