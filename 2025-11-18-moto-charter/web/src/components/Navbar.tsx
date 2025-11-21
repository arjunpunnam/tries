import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className="container">
                <div className={styles.inner}>
                    <Link href="/" className={styles.logo}>
                        MOTO<span className={styles.highlight}>CHARTER</span>
                    </Link>

                    <div className={styles.links}>
                        <Link href="/search" className={styles.link}>Browse</Link>
                        <Link href="/sell" className={styles.link}>Sell a Bike</Link>
                    </div>

                    <div className={styles.auth}>
                        <Link href="/login" className="btn btn-outline">Log In</Link>
                        <Link href="/signup" className="btn btn-primary">Sign Up</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
