export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

export type VacationsFilter = "all" | "following" | "upcoming" | "active";

export interface Vacation {
  id: number;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  image: string;
  followersCount: number;
  isFollowedByCurrentUser?: boolean;
}

export interface PaginatedVacationsResponse {
  vacations: Vacation[];
  totalCount: number;
}

export interface VacationReportItem {
  destination: string;
  followersCount: number;
}
