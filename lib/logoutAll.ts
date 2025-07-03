// lib/logoutAll.ts
import { signOut } from 'next-auth/react';

export async function logoutFromAllDevices(callbackUrl = '/') {
  try {
    const res = await fetch('/api/signout', {
      method: 'POST',
    });

    if (!res.ok) {
      console.error('Failed to logout all sessions');
      return;
    }

    // Use NextAuth's method to log out current session
    await signOut({ callbackUrl }); // ✅ correct usage
  } catch (err) {
    console.error('Logout error:', err);
  }
}
