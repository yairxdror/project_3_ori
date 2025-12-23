import React from "react";
import "./VacationCard.css";
import type { Vacation } from "../../../types/models";
import { appConfig } from "../../../config/appConfig";
import Button from "../../common/Button/Button";

interface VacationCardProps {
  vacation: Vacation;
  isAdmin: boolean;
  onFollow?: (id: number) => void;
  onUnfollow?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  isAdmin,
  onFollow,
  onUnfollow,
  onEdit,
  onDelete,
}) => {
  const {
    id,
    destination,
    description,
    startDate,
    endDate,
    price,
    image,
    followersCount,
    isFollowedByCurrentUser,
  } = vacation;

  const imageSrc = image.startsWith("http")
    ? image
    : `${appConfig.imagesBaseUrl}/${image}`;

  const handleFollowClick = () => {
    if (isFollowedByCurrentUser) {
      onUnfollow?.(id);
    } else {
      onFollow?.(id);
    }
  };

  const handleEditClick = () => {
    onEdit?.(id);
  };

  const handleDeleteClick = () => {
    onDelete?.(id);
  };

  return (
    <div className="vacation-card">
      <div className="vacation-card__image-wrapper">
        <img
          src={imageSrc}
          alt={destination}
          className="vacation-card__image"
        />
      </div>

      <div className="vacation-card__content">
        <h3 className="vacation-card__title">{destination}</h3>

        <p className="vacation-card__description">{description}</p>

        <div className="vacation-card__footer">
          <div className="vacation-card__dates">
            <span>
              {new Date(startDate).toLocaleDateString()} –{" "}
              {new Date(endDate).toLocaleDateString()}
            </span>
          </div>

          <div className="vacation-card__meta">
            <span className="vacation-card__price">${price.toFixed(2)}</span>
            <span className="vacation-card__followers">Followers: {followersCount}</span>
          </div>

          <div className="vacation-card__actions">
            {!isAdmin && (
              <Button
                variant={isFollowedByCurrentUser ? "secondary" : "primary"}
                onClick={handleFollowClick}
                className="vacation-card__action"
              >
                {isFollowedByCurrentUser ? "Unfollow" : "Follow"}
              </Button>
            )}

            {isAdmin && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleEditClick}
                  className="vacation-card__action"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteClick}
                  className="vacation-card__action"
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationCard;