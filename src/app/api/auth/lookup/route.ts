import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const search = parsed.data.name.trim().toLowerCase();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("email, display_name")
    .not("email", "is", null);

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const match = data.find(
    (p) => p.display_name?.trim().toLowerCase() === search,
  );

  if (!match?.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ email: match.email });
}
