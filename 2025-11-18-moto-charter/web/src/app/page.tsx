import Hero from "@/components/Hero";

export default function Home() {
  return (
    <>
      <Hero />
      <section className="container" style={{ padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Featured Listings</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Coming soon...</p>
        {/* Listing Grid will go here */}
      </section>
    </>
  );
}
