import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.CLICKUP_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'ClickUp token not configured' },
        { status: 404 }
      );
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error retrieving ClickUp token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve ClickUp token' },
      { status: 500 }
    );
  }
}
