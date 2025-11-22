'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

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

interface SearchBarProps {
    onSearch: (filters: {
        query: string;
        bikeType: string;
        priceRange: string;
    }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [bikeType, setBikeType] = useState('');
    const [priceRange, setPriceRange] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch({ query, bikeType, priceRange });
    };

    const handleReset = () => {
        setQuery('');
        setBikeType('');
        setPriceRange('');
        onSearch({ query: '', bikeType: '', priceRange: '' });
    };

    return (
        <div className={styles.searchBar}>
            <form onSubmit={handleSearch}>
                <div className={styles.searchContainer}>
                    <div className={styles.searchField}>
                        <input
                            type="text"
                            placeholder="Search motorcycles..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.filterField}>
                        <select
                            value={bikeType}
                            onChange={(e) => setBikeType(e.target.value)}
                            className={styles.searchInput}
                        >
                            {BIKE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <select
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className={styles.searchInput}
                        >
                            {PRICE_RANGES.map(range => (
                                <option key={range.value} value={range.value}>
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className={`btn btn-primary ${styles.searchButton}`}>
                        Search
                    </button>

                    {(query || bikeType || priceRange) && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className={`btn btn-outline ${styles.resetButton}`}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
