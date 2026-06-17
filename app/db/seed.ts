import { eq } from "drizzle-orm";
import { users, gateways, exchangePairs } from "./schema";
import { hashPassword } from "../lib/crypto";

export async function seedDb(db: any) {
  // Check if admin exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@dollarvaly.net")).get();
  
  if (!existingAdmin) {
    const adminHash = await hashPassword("admin123");
    await db.insert(users).values({
      name: "Admin",
      email: "admin@dollarvaly.net",
      passwordHash: adminHash,
      role: "admin",
      balance: 1000,
    });
  }

  // Seed gateways
  const existingGateways = await db.select().from(gateways).all();
  if (existingGateways.length === 0) {
    const defaultGateways = [
      { name: "B-kash", type: "fiat", currency: "BDT" },
      { name: "BKash-Personal", type: "fiat", currency: "BDT" },
      { name: "Nagad", type: "fiat", currency: "BDT" },
      { name: "Nagad-Personal", type: "fiat", currency: "BDT" },
      { name: "USDT TRC20", type: "crypto", currency: "USD" },
      { name: "USDT BEP20", type: "crypto", currency: "USD" },
    ];
    
    await db.insert(gateways).values(defaultGateways);
  }
  
  console.log("Database seeded successfully!");
}
  if (existingGateways.length === 0) {
    const defaultGateways = [
      { name: "B-kash", type: "fiat", currency: "BDT" },
      { name: "BKash-Personal", type: "fiat", currency: "BDT" },
      { name: "Nagad", type: "fiat", currency: "BDT" },
      { name: "Nagad-Personal", type: "fiat", currency: "BDT" },
      { name: "USDT TRC20", type: "crypto", currency: "USD" },
      { name: "USDT BEP20", type: "crypto", currency: "USD" },
    ];
    
    await db.insert(gateways).values(defaultGateways);
  }
  
  console.log("Database seeded successfully!");
}
