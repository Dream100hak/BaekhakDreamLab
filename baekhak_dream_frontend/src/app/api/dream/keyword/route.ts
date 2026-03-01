/**
 * dream_keywords 단일 수정 API
 * PATCH /api/dream/keyword
 * body: { word, sense, newWord, newSense }
 */

import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, sense, newWord, newSense } = body as {
      word?: string;
      sense?: string;
      newWord?: string;
      newSense?: string;
    };

    if (typeof word !== "string" || !word.trim()) {
      return NextResponse.json(
        { error: "word 필수" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const senseVal = sense ?? "";

    const { data: rows, error: findError } = await supabase
      .from("dream_keywords")
      .select("id")
      .eq("word", word.trim())
      .eq("sense", senseVal)
      .limit(1);

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!rows?.length) {
      return NextResponse.json(
        { error: "해당 키워드를 찾을 수 없습니다 (DB에 없음)" },
        { status: 404 }
      );
    }

    const updates: { word?: string; sense?: string | null } = {};
    if (newWord !== undefined) {
      const v = String(newWord).trim();
      if (!v) {
        return NextResponse.json({ error: "word는 비울 수 없습니다" }, { status: 400 });
      }
      updates.word = v;
    }
    if (newSense !== undefined) updates.sense = newSense === "" ? null : String(newSense).trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "변경 없음" });
    }

    const rowId = (rows[0] as { id: string }).id;
    const { error: updateError } = await (
      supabase.from("dream_keywords") as unknown as {
        update: (u: { word?: string; sense?: string | null }) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .update(updates)
      .eq("id", rowId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "수정 완료",
    });
  } catch (err) {
    console.error("[dream/keyword] PATCH Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "수정 중 오류" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { word, sense } = body as { word?: string; sense?: string };

    if (typeof word !== "string" || !word.trim()) {
      return NextResponse.json({ error: "word 필수" }, { status: 400 });
    }

    const supabase = createServerClient();
    const senseVal = sense ?? "";

    const { data: rows, error: findError } = await supabase
      .from("dream_keywords")
      .select("id")
      .eq("word", word.trim())
      .eq("sense", senseVal)
      .limit(1);

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }
    if (!rows?.length) {
      return NextResponse.json(
        { error: "해당 키워드를 찾을 수 없습니다 (DB에 없음)" },
        { status: 404 }
      );
    }

    const deleteRowId = (rows[0] as { id: string }).id;
    const { error: deleteError } = await supabase
      .from("dream_keywords")
      .delete()
      .eq("id", deleteRowId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "삭제 완료",
    });
  } catch (err) {
    console.error("[dream/keyword] DELETE Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "삭제 중 오류" },
      { status: 500 }
    );
  }
}
