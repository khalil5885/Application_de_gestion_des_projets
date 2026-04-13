/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <Sidebar />
      <TopBar />
      <Dashboard />
    </div>
  );
}

