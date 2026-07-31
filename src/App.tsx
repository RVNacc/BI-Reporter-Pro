/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import FileManagerView from './views/FileManagerView';
import SalesReportsView from './views/SalesReportsView';
import InventoryReportsView from './views/InventoryReportsView';
import FinanceReportsView from './views/FinanceReportsView';
import HrReportsView from './views/HrReportsView';
import CostAllocationView from './views/CostAllocationView';
import CostControlAnalysisView from './views/CostControlAnalysisView';
import ParetoReportsView from './views/ParetoReportsView';
import { WeeklyReportsView } from './views/WeeklyReportsView';
import ProfitLossReportsView from './views/ProfitLossReportsView';
import DiscountAnalysisView from './views/DiscountAnalysisView';
import ComprehensiveProfitLossView from './views/ComprehensiveProfitLossView';
import AdvancedManagementView from './views/AdvancedManagementView';
import BudgetManagementView from './views/BudgetManagementView';
import { Menu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'files':
        return <FileManagerView />;
      case 'discounts':
        return <DiscountAnalysisView />;
      case 'comprehensive-profit':
        return <ComprehensiveProfitLossView />;
      case 'sales':
        return <SalesReportsView />;
      case 'inventory':
        return <InventoryReportsView />;
      case 'finance':
        return <FinanceReportsView />;
      case 'cost-control':
        return <CostControlAnalysisView />;
      case 'hr':
        return <HrReportsView />;
      case 'abc':
        return <CostAllocationView />;
      case 'budget':
        return <BudgetManagementView />;
      case 'pareto':
        return <ParetoReportsView />;
      case 'weekly':
        return <WeeklyReportsView />;
      case 'profit':
        return <ProfitLossReportsView />;
      case 'advanced':
        return <AdvancedManagementView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex print:block min-h-screen bg-[#f8fafc] text-slate-800 print:bg-white print:h-auto overflow-x-hidden" dir="rtl">
      {/* Sidebar Container */}
      <div 
        className={`print:hidden h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 opacity-100 pointer-events-auto' : 'w-0 opacity-0 pointer-events-none'}`}
      >
         <Sidebar currentView={currentView} setCurrentView={setCurrentView} closeSidebar={() => setIsSidebarOpen(false)} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 min-h-screen overflow-x-hidden print:overflow-visible transition-all duration-300 relative">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="fixed top-4 right-4 z-[40] p-2 bg-white rounded-md shadow-md text-slate-700 hover:bg-slate-100 print:hidden transition-all duration-300"
          >
            <Menu size={24} />
          </button>
        )}
        <div className={`transition-all duration-300 ${!isSidebarOpen ? 'pt-14' : ''}`}>
          {renderView()}
        </div>
      </div>
    </div>
  );
}
