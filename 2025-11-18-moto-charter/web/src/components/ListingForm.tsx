'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ListingForm.module.css';

const BIKE_TYPES = [
    { value: 'sport', label: 'Sport' },
    { value: 'naked', label: 'Naked' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'cruiser', label: 'Cruiser' },
    { value: 'touring', label: 'Touring' },
    { value: 'cafe-racer', label: 'Café Racer' },
    { value: 'other', label: 'Other' },
];

const INDIAN_CITIES = [
    'Bangalore, Karnataka',
    'Mumbai, Maharashtra',
    'Delhi, NCR',
    'Pune, Maharashtra',
    'Hyderabad, Telangana',
    'Chennai, Tamil Nadu',
    'Kolkata, West Bengal',
    'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan',
    'Kochi, Kerala',
];

export default function ListingForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        mileage: '',
        engineCc: '',
        location: '',
        bikeType: 'naked',
        description: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 5);
            setImages(files);

            // Create previews
            const previews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(previews);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const validateStep = (currentStep: number): boolean => {
        setError('');

        if (currentStep === 1) {
            if (!formData.make || !formData.model || !formData.year) {
                setError('Please fill in all basic details');
                return false;
            }
            if (parseInt(formData.engineCc) < 250) {
                setError('Engine displacement must be 250cc or above');
                return false;
            }
        }

        if (currentStep === 2) {
            if (!formData.price || !formData.mileage || !formData.location) {
                setError('Please fill in all pricing and location details');
                return false;
            }
        }

        if (currentStep === 3) {
            if (!formData.description || formData.description.length < 50) {
                setError('Description must be at least 50 characters');
                return false;
            }
            if (images.length < 3) {
                setError('Please upload at least 3 high-quality photos');
                return false;
            }
        }

        return true;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setError('');
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateStep(step)) return;

        setLoading(true);
        setError('');

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
                body: JSON.stringify({
                    ...formData,
                    year: parseInt(formData.year.toString()),
                    price: parseFloat(formData.price),
                    mileage: parseInt(formData.mileage),
                    engineCc: parseInt(formData.engineCc),
                    imageUrls
                }),
            });

            if (!listingRes.ok) {
                const { error } = await listingRes.json();
                throw new Error(error || 'Failed to create listing');
            }

            const { listing } = await listingRes.json();
            router.push(`/listings/${listing.id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            {/* Progress Indicator */}
            <div className={styles.progress}>
                <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
                    <div className={styles.progressCircle}>1</div>
                    <span>Basic Details</span>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
                    <div className={styles.progressCircle}>2</div>
                    <span>Pricing & Location</span>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
                    <div className={styles.progressCircle}>3</div>
                    <span>Photos & Description</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}

                {/* Step 1: Basic Details */}
                {step === 1 && (
                    <div className={styles.step}>
                        <h2 className={styles.stepTitle}>Basic Details</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className="label">Make *</label>
                                <input
                                    name="make"
                                    className="input"
                                    required
                                    placeholder="e.g. Royal Enfield"
                                    value={formData.make}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className="label">Model *</label>
                                <input
                                    name="model"
                                    className="input"
                                    required
                                    placeholder="e.g. Interceptor 650"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className="label">Year *</label>
                                <input
                                    name="year"
                                    type="number"
                                    className="input"
                                    required
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    placeholder="2023"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className="label">Engine (cc) *</label>
                                <input
                                    name="engineCc"
                                    type="number"
                                    className="input"
                                    required
                                    min="250"
                                    placeholder="648"
                                    value={formData.engineCc}
                                    onChange={handleInputChange}
                                />
                                <p className={styles.hint}>Minimum 250cc required</p>
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <label className="label">Bike Type *</label>
                                <select
                                    name="bikeType"
                                    className="input"
                                    value={formData.bikeType}
                                    onChange={handleInputChange}
                                >
                                    {BIKE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Pricing & Location */}
                {step === 2 && (
                    <div className={styles.step}>
                        <h2 className={styles.stepTitle}>Pricing & Location</h2>
                        <div className={styles.grid}>
                            <div className={styles.field}>
                                <label className="label">Price (₹) *</label>
                                <input
                                    name="price"
                                    type="number"
                                    className="input"
                                    required
                                    min="0"
                                    placeholder="250000"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className="label">Mileage (km) *</label>
                                <input
                                    name="mileage"
                                    type="number"
                                    className="input"
                                    required
                                    min="0"
                                    placeholder="5000"
                                    value={formData.mileage}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                                <label className="label">Location *</label>
                                <select
                                    name="location"
                                    className="input"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a city</option>
                                    {INDIAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Photos & Description */}
                {step === 3 && (
                    <div className={styles.step}>
                        <h2 className={styles.stepTitle}>Photos & Description</h2>

                        <div className={styles.field}>
                            <label className="label">Description *</label>
                            <textarea
                                name="description"
                                className="input"
                                rows={6}
                                required
                                minLength={50}
                                placeholder="Describe your motorcycle in detail. Include service history, modifications, condition, and any other relevant information..."
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                            <p className={styles.hint}>
                                {formData.description.length} / 50 characters minimum
                            </p>
                        </div>

                        <div className={styles.field}>
                            <label className="label">Photos * (3-5 high-quality images)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="input"
                            />
                            <p className={styles.hint}>Upload clear photos from multiple angles in good lighting</p>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className={styles.imagePreviews}>
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className={styles.imagePreview}>
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className={styles.removeImage}
                                        >
                                            ✕
                                        </button>
                                        {index === 0 && (
                                            <span className={styles.primaryBadge}>Primary</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className={styles.navigation}>
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="btn btn-outline"
                            disabled={loading}
                        >
                            Previous
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="btn btn-primary"
                            style={{ marginLeft: 'auto' }}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ marginLeft: 'auto' }}
                        >
                            {loading ? 'Creating Listing...' : 'Create Listing'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
