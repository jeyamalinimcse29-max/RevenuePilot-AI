import { NextResponse } from 'next/server';
import { runFullAgentCycle } from '@/lib/agent/core';

export async function POST(req: Request) {
  try {
    const result = await runFullAgentCycle();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error in agent run cycle:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
