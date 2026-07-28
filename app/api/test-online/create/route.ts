import { NextResponse } from 'next/server';
import { createTestOnlineRoom, isTestOnlineEnabled, isValidTestOnlineState, serializeTestOnlineRoom } from '@/lib/test-online-store';

export async function POST(request: Request) {
  if (!isTestOnlineEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => null) as { state?: Record<string, unknown> } | null;
  if (!body?.state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });
  if (!isValidTestOnlineState(body.state)) return NextResponse.json({ error: 'Invalid state' }, { status: 413 });

  const room = createTestOnlineRoom(body.state);
  if (!room) return NextResponse.json({ error: 'Room limit reached' }, { status: 429 });

  return NextResponse.json(serializeTestOnlineRoom(room));
}
