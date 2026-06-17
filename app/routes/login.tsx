import { Form, useNavigation, redirect, Link, useActionData } from "react-router";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, sessionStorage } from "../lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function action({ request, context }: any) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }
  
  const db = getDb(context.cloudflare.env);
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  
  if (!user) return { error: "Invalid credentials" };
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return { error: "Invalid credentials" };
  
  // Create session
  const session = await sessionStorage.getSession();
  session.set("userId", user.id);
  
  return redirect(user.role === "admin" ? "/admin" : "/dashboard", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export default function Login() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to your Dollarvaly account</p>
        </div>
        
        {actionData?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-800">
            {actionData.error}
          </div>
        )}
        
        <Form method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input type="email" name="email" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            </div>
            <input type="password" name="password" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="••••••••" />
          </div>
          
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {navigation.state === "submitting" ? "Signing in..." : "Sign In"}
          </button>
        </Form>
        
        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-blue-600 font-medium hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
}
