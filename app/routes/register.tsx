import { Form, useNavigation, redirect, Link, useActionData } from "react-router";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { sessionStorage } from "../lib/auth"; 
import { hashPassword as doHash } from "../lib/crypto";

import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export async function action({ request, context }: any) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  
  const result = registerSchema.safeParse({ name, email, password, phone });
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }
  
  const db = getDb(context.cloudflare.env);
  
  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) return { error: "Email already registered" };
  
  const hashedPassword = await doHash(password);
  
  // Create user
  await db.insert(users).values({
    name,
    email,
    phone,
    passwordHash: hashedPassword,
  });
  
  const newUser = await db.select().from(users).where(eq(users.email, email)).get();
  
  if (!newUser) return { error: "Failed to create account" };
  
  // Create session
  const session = await sessionStorage.getSession();
  session.set("userId", newUser.id);
  
  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export default function Register() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 my-10">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Create Account</h1>
          <p className="text-slate-500 mt-2">Join Dollarvaly today</p>
        </div>
        
        {actionData?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 border border-red-200 dark:border-red-800">
            {actionData.error}
          </div>
        )}
        
        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input type="text" name="name" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input type="email" name="email" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input type="tel" name="phone" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="+8801..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input type="password" name="password" required className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100" placeholder="Min 6 characters" />
          </div>
          
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {navigation.state === "submitting" ? "Creating Account..." : "Register"}
          </button>
        </Form>
        
        <div className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
