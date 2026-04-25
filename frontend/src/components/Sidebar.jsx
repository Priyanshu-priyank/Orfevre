import React from 'react';
import { Home, Briefcase, Map, Target, User } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeView, setActiveView }) => {
  const links = [
    { id: 'jobconnect', name: 'JobConnect', icon: Target },
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'bazaarpulse', name: 'BazaarPulse', icon: Briefcase },
    { id: 'gramlens', name: 'GramLens', icon: Map },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full w-[240px] bg-[#151515] border-r border-[#2e2e2e] z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-[#2e2e2e]">
            <div className="flex items-center gap-2">
              <div className="bg-[#8b3dff] text-white p-1.5 rounded-md">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-white font-bold tracking-tight text-lg">GramSphere</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = activeView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveView(link.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                    ${isActive 
                      ? 'bg-[#2e2e2e] text-white font-semibold' 
                      : 'text-gray-400 font-medium hover:bg-[#2e2e2e] hover:text-white'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#8b3dff]' : 'text-gray-500'}`} />
                  {link.name}
                </button>
              );
            })}
          </nav>

          {/* Bottom Area */}
          <div className="p-4 border-t border-[#2e2e2e] m-4 rounded-xl bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8b3dff] flex items-center justify-center text-sm font-bold text-white shadow-sm">
                U
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">User Profile</span>
                <span className="text-xs font-medium text-gray-400">Youth Account</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
