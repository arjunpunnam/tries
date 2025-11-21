'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ListingForm.module.css';

export default function ListingForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [images, setImages] = useState<File[]>([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data: any = Object.fromEntries(formData.entries());

        try {
            // 1. Upload Images
            const imageUrls = [];
            for (const image of images) {
                const imageFormData = new FormData();
                imageFormData.append('file', image);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: imageFormData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                const { url } = await uploadRes.json();
                imageUrls.push(url);
            }

            // 2. Create Listing
            const listingRes = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, imageUrls }),
            });

            if (!listingRes.ok) {
                const { error } = await listingRes.json();
                throw new Error(error || 'Failed to create listing');
            }

            router.push('/'); // Redirect to home or listing details
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.grid}>
                <div className={styles.field}>
                    <label className="label">Make</label>
                    <input name="make" className="input" required placeholder="e.g. Royal Enfield" />
                </div>
                <div className={styles.field}>
                    <label className="label">Model</label>
                    <input name="model" className="input" required placeholder="e.g. Interceptor 650" />
                </div>
                <div className={styles.field}>
                    <label className="label">Year</label>
                    <input name="year" type="number" className="input" required placeholder="2023" />
                </div>
                <div className={styles.field}>
                    <label className="label">Price (₹)</label>
                    <input name="price" type="number" className="input" required placeholder="250000" />
                </div>
                <div className={styles.field}>
                    <label className="label">Mileage (km)</label>
                    <input name="mileage" type="number" className="input" required placeholder="5000" />
                </div>
                <div className={styles.field}>
                    <label className="label">Engine (cc)</label>
                    <input name="engineCc" type="number" className="input" required placeholder="648" />
                </div>
            </div>

            <div className={styles.field}>
                <label className="label">Description</label>
                <textarea name="description" className="input" rows={5} required placeholder="Tell us about your bike..." />
            </div>

            <div className={styles.field}>
                <label className="label">Photos</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="input" />
                <p className={styles.hint}>Upload high-quality photos (Max 5)</p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Listing...' : 'Create Listing'}
            </button>
        </form>
    );
}
