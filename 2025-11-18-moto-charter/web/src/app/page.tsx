'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingCard from "@/components/ListingCard";

interface Listing {
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
}

export default function Home() {
  const searchParams = useSearchParams();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    // Filter listings when URL params change
    const query = searchParams.get('q') || '';
    const bikeType = searchParams.get('type') || '';
    const priceRange = searchParams.get('price') || '';

    filterListings(query, bikeType, priceRange);
  }, [searchParams, allListings]);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings');
      const data = await response.json();
      if (data.success) {
        setAllListings(data.listings);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = (query: string, bikeType: string, priceRange: string) => {
    let filtered = [...allListings];

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.make.toLowerCase().includes(q) ||
        listing.model.toLowerCase().includes(q) ||
        listing.description.toLowerCase().includes(q)
      );
    }

    // Filter by bike type
    if (bikeType) {
      filtered = filtered.filter(listing => listing.bikeType === bikeType);
    }

    // Filter by price range
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(listing => {
        if (max) {
          return listing.price >= min && listing.price <= max;
        } else {
          return listing.price >= min;
        }
      });
    }

    setFilteredListings(filtered);
  };

  if (loading) {
    return (
      <section className="container" style={{ padding: '2rem' }}>
        <p style={{ color: 'var(--muted-foreground)' }}>Loading listings...</p>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: '2rem' }}>
      {filteredListings.length === 0 ? (
        <p style={{ color: 'var(--muted-foreground)' }}>
          {allListings.length === 0 ? 'No listings available yet.' : 'No listings match your search criteria.'}
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '2rem',
        }}>
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
