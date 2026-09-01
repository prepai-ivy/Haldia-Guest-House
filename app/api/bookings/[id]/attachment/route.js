import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getAuthUser } from "@/lib/auth";
import Booking from "@/lib/models/Booking.model";
import { getSignedBlobUrl } from "@/lib/azureBlob";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return errorResponse("Forbidden", 403);
    }

    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid booking id", 400);
    }

    const booking = await Booking.findById(id).select("attachmentBlobPath").lean();
    if (!booking) return errorResponse("Booking not found", 404);
    if (!booking.attachmentBlobPath) return errorResponse("No attachment on this booking", 404);

    const url = await getSignedBlobUrl(booking.attachmentBlobPath);
    return successResponse({ url });
  } catch (error) {
    console.error("[Booking Attachment GET]", error);
    return errorResponse("Internal server error", 500);
  }
}
