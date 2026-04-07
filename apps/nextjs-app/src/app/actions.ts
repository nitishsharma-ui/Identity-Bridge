'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error('Unauthorized');
  }
}

export async function getSyncStatus() {
  await checkAuth();
  try {
    const res = await fetch('http://localhost:4000/sync/status', {
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Agent Service Offline' };
    return await res.json();
  } catch (err: any) {
    return { error: 'Failed to contact Agent Service: ' + err.message };
  }
}

export async function triggerManualSync() {
  await checkAuth();
  try {
    const res = await fetch('http://localhost:4000/sync/run', {
      method: 'POST',
      cache: 'no-store'
    });
    if (!res.ok) return { error: 'Agent Service returned an error.' };
    return await res.json();
  } catch (err: any) {
    return { error: 'Failed to trigger sync: ' + err.message };
  }
}
