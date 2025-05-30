import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const message = await req.json();
    console.log("Log from client:", message.message);
    return NextResponse.json({ message: "Log received" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
