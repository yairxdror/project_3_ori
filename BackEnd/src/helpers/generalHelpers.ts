import { openDb } from "../dal/dal";

export async function isDBup(): Promise<boolean> {
  try {
    await openDb();
    return true;
  } catch (error) {
    console.error("DB health check failed");
    console.error(error);
    return false;
  }
}