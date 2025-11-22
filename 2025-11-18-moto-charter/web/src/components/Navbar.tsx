'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Navbar.module.css';

const BIKE_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'sport', label: 'Sport' },
    { value: 'naked', label: 'Naked' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'cruiser', label: 'Cruiser' },
    { value: 'touring', label: 'Touring' },
    { value: 'cafe-racer', label: 'Café Racer' },
    { value: 'other', label: 'Other' },
];

const PRICE_RANGES = [
    { value: '', label: 'Any Price' },
    { value: '0-200000', label: 'Under ₹2L' },
    { value: '200000-400000', label: '₹2L - ₹4L' },
    { value: '400000-600000', label: '₹4L - ₹6L' },
    { value: '600000-1000000', label: '₹6L - ₹10L' },
    { value: '1000000-', label: 'Above ₹10L' },
];

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [bikeType, setBikeType] = useState('');
    const [priceRange, setPriceRange] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        // Build URL params
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (bikeType) params.set('type', bikeType);
        if (priceRange) params.set('price', priceRange);

        // Navigate to home with search params
        const searchString = params.toString();
        router.push(searchString ? `/?${searchString}` : '/');
    };

    const handleReset = () => {
        setQuery('');
        setBikeType('');
        setPriceRange('');
        router.push('/');
    };

    const showSearch = pathname === '/';

    return (
        <nav className={styles.navbar}>
            <div className="container">
                <div className={styles.inner}>
                    <Link href="/" className={styles.logo}>
                        MOTO<span className={styles.highlight}>CHARTER</span>
                    </Link>

                    {showSearch && (
                        <form onSubmit={handleSearch} className={styles.searchForm}>
                            <input
                                type="text"
                                placeholder="Search motorcycles..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <select
                                value={bikeType}
                                onChange={(e) => setBikeType(e.target.value)}
                                className={styles.searchSelect}
                            >
                                {BIKE_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={priceRange}
                                onChange={(e) => setPriceRange(e.target.value)}
                                className={styles.searchSelect}
                            >
                                {PRICE_RANGES.map(range => (
                                    <option key={range.value} value={range.value}>
                                        {range.label}
                                    </option>
                                ))}
                            </select>
                            <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
                                Search
                            </button>
                            {(query || bikeType || priceRange) && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className={`btn btn-outline ${styles.resetBtn}`}
                                >
                                    Reset
                                </button>
                            )}
                        </form>
                    )}

                    <div className={styles.actions}>
                        <Link href="/sell" className="btn btn-primary">Sell a Bike</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
