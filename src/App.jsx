import Sidebar from './components/Sidebar';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className="flex h-screen bg-[#1a1a1a]">
      {/* <Sidebar /> */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
