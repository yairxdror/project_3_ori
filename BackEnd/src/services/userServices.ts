import { runQuery } from "../dal/dal";
import jwt from "jsonwebtoken";
import { appConfig } from "../utils/config";
import { CredentialsModel, UserModel } from "../models/UserModel";
import { ValidationException, AuthException } from "../models/exceptions";

interface JwtUserPayload {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

// Map a DB row to `UserModel`
function mapRowToUserModel(row: any): UserModel {
  return new UserModel({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    password: row.password,
    is_admin: row.is_admin,
  } as UserModel);
}

// Create JWT for a user
function createToken(user: UserModel): string {
  const payload: JwtUserPayload = {
    id: user.id!,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    isAdmin: user.is_admin,
  };

  return jwt.sign(payload, appConfig.jwtSecret, { expiresIn: "7d" });
}

// Find a user by email
async function getUserByEmail(email: string): Promise<UserModel | null> {
  const q = `
    SELECT id, first_name, last_name, email, password, is_admin
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;

  const rows = (await runQuery(q, [email])) as any[];

  if (!rows.length) return null;

  return mapRowToUserModel(rows[0]);
}

// Check if an email is available
export async function isEmailFree(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return !user;
}

// Register a new user — returns a JWT
export async function registerUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<string> {
  const { firstName, lastName, email, password } = data;

  // Validations — all throw `ValidationException`
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    throw new ValidationException("All fields are required");
  }

  if (password.length < 5) {
    throw new ValidationException("Password must be at least 4 characters");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationException("Invalid email format");
  }

  const free = await isEmailFree(email);
  if (!free) {
    throw new ValidationException("Email is already in use");
  }

  const insertQuery = `
    INSERT INTO users (first_name, last_name, email, password, is_admin)
    VALUES ($1, $2, $3, $4, false)
    RETURNING id, first_name, last_name, email, password, is_admin;
  `;

  const rows = (await runQuery(insertQuery, [
    firstName,
    lastName,
    email,
    password,
  ])) as any[];

  const newUser = mapRowToUserModel(rows[0]);

  const token = createToken(newUser);
  return token;
}

// User login — returns a JWT
export async function login(credentials: CredentialsModel): Promise<string> {
  const { email, password } = credentials;

  // Validation — missing email/password
  if (!email || !password) {
    throw new ValidationException("Email and password are required");
  }

  const user = await getUserByEmail(email);
  if (!user) {
    // User does not exist
    throw new AuthException("Incorrect email or password");
  }

  if (user.password !== password) {
    // Password does not match
    throw new AuthException("Incorrect email or password");
  }

  const token = createToken(user);
  return token;
}