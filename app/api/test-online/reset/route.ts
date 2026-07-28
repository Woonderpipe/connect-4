import { NextResponse } from 'next/server';
import { isTestOnlineEnabled, resetTestOnlineRooms } from '@/lib/test-online-store';

export async function POST() {
  if (!isTestOnlineEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  resetTestOnlineRooms();
  return NextResponse.json({ ok: true });
}