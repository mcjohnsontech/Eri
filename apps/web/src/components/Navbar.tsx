import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, ListTodo, FileText, Activity } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Eri</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink to="/dashboard" className={({isActive}) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-primary-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}>
                <LayoutDashboard className="mr-2 w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink to="/review-queue" className={({isActive}) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-primary-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}>
                <ListTodo className="mr-2 w-4 h-4" /> Review Queue
              </NavLink>
              <NavLink to="/policies" className={({isActive}) => `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive ? 'border-primary-500 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300'}`}>
                <FileText className="mr-2 w-4 h-4" /> Policies
              </NavLink>
            </div>
          </div>
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-success-500 mr-2" />
            <span className="text-sm text-gray-500 dark:text-gray-400">System Active</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
