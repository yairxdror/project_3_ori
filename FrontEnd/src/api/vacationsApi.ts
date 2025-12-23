import type {
  PaginatedVacationsResponse,
  Vacation,
  VacationReportItem,
  VacationsFilter,
} from "../types/models";
import { httpClient } from "./httpClient";

// GET /api/vacations
export interface GetVacationsParams {
  page?: number;
  pageSize?: number;
  filter?: VacationsFilter;
}

// GET /api/vacations?page
export async function getVacations(
  params: GetVacationsParams = {}
): Promise<PaginatedVacationsResponse> {
  const res = await httpClient.get<PaginatedVacationsResponse>("/vacations", {
    params,
  });
  return res.data;
}

// GET /api/vacations/:id
export async function getVacationById(id: number): Promise<Vacation> {
  const res = await httpClient.get<Vacation>(`/vacations/${id}`);
  return res.data;
}

// Create or edit form
export interface SaveVacationPayload {
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  imageFile?: File | null;
}

// POST /api/vacations – Create a new Vacation - Admin
export async function createVacation(
  data: SaveVacationPayload
): Promise<Vacation> {
  const formData = new FormData();
  formData.append("destination", data.destination);
  formData.append("description", data.description);
  formData.append("startDate", data.startDate);
  formData.append("endDate", data.endDate);
  formData.append("price", String(data.price));

  if (!data.imageFile) {
    throw new Error("Image file is required for creating vacation");
  }

  formData.append("image", data.imageFile);

  const res = await httpClient.post<Vacation>("/vacations", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

// PUT /api/vacations/:id – Vacation Update - Admin
export async function updateVacation(
  id: number,
  data: SaveVacationPayload
): Promise<Vacation> {
  const formData = new FormData();
  formData.append("destination", data.destination);
  formData.append("description", data.description);
  formData.append("startDate", data.startDate);
  formData.append("endDate", data.endDate);
  formData.append("price", String(data.price));

  if (data.imageFile) {
    formData.append("image", data.imageFile);
  }

  const res = await httpClient.put<Vacation>(`/vacations/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

// DELETE /api/vacations/:id – Delete vacation - Admin
export async function deleteVacation(id: number): Promise<void> {
  await httpClient.delete(`/vacations/${id}`);
}

// POST /api/vacations/:id/follow – Follow a vacation
export async function followVacation(id: number): Promise<void> {
  await httpClient.post(`/vacations/${id}/follow`);
}

// DELETE /api/vacations/:id/follow – Unfollow a vacation
export async function unfollowVacation(id: number): Promise<void> {
  await httpClient.delete(`/vacations/${id}/follow`);
}

// GET /api/vacations/report – Graph - Admin
export async function getVacationsReport(): Promise<VacationReportItem[]> {
  const res = await httpClient.get<VacationReportItem[]>("/vacations/report");
  return res.data;
}

// GET /api/vacations/report/csv – Download CSV report (admin)
export async function downloadVacationsCsv(): Promise<void> {
  const res = await httpClient.get<Blob>("/vacations/report/csv", {
    responseType: "blob",
  });

  const blob = new Blob([res.data], {
    type: "text/csv;charset=utf-8",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "vacations-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}