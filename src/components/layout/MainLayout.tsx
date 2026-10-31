import React from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#F4F4F0]">
            <Sidebar />

            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden flex">
                <Outlet />
            </main>
        </div>
    );
};