import { NextResponse } from 'next/server';
import { ClickUpService } from '../../../../lib/clickup-service';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate the token by making a test request
    const clickupService = new ClickUpService(token);
    const isValid = await clickupService.validateToken();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid ClickUp token' },
        { status: 401 }
      );
    }

    // In a production environment, you would want to:
    // 1. Encrypt the token before storing
    // 2. Use a secure storage solution (e.g., database, secure key store)
    // 3. Associate the token with the current user's session
    // For demo purposes, we'll store in an environment variable
    process.env.CLICKUP_TOKEN = token;

    return NextResponse.json(
      { message: 'ClickUp token saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving ClickUp token:', error);
    return NextResponse.json(
      { error: 'Failed to save ClickUp token' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const token = process.env.CLICKUP_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'No ClickUp token found' },
        { status: 404 }
      );
    }

    // Validate the stored token
    const clickupService = new ClickUpService(token);
    const isValid = await clickupService.validateToken();

    if (!isValid) {
      return NextResponse.json(
        { error: 'Stored ClickUp token is invalid' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'ClickUp integration is configured' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking ClickUp token:', error);
    return NextResponse.json(
      { error: 'Failed to check ClickUp token' },
      { status: 500 }
    );
  }
}
