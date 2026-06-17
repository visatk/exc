import { createCookieSessionStorage, redirect } from "react-router";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const sessionSecret = "super-secret-dollarvaly-key-change-me";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

export const exchangeSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__exchange_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/exchange",
    httpOnly: true,
    maxAge: 3600, // 1 hour max for completing an exchange
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function requireAuth(request: Request, env: Env) {
  const session = await getSession(request);
  const userId = session.get("userId");
  if (!userId) {
    throw redirect("/login");
  }
  
  const db = getDb(env);
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  
  if (!user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function requireAdmin(request: Request, env: Env) {
  const user = await requireAuth(request, env);
  if (user.role !== "admin") {
    throw redirect("/");
  }
  return user;
}
