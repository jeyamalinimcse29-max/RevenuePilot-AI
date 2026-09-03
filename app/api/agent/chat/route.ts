import { NextResponse } from 'next/server';
import { chatWithMerchantCopilot } from '@/lib/agent/copilot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || body.message;
    const history = body.history || [];

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await chatWithMerchantCopilot(query, history);
    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error: any) {
    console.error('Error in copilot chat:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
