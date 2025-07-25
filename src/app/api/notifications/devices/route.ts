import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

// GET endpoint to retrieve all device tokens for the current user
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all device tokens for the user
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        token: true,
        deviceType: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    return Response.json({ deviceTokens });
  } catch (error) {
    debug.error("Error retrieving device tokens:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to register a new device token
export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if push notifications are enabled in site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { pushNotificationsEnabled: true, firebaseEnabled: true },
    });

    if (!settings?.pushNotificationsEnabled || !settings?.firebaseEnabled) {
      return Response.json(
        { error: "Push notifications are currently disabled" },
        { status: 403 }
      );
    }

    // Parse request body
    const { token, deviceType } = await request.json();

    if (!token) {
      return Response.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!["IOS", "ANDROID", "WEB"].includes(deviceType)) {
      return Response.json(
        { error: "Invalid device type. Must be IOS, ANDROID, or WEB" },
        { status: 400 }
      );
    }

    // Check if token already exists
    const existingToken = await prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update the existing token
      const updatedToken = await prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          userId: user.id, // Update user ID in case token is being transferred
          deviceType: deviceType as "IOS" | "ANDROID" | "WEB",
          isActive: true,
          lastUsed: new Date(),
        },
      });

      return Response.json({
        message: "Device token updated successfully",
        deviceToken: updatedToken,
      });
    }

    // Create a new device token
    const deviceToken = await prisma.deviceToken.create({
      data: {
        userId: user.id,
        token,
        deviceType: deviceType as "IOS" | "ANDROID" | "WEB",
      },
    });

    return Response.json({
      message: "Device token registered successfully",
      deviceToken,
    });
  } catch (error) {
    debug.error("Error registering device token:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to remove a device token
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get token from query params
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return Response.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the token and ensure it belongs to the user
    const deviceToken = await prisma.deviceToken.findFirst({
      where: {
        token,
        userId: user.id,
      },
    });

    if (!deviceToken) {
      return Response.json(
        { error: "Device token not found" },
        { status: 404 }
      );
    }

    // Delete the token
    await prisma.deviceToken.delete({
      where: { id: deviceToken.id },
    });

    return Response.json({
      message: "Device token removed successfully",
    });
  } catch (error) {
    debug.error("Error removing device token:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
