import React from "react";
import "./Pagination.css";
import Button from "../Button/Button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = "",
}) => {
    if (totalPages <= 1) return null;

    const wrapperClasses = ["pagination", className]
        .filter(Boolean)
        .join(" ");

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p++) {
        pages.push(p);
    }

    return (
        <div className={wrapperClasses}>
            <Button
                type="button"
                variant="secondary"
                onClick={handlePrev}
                disabled={currentPage <= 1}
                className="pagination__button"
            >
                Previous
            </Button>

            <div className="pagination__pages">
                {pages.map((page) => (
                    <Button
                        key={page}
                        type="button"
                        variant={page === currentPage ? "primary" : "ghost"}
                        onClick={() => onPageChange(page)}
                        className="pagination__page"
                    >
                        {page}
                    </Button>
                ))}
            </div>

            <Button
                type="button"
                variant="secondary"
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="pagination__button"
            >
                Next
            </Button>
        </div>
    );
};

export default Pagination;