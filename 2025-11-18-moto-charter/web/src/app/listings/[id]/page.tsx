import { notFound } from 'next/navigation';
import ListingGallery from '@/components/ListingGallery';

async function getListing(id: string) {
    const res = await fetch(`http://localhost:3000/api/listings/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await getListing(id);

    if (!data || !data.listing) {
        notFound();
    }

    const { listing } = data;

    return (
        <div className="container" style={{ padding: '4rem 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                <div>
                    <ListingGallery images={listing.images} />

                    <div style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Description</h2>
                        <p style={{ lineHeight: '1.6', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                            {listing.description}
                        </p>
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Service History</h2>
                        <div style={{ padding: '1.5rem', background: 'var(--card)', borderRadius: 'var(--radius)' }}>
                            <p style={{ color: 'var(--muted-foreground)' }}>No service records uploaded.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div className="card">
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{listing.year} {listing.make} {listing.model}</h1>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                                ₹{listing.price.toLocaleString()}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <span className="label">Mileage</span>
                                    <div>{listing.mileage.toLocaleString()} km</div>
                                </div>
                                <div>
                                    <span className="label">Engine</span>
                                    <div>{listing.engineCc} cc</div>
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%' }}>Contact Seller</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
