// this file is for testing src/lib/ai/analytics.ts. Just ignore this 

import { NextResponse } from "next/server";
import { fetchUserAnalytics } from "@/lib/ai/analytics";

export async function GET() {
  try {
    // Paste any real user_id from your DB here
    const analytics = await fetchUserAnalytics("USER_ID");
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}