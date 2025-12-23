import React from "react";
import type { Vacation } from "../../../types/models";
import "./VacationsList.css";
import VacationCard from "../VacationCard/VacationCard";

interface VacationsListProps {
  vacations: Vacation[];
  isAdmin: boolean;
  isLoading?: boolean;
  error?: string | null;

  onFollow?: (id: number) => void;
  onUnfollow?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const VacationsList: React.FC<VacationsListProps> = ({
  vacations,
  isAdmin,
  isLoading = false,
  error,
  onFollow,
  onUnfollow,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="vacations-list__loading">
        Loading vacations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="vacations-list__error">
        Error: {error}
      </div>
    );
  }

  if (!vacations.length) {
    return (
      <div className="vacations-list__empty">
        No vacations to display.
      </div>
    );
  }

  return (
    <div className="vacations-list">
      {vacations.map((vacation) => (
        <VacationCard
          key={vacation.id}
          vacation={vacation}
          isAdmin={isAdmin}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default VacationsList;