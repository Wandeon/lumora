import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/infrastructure/auth/auth';
import { createProduct } from '@/application/catalog/commands/create-product';
import { getProducts } from '@/application/catalog/queries/get-products';
import { hasFeature } from '@/shared/lib/features';

export async function GET() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check feature access - products require Pro tier
  const canAccess = await hasFeature(session.user.tenantId, 'print_orders');
  if (!canAccess) {
    return NextResponse.json(
      { error: 'Product catalog requires Pro tier or higher' },
      { status: 403 }
    );
  }

  const products = await getProducts(session.user.tenantId);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = await createProduct({
    tenantId: session.user.tenantId,
    name: body.name as string,
    description: body.description as string | undefined,
    type: body.type as
      | 'print'
      | 'digital_download'
      | 'magnet'
      | 'canvas'
      | 'album'
      | 'other',
    price: body.price as number,
    metadata: body.metadata as Record<string, unknown> | undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.value, { status: 201 });
}
