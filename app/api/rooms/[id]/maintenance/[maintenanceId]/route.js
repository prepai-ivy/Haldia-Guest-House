import { connectToDatabase } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { getAuthUser } from "@/lib/auth";
import RoomMaintenance from "@/lib/models/RoomMaintainence.modal";
import mongoose from "mongoose";

/* -------------------- DELETE: cancel a scheduled maintenance window early -------------------- */
export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || !["ADMIN", "SUPER_ADMIN"].includes(authUser.role)) {
      return errorResponse("Forbidden", 403);
    }

    await connectToDatabase();

    const { id, maintenanceId } = await params;
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(maintenanceId)
    ) {
      return errorResponse("Invalid id", 400);
    }

    const maintenance = await RoomMaintenance.findOneAndUpdate(
      { _id: maintenanceId, roomId: id },
      { status: "CANCELLED" },
      { new: true }
    );

    if (!maintenance) return errorResponse("Maintenance window not found", 404);

    return successResponse(maintenance);
  } catch (error) {
    console.error("[Room Maintenance DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
