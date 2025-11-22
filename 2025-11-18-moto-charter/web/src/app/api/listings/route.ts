import { NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, images, serviceRecords } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const allListings = await db.query.listings.findMany({
            where: eq(listings.status, 'active'),
            orderBy: [desc(listings.createdAt)],
            with: {
                images: true,
                // We might want to limit images or just get the primary one for the list view
            },
        });

        return NextResponse.json({ success: true, listings: allListings });
    } catch (error) {
        console.error('Fetch listings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { make, model, year, price, description, mileage, engineCc, location, bikeType, imageUrls, serviceHistory } = body;

        // Validation (basic)
        if (!make || !model || !year || !price || !description || !mileage || !engineCc || !location || !bikeType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (parseInt(engineCc) < 250) {
            return NextResponse.json({ error: 'Engine displacement must be 250cc or above' }, { status: 400 });
        }

        // Transaction to create listing and related data
        const result = await db.transaction(async (tx) => {
            const newListing = await tx.insert(listings).values({
                userId: session.userId,
                make,
                model,
                year: parseInt(year),
                price: parseFloat(price),
                description,
                mileage: parseInt(mileage),
                engineCc: parseInt(engineCc),
                location,
                bikeType,
            }).returning().get();

            if (imageUrls && imageUrls.length > 0) {
                await tx.insert(images).values(
                    imageUrls.map((url: string, index: number) => ({
                        listingId: newListing.id,
                        url,
                        isPrimary: index === 0,
                    }))
                );
            }

            if (serviceHistory && serviceHistory.length > 0) {
                await tx.insert(serviceRecords).values(
                    serviceHistory.map((record: any) => ({
                        listingId: newListing.id,
                        date: new Date(record.date),
                        odometer: parseInt(record.odometer),
                        description: record.description,
                        fileUrl: record.fileUrl,
                    }))
                );
            }

            return newListing;
        });

        return NextResponse.json({ success: true, listing: result });
    } catch (error) {
        console.error('Create listing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
