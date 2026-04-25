import React from 'react';
import { Menu, Globe } from 'lucide-react';

const Header = ({ onOpenSidebar }) => {
  return (
    <header className="h-16 border-b border-[#2e2e2e] bg-[#080808] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu */}
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#1a1a1a]"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Page Title (Mobile only) */}
        <span className="md:hidden text-white font-bold tracking-tight text-lg">GramSphere</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Toggle */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2e2e2e] bg-[#151515] text-gray-400 hover:text-white hover:bg-[#1a1a1a] cursor-pointer transition-colors text-sm font-semibold shadow-sm">
          <Globe className="w-4 h-4" />
          <span>English</span>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 md:gap-3 ml-2">
          <button className="text-sm font-semibold text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-[#1a1a1a]">
            Log in
          </button>
          <button className="text-sm font-semibold bg-[#8b3dff] text-white px-5 py-2 rounded-lg hover:bg-[#7b2cfa] transition-colors shadow-sm">
            Sign up
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
