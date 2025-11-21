import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.inner}>
                    <div className={styles.col}>
                        <h3 className={styles.heading}>MOTOCHARTER</h3>
                        <p className={styles.text}>The enthusiast marketplace for premium motorcycles in India.</p>
                    </div>
                    <div className={styles.col}>
                        <h4 className={styles.subheading}>Platform</h4>
                        <a href="/search" className={styles.link}>Browse</a>
                        <a href="/sell" className={styles.link}>Sell</a>
                        <a href="/how-it-works" className={styles.link}>How it Works</a>
                    </div>
                    <div className={styles.col}>
                        <h4 className={styles.subheading}>Legal</h4>
                        <a href="/terms" className={styles.link}>Terms</a>
                        <a href="/privacy" className={styles.link}>Privacy</a>
                    </div>
                </div>
                <div className={styles.copy}>
                    &copy; {new Date().getFullYear()} MotoCharter. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
