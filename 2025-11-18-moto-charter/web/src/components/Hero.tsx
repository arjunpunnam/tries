import styles from './Hero.module.css';
import Link from 'next/link';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className="container">
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        Find Your Next <span className={styles.highlight}>Adventure</span>
                    </h1>
                    <p className={styles.subtitle}>
                        The curated marketplace for enthusiast motorcycles in India.
                        Verified listings, detailed history, and a community that cares.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/search" className="btn btn-primary">Browse Listings</Link>
                        <Link href="/sell" className="btn btn-outline">Sell Your Bike</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
