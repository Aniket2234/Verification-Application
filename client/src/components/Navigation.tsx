import { Link, useLocation } from 'wouter';
import { UserCheck, UserPlus, Users, Phone, Truck } from 'lucide-react';

const Navigation = () => {
  const [location] = useLocation();

  const navItems = [
    { path: '/verification', label: 'Verification', icon: UserCheck },
    { path: '/about', label: 'About Us', icon: Users },
    { path: '/contact', label: 'Contact', icon: Phone },
    { path: '/admin', label: 'Admin Dashboard', icon: Truck }
  ];

  return (
    <nav className="bg-white shadow-xl border-b-4 border-gradient-to-r from-blue-500 to-indigo-600 sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-4">
          <div className="mb-4 lg:mb-0 flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img
                src="/images/dblogo.png"
                alt="DB Skills Portal Logo"
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DB Skills Portal
                </h1>
                <p className="text-sm text-gray-600 font-medium">Professional Verification & Enrollment System</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:gap-3">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location === path || (path === '/verification' && location === '/');
              return (
                <Link
                  key={path}
                  href={path}
                  className={`flex items-center px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border border-gray-200 hover:border-blue-300'
                    }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  <span className="text-xs lg:text-sm font-medium whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;