import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './src/index.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Parties from './pages/Parties';
import Products from './pages/Products';
import ExpiredProducts from './pages/ExpiredProducts';
import Settings from './pages/Settings';
import { InventoryProvider } from './src/context/InventoryContext';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize theme from local storage
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <InventoryProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="parties" element={<Parties />} />
            <Route path="products" element={<Products />} />
            <Route path="expired" element={<ExpiredProducts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </InventoryProvider>
  );
};

export default App;
