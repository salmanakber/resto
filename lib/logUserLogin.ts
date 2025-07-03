import {UAParser} from "ua-parser-js";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";


type LogLoginParams = {
  userId: string;
  req: Request | NextRequest;
  status: "SUCCESS" | "FAILED";
  sessionToken: string;
  expires: Date;
};

export async function logUserLogin({ userId, req, status, sessionToken, expires }: LogLoginParams) {
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
    (req as any).ip ||
    "unknown";

  const userAgentStr = req.headers.get("user-agent") || "Unknown";
  const parser = new UAParser(userAgentStr);
  const device = parser.getDevice().type || "Desktop";

  const parsedUserAgent = {
    ua: userAgentStr,  // Original userAgent string
    device: parser.getDevice(),
    os: parser.getOS(),
    browser: parser.getBrowser(),
    engine: parser.getEngine(),
    cpu: parser.getCPU(),
  };

  let locationInfo = "";
  let locationobj = {};
  // Use IP geolocation API
  if (ip !== "127.0.0.1" && ip !== "unknown") {
    try {
      const FinalIP = ip === "::1" ? "192.206.151.131" : ip;

      const geoRes = await fetch(`http://ip-api.com/json/${FinalIP}`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === "success") {
          locationInfo = `${geo.city}, ${geo.regionName}, ${geo.country}`;
          locationobj = geo;
        }
      } else {
        console.warn("Geo API returned error status:", geoRes.status);
      }
    } catch (err) {
      console.warn("Geo API error:", err);
    }
  }

  // Save login log
  const loginLog = await prisma.loginLog.create({
    data: {
      userId,
      ipAddress: ip,
      userAgent: JSON.stringify(parsedUserAgent),
      device,
      location: JSON.stringify(locationobj),
      status,
    },
  });

  const session = await prisma.session.upsert({
    where: { userId },
    create: {
      userId,
      sessionToken,
      expires,
      loginLogId: loginLog.id,
      lastActiveAt: new Date(),
    },
    update: {}, // no-op on conflict
  });
  return session;
}
