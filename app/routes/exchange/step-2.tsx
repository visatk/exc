import { useLoaderData, Form, useNavigation, redirect, useNavigate } from "react-router";
import { getDb } from "../../db";
import { gateways, exchangePairs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { exchangeSessionStorage } from "../../lib/auth";

export async function loader({ request, context }: any) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await exchangeSessionStorage.getSession(cookieHeader);
  
  const pairId = session.get("pairId");
  const sendAmount = session.get("sendAmount");
  const receiveAmount = session.get("receiveAmount");

  if (!pairId || !sendAmount || !receiveAmount) {
    throw redirect("/exchange");
  }

  const db = getDb(context.cloudflare.env);
  const pair = await db.select().from(exchangePairs).where(eq(exchangePairs.id, pairId)).get();
  if (!pair) throw redirect("/exchange");

  const fromGateway = await db.select().from(gateways).where(eq(gateways.id, pair.fromGatewayId)).get();
  const toGateway = await db.select().from(gateways).where(eq(gateways.id, pair.toGatewayId)).get();

  return { pair, sendAmount, receiveAmount, fromGateway, toGateway };
}

export async function action({ request, context }: any) {
  const formData = await request.formData();
  
  const details = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    destAccount: formData.get("destAccount"),
  };
  
  const cookieHeader = request.headers.get("Cookie");
  const session = await exchangeSessionStorage.getSession(cookieHeader);
  
  session.set("details", details);

  return redirect(`/exchange/step-3`, {
    headers: {
      "Set-Cookie": await exchangeSessionStorage.commitSession(session),
    },
  });
}

export default function ExchangeStep2() {
  const { pair, sendAmount, receiveAmount, fromGateway, toGateway } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Exchange {fromGateway?.name} to {toGateway?.name}
        </h1>
        <div className="flex justify-center items-center mt-4 space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
            <span className="text-green-500 font-semibold">STEP 1</span>
          </div>
          <div className="w-16 h-px bg-green-500"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">2</div>
            <span className="text-green-500 font-semibold">STEP 2</span>
          </div>
          <div className="w-16 h-px bg-slate-300 dark:bg-slate-700"></div>
          <div className="flex items-center space-x-2 opacity-50">
            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">3</div>
            <span>STEP 3</span>
          </div>
        </div>
      </div>

      <Form method="post" className="space-y-6 max-w-lg mx-auto">
        <input type="hidden" name="pairId" value={pair.id} />
        <input type="hidden" name="sendAmount" value={sendAmount} />
        <input type="hidden" name="receiveAmount" value={receiveAmount} />

        <div className="text-center mb-6 border-b pb-4">
          <h2 className="text-lg font-semibold text-slate-700">Your Details</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name *</label>
            <input type="text" name="name" required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Email *</label>
            <input type="email" name="email" required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Phone Number *</label>
            <input type="tel" name="phone" required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder="+8801..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your {toGateway?.name} Number/Address *</label>
            <input type="text" name="destAccount" required className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" placeholder={`Enter your ${toGateway?.name} details`} />
          </div>
          
          <div className="flex items-start mt-4">
            <input type="checkbox" required className="mt-1 mr-2" id="terms" />
            <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">I agree with the Terms and Conditions</label>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => window.history.back()} className="px-6 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">{"< Go Back"}</button>
          <button 
            type="submit" 
            disabled={navigation.state === "submitting"}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {navigation.state === "submitting" ? "Processing..." : "Next Step >"}
          </button>
        </div>
      </Form>
    </div>
  );
}
