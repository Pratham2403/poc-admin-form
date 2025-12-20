import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  showPageInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

/**
 * Generates an array of page numbers to display in pagination
 * Shows first page, last page, current page, and neighbors with ellipsis for gaps
 */
const generatePageNumbers = (
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] => {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    // Show all pages if total is 7 or less
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  // Calculate range around current page
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

  for (let i = rangeStart; i <= rangeEnd; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  showPageInfo = true,
  totalItems,
  itemsPerPage,
  className,
}) => {
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  // Calculate item range for display
  const itemRangeInfo = useMemo(() => {
    if (totalItems !== undefined && itemsPerPage !== undefined) {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      return { start, end, total: totalItems };
    }
    return null;
  }, [currentPage, totalItems, itemsPerPage]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-4 mt-auto",
        className
      )}
    >
      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          {itemRangeInfo ? (
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {itemRangeInfo.start}
              </span>
              {" - "}
              <span className="font-medium text-foreground">
                {itemRangeInfo.end}
              </span>
              {" of "}
              <span className="font-medium text-foreground">
                {itemRangeInfo.total}
              </span>
              {" items"}
            </span>
          ) : (
            <span>
              Page{" "}
              <span className="font-medium text-foreground">{currentPage}</span>
              {" of "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </span>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <nav
        className="flex items-center gap-1 order-1 sm:order-2"
        aria-label="Pagination"
      >
        {/* Previous Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1 || disabled}
          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center h-9 w-9 text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePageClick(page)}
                disabled={disabled}
                className={cn(
                  "h-9 w-9 p-0 font-medium transition-all duration-200",
                  currentPage === page
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                    : "hover:bg-primary/10 hover:text-primary"
                )}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages || disabled}
          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200"
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
};
