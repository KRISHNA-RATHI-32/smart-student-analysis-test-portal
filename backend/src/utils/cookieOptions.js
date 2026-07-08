// src/utils/cookieOptions.js

export const cookieOptions = {
    // Prevents client-side JavaScript from reading the cookie (Mitigates XSS attacks)
    httpOnly: true,
    
    // Only sends the cookie over HTTPS in production (Mitigates Man-in-the-Middle attacks)
    secure: process.env.NODE_ENV === "production",
    
    // Allows cross-origin requests in production (e.g., Vercel frontend talking to Render backend)
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};