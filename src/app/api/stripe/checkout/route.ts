import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";

type CheckoutPayload = {
  email?: string;
  userId?: string;
};

export async function POST(req: Request) {
  let payload: CheckoutPayload;
  try {
    payload = (await req.json()) as CheckoutPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  const userId = payload.userId?.trim();
  if (!email || !userId) {
    return NextResponse.json(
      { error: "Email and user id are required." },
      { status: 400 },
    );
  }

  const priceId = process.env.STRIPE_PRICE_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!priceId || !appUrl) {
    return NextResponse.json(
      { error: "Stripe price or app URL not configured." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancel`,
      customer_email: email,
      metadata: {
        userId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to start checkout." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stripe error." },
      { status: 500 },
    );
  }
}
