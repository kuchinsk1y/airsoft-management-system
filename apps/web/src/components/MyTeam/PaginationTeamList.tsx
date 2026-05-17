import { PaginationTeamListProps } from "@/interfaces";
import { ChevronLeft, ChevronRight } from "lucide-react";



export default function PaginationTeamList ({ currentPage, totalPages, onPageChange, className }: PaginationTeamListProps) {

  const getPages = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-2 font-inter ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-8 h-8 min991:w-10 min991:h-10 border border-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="text-white" size={20} />
      </button>

      <div className="flex items-center gap-1 min991:gap-2">
        {getPages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`flex items-center justify-center w-8 h-8 min991:w-10 min991:h-10 border text-xs min991:text-sm transition-colors ${
              page === currentPage
                ? 'bg-orange-500 border-orange-500 text-white'
                : page === '...'
                ? 'border-transparent text-white cursor-default'
                : 'border-white text-white hover:bg-white/10'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <span className="text-white text-xs min991:text-sm mx-1 min991:mx-2">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-8 h-8 min991:w-10 min991:h-10 border border-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="text-white" size={20} />
      </button>
    </div>
  );
};
