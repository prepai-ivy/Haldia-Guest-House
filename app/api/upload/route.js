import { successResponse, errorResponse } from "@/lib/api-utils";
import { getAuthUser } from "@/lib/auth";
import { uploadFileToBlob, deleteFileFromBlob } from "@/lib/azureBlob";

export async function POST(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!file || typeof file === "string") {
      return errorResponse("No file provided", 400);
    }
    if (!folder) {
      return errorResponse("folder is required", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { blobPath } = await uploadFileToBlob({
      buffer,
      folder,
      fileName: file.name,
      contentType: file.type,
    });

    return successResponse({ blobPath, fileName: file.name }, 201);
  } catch (error) {
    console.error("[Upload POST]", error);
    return errorResponse(error.message || "Upload failed", 400);
  }
}

export async function DELETE(request) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) return errorResponse("Unauthorized", 401);

    const { blobPath } = await request.json();
    if (!blobPath || typeof blobPath !== "string") {
      return errorResponse("blobPath is required", 400);
    }

    // Scope deletion to the booking-attachments folder — this endpoint isn't meant to be
    // a general-purpose "delete any blob" API, only a way to clean up an upload the same
    // request session just made and then removed before submitting.
    if (!blobPath.startsWith("booking-attachments/")) {
      return errorResponse("Invalid blobPath", 400);
    }

    await deleteFileFromBlob(blobPath);

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[Upload DELETE]", error);
    return errorResponse(error.message || "Delete failed", 400);
  }
}
