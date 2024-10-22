// /app/page.tsx
"use client";

import React from "react";
import LandingPage from "./landing-page";

export default function Home() {
  // You can provide a default value or fetch it from an environment variable
  const basicPlanStripeLink = process.env.NEXT_PUBLIC_BASIC_PLAN_STRIPE_LINK || '';

  return <LandingPage basicPlanStripeLink={basicPlanStripeLink} />;
}
