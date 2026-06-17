import { useLoaderData, Form, useNavigation, redirect } from "react-router";
import { getDb } from "../../db";
import { gateways, exchangePairs, exchanges } from "../../db/schema";
import { eq } from "drizzle-orm";
import { useState, useEffect } from "react";
import { exchangeSessionStorage, getSession } from "../../lib/auth";

export async function loader({ request, context }: any) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await exchangeSessionStorage.getSession(cookieHeader);
  
  const pairId = session.get("pairId");
  const sendAmount = session.get("sendAmount");
  const receiveAmount = session.get("receiveAmount");
  const details = session.get("details");

  if (!pairId || !sendAmount || !receiveAmount || !details) {
    throw redirect("/exchange");
  }

  const db = getDb(context.cloudflare.env);
  const pair = await db.select().from(exchangePairs).where(eq(exchangePairs.id, pairId as string)).get();
  if (!pair) throw redirect("/exchange");

  const fromGateway = await db.select().from(gateways).where(eq(gateways.id, pair.fromGatewayId)).get();
  const toGateway = await db.select().from(gateways).where(eq(gateways.id, pair.toGatewayId)).get();

  // Admin dummy payment details based on fromGateway
  const adminPaymentDetails = `Our ${fromGateway?.name} Account: 018XXXXXXXX`;

  return { pair, sendAmount, receiveAmount, details, fromGateway, toGateway, adminPaymentDetails };
}

export async function action({ request, context }: any) {
  const cookieHeader = request.headers.get("Cookie");
  const exSession = await exchangeSessionStorage.getSession(cookieHeader);
  
  const pairId = exSession.get("pairId");
  const sendAmount = exSession.get("sendAmount");
  const receiveAmount = exSession.get("receiveAmount");
  const details = exSession.get("details");
  
  if (!pairId || !details) {
    return redirect("/exchange");
  }

  const formData = await request.formData();
  const userPaymentDetails = formData.get("userPaymentDetails");
  
  if (!userPaymentDetails) return { error: "Transaction ID is required" };

  const db = getDb(context.cloudflare.env);
  
  // Optionally attach user if logged in
  const userSession = await getSession(request);
  const userId = userSession.get("userId") || null;

  await db.insert(exchanges).values({
    userId,
    pairId: pairId as string,
    amountFrom: sendAmount as number,
    amountTo: receiveAmount as number,
    userDetails: details,
    txId: userPaymentDetails as string,
    status: "waiting for confirmation",
  });

  return redirect(`/dashboard/history`, {
    headers: {
      "Set-Cookie": await exchangeSessionStorage.destroySession(exSession),
    },
  });
}

export default function ExchangeStep3() {
  const { pair, sendAmount, receiveAmount, details, fromGateway, toGateway, adminPaymentDetails } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [timeLeft, setTimeLeft] = useState(20 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">✓</div>
            <span className="text-green-500 font-semibold">STEP 2</span>
          </div>
          <div className="w-16 h-px bg-green-500"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">3</div>
            <span className="text-green-500 font-semibold">STEP 3</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Form */}
        <Form method="post" encType="multipart/form-data" className="space-y-6">
          <input type="hidden" name="pairId" value={pair.id} />
          <input type="hidden" name="sendAmount" value={sendAmount} />
          <input type="hidden" name="receiveAmount" value={receiveAmount} />
          <input type="hidden" name="details" value={btoa(JSON.stringify(details))} />

          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Our Account Details</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Please make payment to our account and insert your payment details below.</p>
            <div className="bg-white dark:bg-slate-900 p-3 rounded font-mono text-center text-green-600 dark:text-green-400 font-bold border border-green-200 dark:border-green-800">
              {adminPaymentDetails}
            </div>
            <div className="text-center mt-2 flex items-center justify-center text-sm text-slate-500">
              <span className="animate-spin mr-2">⚙</span> waiting for payment
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Payment Details *</label>
            <textarea 
              name="userPaymentDetails" 
              required 
              rows={3}
              className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent" 
              placeholder="Enter your payment details (payment ID, sender details, etc)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Proof (Optional):</label>
            <input type="file" name="paymentProof" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>

          <div className="flex space-x-4">
            <button type="button" onClick={() => window.history.back()} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={navigation.state === "submitting" || timeLeft <= 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50"
            >
              {navigation.state === "submitting" ? "Confirming..." : "Confirm"}
            </button>
          </div>
        </Form>

        {/* Exchange Info */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b">Your Exchange</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-500 font-medium">↑ Amount Send</span>
                <span className="font-bold">{sendAmount} {fromGateway?.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500 font-medium">↓ Amount Receive</span>
                <span className="font-bold">{receiveAmount} {toGateway?.currency}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-500">Exchange Rate</span>
                <span>1 {pair.rate < 1 ? toGateway?.currency : fromGateway?.currency} = {pair.rate < 1 ? (1/pair.rate).toFixed(2) : pair.rate} {pair.rate < 1 ? fromGateway?.currency : toGateway?.currency}</span>
              </div>
              <div className="flex justify-between bg-slate-200 dark:bg-slate-700 p-2 rounded mt-4 font-bold text-lg">
                <span>Total for pay:</span>
                <span>{sendAmount} {fromGateway?.currency}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 dark:text-blue-400 mr-2">🔒</span>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">Secure Exchange</h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Exchange amount is reserved for 20 minutes. Please complete your exchange during this time.
            </p>
            <div className="text-center font-mono text-3xl font-bold text-slate-800 dark:text-slate-100">
              ⏱ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            {timeLeft <= 0 && (
              <div className="text-center text-red-500 mt-2 font-medium">Reservation expired!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
