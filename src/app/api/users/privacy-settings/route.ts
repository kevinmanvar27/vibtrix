import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import debug from "@/lib/debug";

// GET endpoint to retrieve the privacy settings of the current user
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      showOnlineStatus: user.showOnlineStatus,
      isProfilePublic: user.isProfilePublic,
      showWhatsappNumber: user.showWhatsappNumber,
      showDob: user.showDob,
      hideYear: user.hideYear,
      showUpiId: user.showUpiId,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to update the privacy settings of the current user
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      debug.error("Unauthorized access attempt to privacy settings");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log("User authenticated:", user.id, user.username);

    let requestData;
    try {
      requestData = await request.json();
      debug.log("Received privacy settings update request:", requestData);
    } catch (e) {
      debug.error("Failed to parse request JSON:", e);
      return Response.json({ error: "Invalid JSON in request" }, { status: 400 });
    }

    // Create an update data object with only the fields that are present in the request
    const updateData: any = {};
    const validFields = ['showOnlineStatus', 'isProfilePublic', 'showWhatsappNumber', 'showDob', 'hideYear', 'showUpiId'];

    // Validate each field that is present in the request
    for (const field of validFields) {
      if (field in requestData) {
        if (typeof requestData[field] !== 'boolean') {
          debug.error(`Invalid type for ${field}:`, typeof requestData[field]);
          return Response.json({
            error: "Invalid input",
            details: { [field]: `Expected boolean, got ${typeof requestData[field]}` }
          }, { status: 400 });
        }
        updateData[field] = requestData[field];
      }
    }

    // If no valid fields were provided, return an error
    if (Object.keys(updateData).length === 0) {
      debug.error("No valid fields provided in request");
      return Response.json({ error: "No valid fields provided" }, { status: 400 });
    }

    // Special case: if showDob is being set to false, also set hideYear to false
    if ('showDob' in updateData && updateData.showDob === false) {
      updateData.hideYear = false;
    }

    // Special case: if hideYear is true, ensure showFullDob is false
    if ('hideYear' in updateData && updateData.hideYear === true) {
      updateData.showFullDob = false;
    }

    debug.log("Updating privacy settings for user:", user.id, "with data:", updateData);

    // Update user privacy settings with only the fields that were provided
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        showOnlineStatus: true,
        isProfilePublic: true,
        showWhatsappNumber: true,
        showDob: true,
        hideYear: true,
        showUpiId: true,
      }
    });

    debug.log("Privacy settings updated successfully:", updatedUser);

    // Get the current user's username to invalidate their profile page cache
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true }
    });

    if (currentUser) {
      // Invalidate the user's profile page cache
      revalidatePath(`/users/${currentUser.username}`);
      debug.log("Cache invalidated for user profile:", currentUser.username);
    }

    return Response.json({
      showOnlineStatus: updatedUser.showOnlineStatus,
      isProfilePublic: updatedUser.isProfilePublic,
      showWhatsappNumber: updatedUser.showWhatsappNumber,
      showDob: updatedUser.showDob,
      hideYear: updatedUser.hideYear,
      showUpiId: updatedUser.showUpiId,
    });
  } catch (error) {
    debug.error("Error updating privacy settings:", error);
    return Response.json({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
