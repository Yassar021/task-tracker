"use client";

import { Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-700 dark:text-gray-300 border-t border-gray-200/50 dark:border-gray-700/50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              © {currentYear} SMP YPS SINGKOLE. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monitoring System v1.0
            </p>
          </div>

          {/* Branding */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-red-500 dark:text-red-400 animate-pulse" />
            <span>for education</span>
          </div>
        </div>
      </div>
    </footer>
  );
}