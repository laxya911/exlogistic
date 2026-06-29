import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  // If there's only 1 page, don't render pagination
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end bounds
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust bounds if we're near the edges
    if (currentPage <= 2) {
      end = Math.min(totalPages - 1, 3);
    }
    if (currentPage >= totalPages - 1) {
      start = Math.max(2, totalPages - 2);
    }

    // Add ellipsis if gap after first page
    if (start > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if gap before last page
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-t border-white/5", className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer ml-3"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-white/50 font-mono">
            Page <span className="font-bold text-white/80">{currentPage}</span> of <span className="font-bold text-white/80">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-[#0a0a0a] text-sm font-medium text-white/50 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            
            {pages.map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 border border-white/10 bg-[#0a0a0a] text-sm font-medium text-white/50 border-none">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium border-none cursor-pointer transition-colors",
                    currentPage === page 
                      ? "z-10 bg-blue-500/20 text-blue-400 border-blue-500/30" 
                      : "bg-[#0a0a0a] text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-[#0a0a0a] text-sm font-medium text-white/50 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
