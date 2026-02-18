import { NextRequest } from 'next/server';
import { getConsoleClient } from '@/lib/akash/console-api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/deployments/[id]/logs
 * Stream logs using Server-Sent Events
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const userAddress = request.headers.get('x-user-address');
    
    if (!userAddress) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const follow = searchParams.get('follow') === 'true';
    const service = searchParams.get('service');
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Deployment ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = getConsoleClient();
    
    // Verify deployment exists and user has access
    const deployment = await client.getDeployment(id);
    
    if (deployment.owner !== userAddress) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get logs stream from Console API
    const logStream = await client.getLogs(id, follow);

    // Create SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection message
          controller.enqueue(encoder.encode('event: connected\ndata: {"message": "Connected to log stream"}\n\n'));
          
          const reader = logStream.getReader();
          const decoder = new TextDecoder();
          
          // Stream logs
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.enqueue(encoder.encode('event: complete\ndata: {"message": "Log stream complete"}\n\n'));
              break;
            }
            
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              // Parse log line and format as SSE
              const logData = {
                timestamp: new Date().toISOString(),
                deploymentId: id,
                service: service || 'default',
                message: line
              };
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(logData)}\n\n`));
            }
          }
          
          reader.releaseLock();
          controller.close();
        } catch (error) {
          console.error('Log stream error:', error);
          const errorData = {
            error: true,
            message: error instanceof Error ? error.message : 'Stream error'
          };
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      },
      cancel() {
        // Clean up when client disconnects
        console.log(`Log stream cancelled for deployment ${id}`);
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to stream logs:', error);
    
    const status = error instanceof Error && error.message.includes('404') ? 404 : 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: 'Failed to stream logs', details: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
