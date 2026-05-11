import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // HRD trying to access applicant dashboard → redirect to HRD dashboard
    if (pathname.startsWith("/dashboard/applicant") && token?.role === "hrd") {
      return NextResponse.redirect(new URL("/dashboard/hrd", req.url));
    }

    // Applicant trying to access HRD dashboard → redirect to applicant dashboard
    if (pathname.startsWith("/dashboard/hrd") && token?.role === "applicant") {
      return NextResponse.redirect(new URL("/dashboard/applicant", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Only allow access if a valid JWT token exists
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/hrd/:path*",
    "/dashboard/applicant/:path*",
  ],
};
