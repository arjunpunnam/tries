import Link from 'next/link';
import { db } from '@/db';
import { listings, images } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

async function getListings() {
    // In a real app, we would have search params here
    const allListings = await db.query.listings.findMany({
        where: eq(listings.status, 'active'),
        orderBy: [desc(listings.createdAt)],
        with: {
            images: true,
        },
    });
    return allListings;
}

export default async function SearchPage() {
    const items = await getListings();

    return (
        <div className="container" style={{ padding: '4rem 2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Browse Motorcycles</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {items.map((item: any) => (
                    <Link href={`/listings/${item.id}`} key={item.id} className="card" style={{ display: 'block', padding: 0, overflow: 'hidden' }}>
                        <div style={{ aspectRatio: '16/9', background: 'var(--secondary)', position: 'relative' }}>
                            {item.images[0] ? (
                                <img src={item.images[0].url} alt={item.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>No Image</div>
                            )}
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{item.year} {item.make} {item.model}</h3>
                            </div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                ₹{item.price.toLocaleString()}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                <span>{item.mileage.toLocaleString()} km</span>
                                <span>•</span>
                                <span>{item.engineCc} cc</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
                    No listings found. Be the first to sell your bike!
                </div>
            )}
        </div>
    );
}
