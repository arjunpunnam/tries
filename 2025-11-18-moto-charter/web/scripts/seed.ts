import { db } from '../src/db';
import { users, listings, images } from '../src/db/schema';
import bcrypt from 'bcryptjs';

const dummyListings = [
    {
        make: 'Royal Enfield',
        model: 'Interceptor 650',
        year: 2023,
        price: 285000,
        mileage: 3200,
        engineCc: 648,
        location: 'Bangalore, Karnataka',
        bikeType: 'naked' as const,
        description: 'Immaculate Royal Enfield Interceptor 650 in Canyon Red. Single owner, meticulously maintained with complete service history from authorized dealer. All services done on time, new tires fitted at 2500km. Bike is in showroom condition with zero scratches. Comes with tank pad, engine guard, and pannier mounts. Perfect for weekend rides and long tours.',
        images: [
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
        ]
    },
    {
        make: 'KTM',
        model: '390 Duke',
        year: 2022,
        price: 245000,
        mileage: 8500,
        engineCc: 373,
        location: 'Mumbai, Maharashtra',
        bikeType: 'naked' as const,
        description: 'Well-maintained KTM 390 Duke in excellent condition. Second owner, purchased from first owner with complete documentation. Regular servicing done at KTM authorized service center. New chain and sprocket replaced at 7000km. Michelin tires with 70% tread remaining. Bike has never been dropped or in any accident. Quickshifter+ installed. Ready for immediate sale.',
        images: [
            'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
        ]
    },
    {
        make: 'Kawasaki',
        model: 'Ninja 650',
        year: 2021,
        price: 485000,
        mileage: 12000,
        engineCc: 649,
        location: 'Delhi, NCR',
        bikeType: 'sport' as const,
        description: 'Stunning Kawasaki Ninja 650 in Lime Green. First owner, all services done at Kawasaki authorized center with complete service book. Recently completed 12000km service including oil change, brake fluid replacement, and chain lubrication. New battery installed. Bike comes with frame sliders, tank grips, and aftermarket exhaust (stock exhaust included). Perfect sports tourer for highway cruising.',
        images: [
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
        ]
    },
    {
        make: 'BMW',
        model: 'G 310 R',
        year: 2023,
        price: 265000,
        mileage: 1800,
        engineCc: 313,
        location: 'Pune, Maharashtra',
        bikeType: 'naked' as const,
        description: 'Almost new BMW G 310 R with only 1800km on the odometer. Purchased 6 months ago, selling due to upgrade. Bike is under warranty till 2026. All services done at BMW Motorrad authorized center. Comes with original accessories including BMW tank bag and crash guards. No modifications, completely stock. Insurance valid till next year. Non-negotiable price.',
        images: [
            'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
        ]
    },
    {
        make: 'Triumph',
        model: 'Street Triple RS',
        year: 2020,
        price: 895000,
        mileage: 15000,
        engineCc: 765,
        location: 'Hyderabad, Telangana',
        bikeType: 'naked' as const,
        description: 'Pristine Triumph Street Triple RS in Matte Silver. Single owner, garage kept, never seen rain. Complete service history from Triumph authorized dealer. Recent major service completed including valve clearance check. New Pirelli Diablo Rosso III tires. Bike has Arrow exhaust, tail tidy, and bar end mirrors. Absolutely no issues, ready to ride. Serious buyers only.',
        images: [
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
            'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
        ]
    },
    {
        make: 'Honda',
        model: 'CB500X',
        year: 2022,
        price: 565000,
        mileage: 6500,
        engineCc: 471,
        location: 'Chennai, Tamil Nadu',
        bikeType: 'adventure' as const,
        description: 'Excellent Honda CB500X adventure tourer. Perfect for long distance touring with comfortable ergonomics. First owner, all services done at Honda BigWing. Comes with SW-Motech crash bars, center stand, and aluminum panniers. New Continental TKC70 tires fitted. Chain and sprockets in excellent condition. Bike has been on multiple Ladakh and Northeast trips. Well maintained and ready for your next adventure.',
        images: [
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
        ]
    },
    {
        make: 'Harley-Davidson',
        model: 'Street 750',
        year: 2019,
        price: 425000,
        mileage: 18000,
        engineCc: 749,
        location: 'Ahmedabad, Gujarat',
        bikeType: 'cruiser' as const,
        description: 'Classic Harley-Davidson Street 750 in Vivid Black. Second owner with complete transfer documentation. Regular servicing done at authorized Harley dealer. Bike has Vance & Hines exhaust, forward controls, and custom seat. New battery and spark plugs recently replaced. Chrome is in excellent condition with no rust. Perfect cruiser for city rides and weekend getaways.',
        images: [
            'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
            'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
        ]
    },
    {
        make: 'Yamaha',
        model: 'MT-15',
        year: 2023,
        price: 155000,
        mileage: 2100,
        engineCc: 155,
        location: 'Kolkata, West Bengal',
        bikeType: 'naked' as const,
        description: 'Brand new condition Yamaha MT-15 Version 2.0 in Dark Knight color. Purchased 4 months ago, selling due to relocation. Under warranty, first free service completed. Bike has been garage kept and used only for weekend rides. Comes with MRF Revz tires in excellent condition. No modifications, completely stock. Insurance and RC available. Immediate sale preferred.',
        images: [
            'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
            'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
        ]
    }
];

async function seed() {
    try {
        console.log('🌱 Starting database seed...');

        // Create a demo user
        const passwordHash = await bcrypt.hash('demo123', 10);
        const [user] = await db.insert(users).values({
            name: 'Demo User',
            email: 'demo@motocharter.com',
            passwordHash,
            role: 'user',
        }).returning();

        console.log('✅ Created demo user:', user.email);

        // Create listings
        for (const listing of dummyListings) {
            const { images: imageUrls, ...listingData } = listing;

            const [newListing] = await db.insert(listings).values({
                userId: user.id,
                ...listingData,
            }).returning();

            // Add images
            await db.insert(images).values(
                imageUrls.map((url, index) => ({
                    listingId: newListing.id,
                    url,
                    isPrimary: index === 0,
                }))
            );

            console.log(`✅ Created listing: ${listing.make} ${listing.model}`);
        }

        console.log('🎉 Database seeded successfully!');
        console.log(`📊 Created ${dummyListings.length} listings`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
