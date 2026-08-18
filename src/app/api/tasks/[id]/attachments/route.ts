import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: attachments, error } = await supabase
      .from("FileAttachment")
      .select("*, User(name)")
      .eq("taskId", id)
      .order("createdAt", { ascending: false });

    if (error) throw error;

    const formatted = attachments?.map((a: any) => ({
      id: a.id,
      taskId: a.taskId,
      userId: a.userId,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
      fileUrl: a.fileUrl,
      userName: a.User?.name || "Unknown",
      createdAt: a.createdAt,
    })) || [];

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Get attachments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const { fileUrl, fileName, fileType, fileSize } = await uploadFile(id, file);

    const attachmentId = crypto.randomUUID();
    const { data: attachment, error } = await supabase
      .from("FileAttachment")
      .insert({
        id: attachmentId,
        taskId: id,
        userId: session.user.id,
        fileName,
        fileType,
        fileSize,
        fileUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: attachment.id,
      taskId: attachment.taskId,
      userId: attachment.userId,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      fileUrl: attachment.fileUrl,
      userName: session.user.name || "You",
      createdAt: attachment.createdAt,
    });
  } catch (error) {
    console.error("Upload attachment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
