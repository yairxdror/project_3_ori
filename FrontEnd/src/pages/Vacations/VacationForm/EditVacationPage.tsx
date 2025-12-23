import "./VacationForm.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Vacation } from "../../../types/models";
import { getVacationById, updateVacation } from "../../../api/vacationsApi";
import { appConfig } from "../../../config/appConfig";
import Button from "../../../Components/common/Button/Button";
import { useToast } from "../../../hooks/useToast";

const EditVacationPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [vacation, setVacation] = useState<Vacation | null>(null);

    const [destination, setDestination] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [price, setPrice] = useState<string>("");

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [currentImageName, setCurrentImageName] = useState<string>("");

    const [formError, setFormError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Load vacation for editing
    useEffect(() => {
        if (!id) return;

        const load = async () => {
            setIsLoading(true);
            setSubmitError(null);
            try {
                const vac = await getVacationById(Number(id));
                setVacation(vac);

                setDestination(vac.destination);
                setDescription(vac.description);

                // Convert ISO to YYYY-MM-DD for input[type=date]
                setStartDate(vac.startDate.slice(0, 10));
                setEndDate(vac.endDate.slice(0, 10));

                setPrice(vac.price.toString());
                setCurrentImageName(vac.image);
            } catch (error: any) {
                console.error("Failed to load vacation:", error);
                const msg =
                    error?.response?.data?.message ||
                    error?.message ||
                    "An error occurred while loading the vacation";
                setSubmitError(msg);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id]);

    function validateForm(): boolean {
        if (!destination.trim() || !description.trim() || !startDate || !endDate || !price) {
            setFormError("Please fill out all fields");
            return false;
        }

        const numericPrice = Number(price);
        if (isNaN(numericPrice)) {
            setFormError("Price must be a number");
            return false;
        }

        if (numericPrice <= 0 || numericPrice > 10000) {
            setFormError("Price must be greater than 0 and not exceed 10,000");
            return false;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            setFormError("End date cannot be before start date");
            return false;
        }

        setFormError(null);
        return true;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitError(null);

        if (!id) {
            setSubmitError("Invalid vacation for editing");
            return;
        }

        if (!validateForm()) return;

        setIsSubmitting(true);

        const dest = destination.trim();

        try {
            await updateVacation(Number(id), {
                destination: dest,
                description: description.trim(),
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                price: Number(price),
                imageFile,
            });

            navigate("/vacations", {
                replace: true,
                state: {
                    toast: {
                        variant: "success",
                        title: "Vacation updated",
                        message: `Vacation "${destination.trim()}" was updated successfully.`,
                        durationMs: 2800,
                    },
                    toastNonce: crypto.randomUUID(),
                },
            });
        } catch (error: any) {
            console.error("Update vacation error:", error);
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "An error occurred while saving changes";

            setSubmitError(msg);

            toast.error(msg, "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setImageFile(file);
    }

    function handleCancel() {
        navigate("/vacations");
    }

    const currentImageUrl =
        currentImageName && !currentImageName.startsWith("http")
            ? `${appConfig.imagesBaseUrl}/${currentImageName}`
            : currentImageName;

    if (isLoading) {
        return <div>Loading vacation for editing...</div>;
    }

    if (!vacation && submitError) {
        return (
            <div>
                <h2>Error loading vacation</h2>
                <p>{submitError}</p>
            </div>
        );
    }

    if (!vacation) {
        return <div>Vacation not found.</div>;
    }

    return (
        <div className="vacation-form-page">
            <h1>Edit Vacation</h1>

            <form className="vacation-form" onSubmit={handleSubmit}>
                {/* Destination */}
                <div className="vacation-form__field">
                    <label htmlFor="destination">Destination</label>
                    <input
                        id="destination"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Description */}
                <div className="vacation-form__field">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Start Date */}
                <div className="vacation-form__field">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* End Date */}
                <div className="vacation-form__field">
                    <label htmlFor="endDate">End Date</label>
                    <input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Price */}
                <div className="vacation-form__field">
                    <label htmlFor="price">Price</label>
                    <input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min={0}
                        max={10000}
                        step={1}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Current image + optional change */}
                <div className="vacation-form__field">
                    <label>Current Image</label>
                    {currentImageUrl ? (
                        <div className="vacation-form__image-preview">
                            <img
                                src={currentImageUrl}
                                alt={destination}
                                style={{ maxWidth: "200px" }}
                            />
                        </div>
                    ) : (
                        <div>No image</div>
                    )}
                </div>

                <div className="vacation-form__field vacation-form__field--file">
                    <label htmlFor="image">Change Image (optional)</label>

                    <div
                        className={
                            "vacation-form__file-wrapper" +
                            (isSubmitting ? " vacation-form__file-wrapper--disabled" : "")
                        }
                    >
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className="vacation-form__file-input"
                        />

                        <label
                            htmlFor="image"
                            className="vacation-form_button vacation-form_button--primary vacation-form__file-button"
                        >
                            {imageFile ? "Choose a new image" : "Choose image"}
                        </label>

                    </div>
                    <span className="vacation-form__file-name">
                        {imageFile ? imageFile.name : "No file selected"}
                    </span>
                </div>



                {/* Client-side validation errors */}
                {formError && (
                    <div className="vacation-form__error">
                        {formError}
                    </div>
                )}

                {/* Server error */}
                {submitError && !formError && (
                    <div className="vacation-form__error">
                        {submitError}
                    </div>
                )}

                <div className="vacation-form__actions">
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Vacation"}
                    </Button>

                    <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                </div>

            </form >
        </div >
    );
};

export default EditVacationPage;