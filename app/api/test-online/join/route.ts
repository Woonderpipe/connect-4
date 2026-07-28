import { NextResponse } from 'next/server';
import { isTestOnlineEnabled, joinTestOnlineRoom, serializeTestOnlineRoom } from '@/lib/test-online-store';

export async function POST(request: Request) {
  if (!isTestOnlineEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const room = joinTestOnlineRoom(body.id);
  if (!room) return NextResponse.json({ error: 'Invalid code or game full' }, { status: 404 });

  return NextResponse.json(serializeTestOnlineRoom(room));
}