import { NextResponse } from 'next/server';
import { getTestOnlineRoom, isTestOnlineEnabled, serializeTestOnlineRoom } from '@/lib/test-online-store';

export async function GET(request: Request) {
  if (!isTestOnlineEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const room = getTestOnlineRoom(id);
  if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(serializeTestOnlineRoom(room));
}