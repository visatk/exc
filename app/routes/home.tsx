import { Link, useLoaderData } from "react-router";
import { getDb } from "../db";
import { exchanges, gateways, exchangePairs } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export async function loader({ context }: any) {
  const db = getDb(context.cloudflare.env);
  
  // Fetch latest completed exchanges
  const recentExchanges = await db.select()
    .from(exchanges)
    .where(eq(exchanges.status, 'confirmed'))
    .orderBy(desc(exchanges.updatedAt))
    .limit(10)
    .all();
    
  const allGateways = await db.select().from(gateways).all();
  
  const mappedExchanges = recentExchanges.map(ex => {
    // Need to fetch pair to get gateways
    return {
      ...ex,
      // In real scenario we join or fetch the pair info
    };
  });
  
  return { recentExchanges: mappedExchanges, gateways: allGateways };
}

export default function Home() {
  const { recentExchanges, gateways } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dollarvaly
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/exchange" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">Exchange</Link>
            <Link to="/rates" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">Rates</Link>
            <Link to="/affiliates" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">Affiliates</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium">Login</Link>
            <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
            Fast, Secure & Reliable <br />
            <span className="text-blue-600">Currency Exchange</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Exchange your BDT to USD, Crypto to Fiat, and more with the best rates in the market. Trusted by thousands.
          </p>
          <Link to="/exchange" className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-1 inline-block">
            Start Exchange Now
          </Link>
        </section>

        {/* Live Tracking / Features */}
        <section className="bg-white dark:bg-slate-900 py-16 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Lightning Fast</h3>
              <p className="text-slate-600 dark:text-slate-400">Exchanges are processed within 5-20 minutes during working hours.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center text-2xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bank-Grade Security</h3>
              <p className="text-slate-600 dark:text-slate-400">Your funds and data are protected with the highest security standards.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Best Rates</h3>
              <p className="text-slate-600 dark:text-slate-400">We constantly monitor the market to give you the most competitive rates.</p>
            </div>
          </div>
        </section>

        {/* Recent Exchanges */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">Recent Exchanges</h2>
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            {recentExchanges.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No recent exchanges to show.</p>
            ) : (
              <div className="space-y-4">
                {recentExchanges.map((ex: any) => (
                  <div key={ex.id} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xl">🔄</div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Exchange #{ex.id}</p>
                        <p className="text-xs text-slate-500">{new Date(ex.updatedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{ex.amountTo}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Dollarvaly</h3>
            <p className="text-sm">The most trusted currency exchange platform in Bangladesh and worldwide.</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/exchange" className="hover:text-white">Exchange</Link></li>
              <li><Link to="/rates" className="hover:text-white">Rates</Link></li>
              <li><Link to="/affiliates" className="hover:text-white">Affiliate Program</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Support</h3>
            <p className="text-sm">Working Hours: 9 AM - 11 PM GMT+6</p>
            <p className="text-sm mt-2">Email: support@dollarvaly.net</p>
          </div>
        </div>
        <p className="text-sm border-t border-slate-800 pt-8">&copy; 2026 Dollarvaly. All rights reserved.</p>
      </footer>
    </div>
  );
}
