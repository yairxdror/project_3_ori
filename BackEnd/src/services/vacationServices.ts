import { runQuery } from "../dal/dal";
import { ValidationException, AppException } from "../models/exceptions";
import { StatusCode } from "../models/statusCode";

export interface VacationDto {
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

export interface VacationReportDto {
  destination: string;
  followersCount: number;
}

export interface AddVacationInput {
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  image: string;
}

export interface UpdateVacationInput {
  id: number;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  price: number;
  image?: string;
}

export type VacationsFilter = "all" | "following" | "upcoming" | "active";

export interface VacationsQueryOptions {
  page?: number;
  pageSize?: number;
  filter?: VacationsFilter;
}

function mapRowToVacationDto(row: any): VacationDto {
  return {
    id: row.id,
    destination: row.destination,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    price: Number(row.price),
    image: row.image,
    followersCount: Number(row.followersCount ?? 0),
    isFollowedByCurrentUser:
      typeof row.isFollowedByCurrentUser === "boolean"
        ? row.isFollowedByCurrentUser
        : undefined,
  };
}

function parseDate(value: string): Date {
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new ValidationException(`Invalid date: ${value}`);
  }
  return d;
}

function ensureNonEmptyText(value: any, fieldName: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationException(`${fieldName} is required`);
  }
}

function ensurePriceValid(price: number): void {
  if (price <= 0 || price > 10000) {
    throw new ValidationException(
      "Price must be greater than 0 and at most 10000"
    );
  }
}

function ensureDatesValidForCreate(startDate: string, endDate: string): void {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (end < start) {
    throw new ValidationException("End date cannot be earlier than start date");
  }

  if (start < today || end < today) {
    throw new ValidationException(
      "Past dates are not allowed for new vacations"
    );
  }
}

function ensureDatesValidForUpdate(startDate: string, endDate: string): void {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (end < start) {
    throw new ValidationException("End date cannot be earlier than start date");
  }
}

