import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import MainContent from "../components/CategoriesList";
import CategoryPage from "./CategoryPage";
import { Outlet } from 'react-router-dom';

export default function Dashboard() {
    const [showAddItemForm, setShowAddItemForm] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-[#070D19] text-white font-sans md:ml-[260px]">
            <Sidebar
                onCategoryAdded={() => {}}
                setItems={() => {}}
            />
            <main className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-300 ease-in-out px-4 py-8 md:p-10 ${isMobile ? 'pt-24' : ''}`}>
                {showAddItemForm ? (
                    <CategoryPage />
                ) : (
                    <>
                        <MainContent />
                        <div className="fixed bottom-6 right-6 z-40">
                            <Outlet />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}