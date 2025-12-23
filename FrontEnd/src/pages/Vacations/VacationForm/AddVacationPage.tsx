import "./VacationForm.css";
import React, { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createVacation } from "../../../api/vacationsApi";
import Button from "../../../Components/common/Button/Button";
import { useToast } from "../../../hooks/useToast";

const AddVacationPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [destination, setDestination] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // To prevent selecting past dates
    const todayStr = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
    }, []);

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (end < start) {
            setFormError("End date cannot be before start date");
            return false;
        }

        if (start < today || end < today) {
            setFormError("Cannot select past dates for a new vacation");
            return false;
        }

        if (!imageFile) {
            setFormError("You must select an image file for the vacation");
            return false;
        }

        setFormError(null);
        return true;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitError(null);

        if (!validateForm()) return;

        setIsSubmitting(true);

        const dest = destination.trim();

        try {
            await createVacation({
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
                        title: "Vacation created",
                        message: `Vacation "${destination.trim()}" was added successfully.`,
                        durationMs: 2800,
                    },
                    toastNonce: crypto.randomUUID(),
                },
            });
        } catch (error: any) {
            console.error("Create vacation error:", error);
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                "An error occurred while saving the vacation";

            setSubmitError(msg);

            toast.error(msg, "Addition failed");
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

    return (
        <div className="vacation-form-page">
            <h1>Add New Vacation</h1>

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
                        min={todayStr}
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
                        min={todayStr}
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

                {/* Image */}
                <div className="vacation-form__field vacation-form__field--file">
                    <label htmlFor="image">Vacation Image</label>

                    <div
                        className={
                            "vacation-form__file-wrapper" +
                            (isSubmitting ? " vacation-form__file-wrapper--disabled" : "")
                        }
                    >
                        {/* File input is visually hidden but accessible */}
                        <input
                            ref={fileInputRef}
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className="vacation-form__file-input"
                        />

                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            className="vacation-form__file-button"
                        >
                            <span>{imageFile ? "Choose a new image" : "Choose image"}</span>
                        </Button>
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
            </form>
        </div>
    );
};

export default AddVacationPage;