function escapeCsv(value: string): string {
  if (
    value.includes('"') ||
    value.includes(",") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// All holidays + number of followers
export async function getVacations(): Promise<VacationDto[]> {
  const q = `
    SELECT
      v.id,
      v.destination,
      v.description,
      v.start_date AS "startDate",
      v.end_date AS "endDate",
      v.price,
      v.image,
      COUNT(f.user_id) AS "followersCount"
    FROM vacations v
    LEFT JOIN followers f
      ON v.id = f.vacation_id
    GROUP BY v.id
    ORDER BY v.start_date;
  `;

  const rows = (await runQuery(q)) as any[];

  return rows.map(mapRowToVacationDto);
}

// All vacations + number of followers + whether the current user is following
export async function getVacationsForUser(
  userId: number,
  options: VacationsQueryOptions = {}
): Promise<{ vacations: VacationDto[]; totalCount: number }> {
  const pageRaw = options.page ?? 1;
  const pageSizeRaw = options.pageSize ?? 6;

  const page = pageRaw > 0 ? pageRaw : 1;
  const pageSize = pageSizeRaw > 0 ? pageSizeRaw : 6;

  const allowedFilters: VacationsFilter[] = ["all", "following", "upcoming", "active"];
  const filter: VacationsFilter =
    options.filter && allowedFilters.includes(options.filter)
      ? options.filter
      : "all";

  const offset = (page - 1) * pageSize;

  const whereParts: string[] = [];
  const params: any[] = [userId];

  if (filter === "following") {
    // Only vacations that the user is following
    whereParts.push(`
      EXISTS (
        SELECT 1
        FROM followers fx
        WHERE fx.vacation_id = v.id
          AND fx.user_id = $1
      )
    `);
  } else if (filter === "upcoming") {
    // Vacations that haven't started yet
    whereParts.push(`v.start_date > NOW()`);
  } else if (filter === "active") {
    // Vacations that are currently active
    whereParts.push(`v.start_date <= NOW() AND v.end_date >= NOW()`);
  }

  const whereClause =
    whereParts.length > 0 ? "WHERE " + whereParts.join(" AND ") : "";

  // Data query with LIMIT/OFFSET
  const dataQuery = `
    SELECT
      v.id,
      v.destination,
      v.description,
      v.start_date AS "startDate",
      v.end_date AS "endDate",
      v.price,
      v.image,
      COUNT(f.user_id) AS "followersCount",
      COUNT(*) FILTER (WHERE f.user_id = $1) > 0 AS "isFollowedByCurrentUser"
    FROM vacations v
    LEFT JOIN followers f
      ON v.id = f.vacation_id
    ${whereClause}
    GROUP BY v.id
    ORDER BY v.start_date
    LIMIT ${pageSize}
    OFFSET ${offset};
  `;

  const rows = (await runQuery(dataQuery, params)) as any[];
  const vacations = rows.map(mapRowToVacationDto);

  let countQuery: string;
  let countParams: any[];

  if (filter === "following") {
    // Only vacations that the user is following
    countQuery = `
      SELECT COUNT(DISTINCT v.id) AS cnt
      FROM vacations v
      JOIN followers f
        ON v.id = f.vacation_id
      WHERE f.user_id = $1;
    `;
    countParams = [userId];
  } else {
    countQuery = `
      SELECT COUNT(*) AS cnt
      FROM vacations v
      ${whereClause};
    `;
    countParams = [];
  }

  const countRows = (await runQuery(countQuery, countParams)) as any[];
  const totalCount = Number(countRows[0].cnt);

  return { vacations, totalCount };
}


// Single vacation by id, including followersCount, and if userId is provided — also isFollowedByCurrentUser
export async function getVacationById(
  vacationId: number,
  currentUserId?: number
): Promise<VacationDto | null> {
  let q: string;
  let params: any[];

  if (currentUserId != null) {
    q = `
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date AS "startDate",
        v.end_date AS "endDate",
        v.price,
        v.image,
        COUNT(f.user_id) AS "followersCount",
        COUNT(*) FILTER (WHERE f.user_id = $2) > 0 AS "isFollowedByCurrentUser"
      FROM vacations v
      LEFT JOIN followers f
        ON v.id = f.vacation_id
      WHERE v.id = $1
      GROUP BY v.id;
    `;
    params = [vacationId, currentUserId];
  } else {
    q = `
      SELECT
        v.id,
        v.destination,
        v.description,
        v.start_date AS "startDate",
        v.end_date AS "endDate",
        v.price,
        v.image,
        COUNT(f.user_id) AS "followersCount"
      FROM vacations v
      LEFT JOIN followers f
        ON v.id = f.vacation_id
      WHERE v.id = $1
      GROUP BY v.id;
    `;
    params = [vacationId];
  }

  const rows = (await runQuery(q, params)) as any[];
  if (!rows.length) return null;

  return mapRowToVacationDto(rows[0]);
}

//* For admin *//
export async function addVacation(data: AddVacationInput): Promise<VacationDto> {
  const { destination, description, startDate, endDate, price, image } = data;

  ensureNonEmptyText(destination, "Destination");
  ensureNonEmptyText(description, "Description");
  ensureNonEmptyText(image, "Image");
  ensurePriceValid(price);
  ensureDatesValidForCreate(startDate, endDate);

  const q = `
    INSERT INTO vacations (destination, description, start_date, end_date, price, image)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      destination,
      description,
      start_date AS "startDate",
      end_date AS "endDate",
      price,
      image;
  `;

  const rows = (await runQuery(q, [
    destination,
    description,
    startDate,
    endDate,
    price,
    image,
  ])) as any[];

  const row = rows[0];

  // New vacation — no followers yet
  return {
    id: row.id,
    destination: row.destination,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    price: Number(row.price),
    image: row.image,
    followersCount: 0,
    isFollowedByCurrentUser: false,
  };
}

export async function updateVacation(data: UpdateVacationInput): Promise<VacationDto> {
  const { id, destination, description, startDate, endDate, price, image } =
    data;

  ensureNonEmptyText(destination, "Destination");
  ensureNonEmptyText(description, "Description");
  ensurePriceValid(price);
  ensureDatesValidForUpdate(startDate, endDate);

  const values: any[] = [
    destination,
    description,
    startDate,
    endDate,
    price,
  ];

  let setClause = `
    destination = $1,
    description = $2,
    start_date = $3,
    end_date = $4,
    price = $5
  `;

  if (image) {
    values.push(image);
    setClause += `, image = $${values.length}`;
  }

  values.push(id);

  const q = `
    UPDATE vacations
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING
      id,
      destination,
      description,
      start_date AS "startDate",
      end_date AS "endDate",
      price,
      image;
  `;

  const rows = (await runQuery(q, values)) as any[];

  if (!rows.length) {
    throw new AppException("Vacation not found", StatusCode.NotFound);
  }

  const row = rows[0];

  return {
    id: row.id,
    destination: row.destination,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    price: Number(row.price),
    image: row.image,
    followersCount: 0,
  };
}

export async function deleteVacation(id: number): Promise<void> {
  const q = `DELETE FROM vacations WHERE id = $1;`;
  await runQuery(q, [id]);
}

//  Follow / Unfollow
export async function followVacation(
  userId: number,
  vacationId: number
): Promise<void> {
  await runQuery(
    `
      INSERT INTO followers (user_id, vacation_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, vacation_id) DO NOTHING;
    `,
    [userId, vacationId]
  );
}

export async function unfollowVacation(
  userId: number,
  vacationId: number
): Promise<void> {
  await runQuery(
    `
      DELETE FROM followers
      WHERE user_id = $1 AND vacation_id = $2;
    `,
    [userId, vacationId]
  );
}

// Reports for admin
export async function getVacationsReport(): Promise<VacationReportDto[]> {
  const q = `
    SELECT
      v.id,
      v.destination,
      COUNT(f.user_id) AS "followersCount"
    FROM vacations v
    LEFT JOIN followers f
      ON v.id = f.vacation_id
    GROUP BY v.id, v.destination
    ORDER BY v.destination;
  `;

  const rows = (await runQuery(q)) as any[];

  return rows.map((r) => ({
    destination: r.destination,
    followersCount: Number(r.followersCount ?? 0),
  }));
}

export async function generateCsvReport(): Promise<string> {
  const report = await getVacationsReport();

  let csv = "destination,followersCount\n";

  csv += report
    .map((r) => `${escapeCsv(r.destination)},${r.followersCount}`)
    .join("\n");

  return csv;
}