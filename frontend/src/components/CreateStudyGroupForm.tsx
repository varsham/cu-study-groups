// ABOUTME: Form component for organizers to create new study groups
// ABOUTME: Mirrors the Google Form fields for direct group creation

import { useState, type FormEvent } from "react";
import "./CreateStudyGroupForm.css";

const SUBJECTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "History",
  "English",
  "Psychology",
  "Philosophy",
  "Political Science",
  "Sociology",
  "Other",
];

interface CreateStudyGroupFormProps {
  organizerEmail: string;
  onSubmit: (data: StudyGroupFormData) => Promise<void>;
  onCancel: () => void;
}

export interface StudyGroupFormData {
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
  organizer_email: string;
}

export function CreateStudyGroupForm({
  organizerEmail,
  onSubmit,
  onCancel,
}: CreateStudyGroupFormProps) {
  const [subject, setSubject] = useState("");
  const [subjectOther, setSubjectOther] = useState("");
  const [description, setDescription] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [studentLimit, setStudentLimit] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const finalSubject = subject === "Other" ? subjectOther.trim() : subject;
    if (!finalSubject) {
      setError("Please select or enter a subject");
      return;
    }
    if (!location.trim()) {
      setError("Please enter a location");
      return;
    }
    if (!date) {
      setError("Please select a date");
      return;
    }
    if (!startTime) {
      setError("Please select a start time");
      return;
    }
    if (!endTime) {
      setError("Please select an end time");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    const parsedLimit = studentLimit ? parseInt(studentLimit, 10) : null;
    if (studentLimit && (isNaN(parsedLimit!) || parsedLimit! <= 0)) {
      setError("Student limit must be a positive number");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        subject: finalSubject,
        description: description.trim() || null,
        professor_name: professorName.trim() || null,
        location: location.trim(),
        date,
        start_time: startTime,
        end_time: endTime,
        student_limit: parsedLimit,
        organizer_name: organizerName.trim() || null,
        organizer_email: organizerEmail,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      setIsSubmitting(false);
    }
  };

  // Get tomorrow's date as minimum for the date picker
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="create-form-overlay">
      <div className="create-form">
        <div className="create-form__header">
          <h2 className="create-form__title">Create Study Group</h2>
          <button
            type="button"
            className="create-form__close"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-form__body">
          {error && <div className="create-form__error">{error}</div>}

          <div className="create-form__field">
            <label htmlFor="organizer-name" className="create-form__label">
              Your Name
            </label>
            <input
              type="text"
              id="organizer-name"
              className="create-form__input"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="subject" className="create-form__label">
              Subject <span className="create-form__required">*</span>
            </label>
            <select
              id="subject"
              className="create-form__select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {subject === "Other" && (
            <div className="create-form__field">
              <label htmlFor="subject-other" className="create-form__label">
                Specify Subject <span className="create-form__required">*</span>
              </label>
              <input
                type="text"
                id="subject-other"
                className="create-form__input"
                value={subjectOther}
                onChange={(e) => setSubjectOther(e.target.value)}
                placeholder="Enter subject name"
                required
              />
            </div>
          )}

          <div className="create-form__field">
            <label htmlFor="description" className="create-form__label">
              Description
            </label>
            <textarea
              id="description"
              className="create-form__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., APMA E2000 Multivariable Calculus - Studying for midterm, focusing on partial derivatives and multiple integrals"
              rows={3}
            />
            <p className="create-form__hint">
              Include the course identifier (e.g., APMA E2000) and what you hope
              to accomplish.
            </p>
          </div>

          <div className="create-form__field">
            <label htmlFor="professor" className="create-form__label">
              Professor Name
            </label>
            <input
              type="text"
              id="professor"
              className="create-form__input"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              placeholder="Enter professor name (optional)"
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="date" className="create-form__label">
              Date <span className="create-form__required">*</span>
            </label>
            <input
              type="date"
              id="date"
              className="create-form__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              required
            />
          </div>

          <div className="create-form__row">
            <div className="create-form__field create-form__field--half">
              <label htmlFor="start-time" className="create-form__label">
                Start Time <span className="create-form__required">*</span>
              </label>
              <input
                type="time"
                id="start-time"
                className="create-form__input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="create-form__field create-form__field--half">
              <label htmlFor="end-time" className="create-form__label">
                End Time <span className="create-form__required">*</span>
              </label>
              <input
                type="time"
                id="end-time"
                className="create-form__input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="create-form__field">
            <label htmlFor="location" className="create-form__label">
              Location <span className="create-form__required">*</span>
            </label>
            <input
              type="text"
              id="location"
              className="create-form__input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Butler Library Room 301"
              required
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="student-limit" className="create-form__label">
              Student Limit
            </label>
            <input
              type="number"
              id="student-limit"
              className="create-form__input"
              value={studentLimit}
              onChange={(e) => setStudentLimit(e.target.value)}
              placeholder="Leave empty for no limit"
              min="1"
            />
          </div>

          <div className="create-form__actions">
            <button
              type="button"
              className="create-form__button create-form__button--cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-form__button create-form__button--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Study Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
