import ListingForm from '@/components/ListingForm';

export default function SellPage() {
    return (
        <div className="container" style={{ padding: '4rem 2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Sell Your Motorcycle</h1>
            <ListingForm />
        </div>
    );
}
