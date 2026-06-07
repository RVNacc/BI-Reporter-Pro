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
import ParetoReportsView from './views/ParetoReportsView';
import { WeeklyReportsView } from './views/WeeklyReportsView';
import ProfitLossReportsView from './views/ProfitLossReportsView';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'files':
        return <FileManagerView />;
      case 'sales':
        return <SalesReportsView />;
      case 'inventory':
        return <InventoryReportsView />;
      case 'finance':
        return <FinanceReportsView />;
      case 'hr':
        return <HrReportsView />;
      case 'abc':
        return <CostAllocationView />;
      case 'pareto':
        return <ParetoReportsView />;
      case 'weekly':
        return <WeeklyReportsView />;
      case 'profit':
        return <ProfitLossReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex print:block min-h-screen bg-[#f8fafc] text-slate-800 print:bg-white print:h-auto" dir="rtl">
      {/* Sidebar - fixed width */}
      <div className="print:hidden h-full flex-shrink-0">
         <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      
      {/* Main Content Area - with margin to offset sidebar */}
      <div className="flex-1 mr-64 print:mr-0 min-h-screen overflow-x-hidden print:overflow-visible">
        {renderView()}
      </div>
    </div>
  );
}
