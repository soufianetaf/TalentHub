// src/components/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from './Icons';

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
          } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
          } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
          }
        }
        
        return pages;
      };

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'} transition-colors`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            
            {getPageNumbers().map((page, idx) => (
                page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">...</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            currentPage === page 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110' 
                            : 'bg-white text-gray-700 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-200'
                        }`}
                    >
                        {page}
                    </button>
                )
            ))}
            
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'} transition-colors`}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Pagination;