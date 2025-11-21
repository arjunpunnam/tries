import { NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, images, serviceRecords } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const listing = await db.query.listings.findFirst({
            where: eq(listings.id, id),
            with: {
                images: true,
                // serviceRecords: true, // Maybe only show if logged in? Or public?
            },
        });

        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, listing });
    } catch (error) {
        console.error('Fetch listing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const listing = await db.select().from(listings).where(eq(listings.id, id)).get();
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        // Update logic here... for MVP just updating status or basic fields
        const { status, price, description } = body;

        await db.update(listings)
            .set({ status, price, description }) // Add other fields as needed
            .where(eq(listings.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update listing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const listing = await db.select().from(listings).where(eq(listings.id, id)).get();
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await db.delete(listings).where(eq(listings.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete listing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
