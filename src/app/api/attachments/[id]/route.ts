import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: attachment, error: fetchError } = await supabase
      .from("FileAttachment")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    try {
      await deleteFile(attachment.fileUrl);
    } catch {
      // File may already be deleted from storage; continue to delete metadata
    }

    const { error } = await supabase
      .from("FileAttachment")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Attachment deleted" });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
