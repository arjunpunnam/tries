'use client';

import { useState } from 'react';
import styles from './ListingGallery.module.css';
import { motion, AnimatePresence } from 'framer-motion';

interface ListingGalleryProps {
    images: { url: string; isPrimary: boolean }[];
}

export default function ListingGallery({ images }: ListingGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!images || images.length === 0) {
        return <div className={styles.placeholder}>No Images Available</div>;
    }

    return (
        <div className={styles.gallery}>
            <div className={styles.mainImage}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={currentIndex}
                        src={images[currentIndex].url}
                        alt="Motorcycle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={styles.img}
                    />
                </AnimatePresence>
            </div>
            <div className={styles.thumbnails}>
                {images.map((img, index) => (
                    <button
                        key={index}
                        className={`${styles.thumbnail} ${index === currentIndex ? styles.active : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    >
                        <img src={img.url} alt="Thumbnail" />
                    </button>
                ))}
            </div>
        </div>
    );
}
