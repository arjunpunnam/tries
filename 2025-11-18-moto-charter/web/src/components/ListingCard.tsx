'use client';

import Link from 'next/link';
import styles from './ListingCard.module.css';

interface ListingCardProps {
    listing: {
        id: string;
        make: string;
        model: string;
        year: number;
        price: number;
        mileage: number;
        engineCc: number;
        location: string;
        bikeType: string;
        description: string;
        images: Array<{ url: string; isPrimary: boolean }>;
    };
}

export default function ListingCard({ listing }: ListingCardProps) {
    const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0];
    const formattedPrice = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(listing.price);

    const bikeTypeLabels: Record<string, string> = {
        'sport': 'Sport',
        'naked': 'Naked',
        'adventure': 'Adventure',
        'cruiser': 'Cruiser',
        'touring': 'Touring',
        'cafe-racer': 'Café Racer',
        'other': 'Other',
    };

    return (
        <Link href={`/listings/${listing.id}`} className={styles.card}>
            <div className={styles.imageContainer}>
                {primaryImage && (
                    <img
                        src={primaryImage.url}
                        alt={`${listing.make} ${listing.model}`}
                        className={styles.image}
                    />
                )}
                <div className={styles.badge}>{bikeTypeLabels[listing.bikeType]}</div>
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>
                    {listing.make} {listing.model}
                </h3>
                <p className={styles.subtitle}>{listing.year}</p>

                <div className={styles.specs}>
                    <div className={styles.spec}>
                        <span className={styles.specIcon}>🏍️</span>
                        <span>{listing.engineCc}cc</span>
                    </div>
                    <div className={styles.spec}>
                        <span className={styles.specIcon}>📏</span>
                        <span>{listing.mileage.toLocaleString('en-IN')} km</span>
                    </div>
                </div>

                <p className={styles.description}>{listing.description}</p>

                <div className={styles.footer}>
                    <div className={styles.price}>{formattedPrice}</div>
                    <div className={styles.location}>
                        <span>📍</span>
                        <span>{listing.location.split(',')[0]}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
