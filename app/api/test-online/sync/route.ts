import { NextResponse } from 'next/server';
import { isTestOnlineEnabled, isValidTestOnlineState, serializeTestOnlineRoom, updateTestOnlineRoom } from '@/lib/test-online-store';

export async function POST(request: Request) {
  if (!isTestOnlineEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json().catch(() => null) as { id?: string; state?: Record<string, unknown> } | null;
  if (!body?.id || !body.state) return NextResponse.json({ error: 'Missing id or state' }, { status: 400 });
  if (!isValidTestOnlineState(body.state)) return NextResponse.json({ error: 'Invalid state' }, { status: 413 });

  const room = updateTestOnlineRoom(body.id, body.state);
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(serializeTestOnlineRoom(room));
}
