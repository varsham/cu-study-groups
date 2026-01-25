// ABOUTME: Form component for organizers to edit existing study groups
// ABOUTME: Pre-populates with current values and enforces edit constraints

import { useState, type FormEvent } from "react";
import type { StudyGroupWithCounts } from "../lib/database.types";
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

export interface EditStudyGroupFormData {
  subject: string;
  description: string | null;
  professor_name: string | null;
  location: string;
  date: string;
  start_time: string;
  end_time: string;
  student_limit: number | null;
  organizer_name: string | null;
}

interface EditStudyGroupFormProps {
  group: StudyGroupWithCounts;
  onSubmit: (data: EditStudyGroupFormData) => Promise<void>;
  onCancel: () => void;
}

function parseDateTime(isoString: string): { date: string; time: string } {
  const dt = new Date(isoString);
  const date = dt.toISOString().split("T")[0];
  const hours = dt.getHours().toString().padStart(2, "0");
  const minutes = dt.getMinutes().toString().padStart(2, "0");
  return { date, time: `${hours}:${minutes}` };
}

export function EditStudyGroupForm({
  group,
  onSubmit,
  onCancel,
}: EditStudyGroupFormProps) {
  const startParsed = parseDateTime(group.start_time);
  const endParsed = parseDateTime(group.end_time);

  const isKnownSubject = SUBJECTS.includes(group.subject);
  const initialSubject = isKnownSubject ? group.subject : "Other";
  const initialSubjectOther = isKnownSubject ? "" : group.subject;

  const [subject, setSubject] = useState(initialSubject);
  const [subjectOther, setSubjectOther] = useState(initialSubjectOther);
  const [description, setDescription] = useState(group.description || "");
  const [professorName, setProfessorName] = useState(
    group.professor_name || ""
  );
  const [location, setLocation] = useState(group.location);
  const [date, setDate] = useState(startParsed.date);
  const [startTime, setStartTime] = useState(startParsed.time);
  const [endTime, setEndTime] = useState(endParsed.time);
  const [studentLimit, setStudentLimit] = useState(
    group.student_limit?.toString() || ""
  );
  const [organizerName, setOrganizerName] = useState(
    group.organizer_name || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minStudentLimit = group.participant_count;

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

    // Validate that the new date/time is in the future
    const newStartDateTime = new Date(`${date}T${startTime}:00`);
    if (newStartDateTime <= new Date()) {
      setError("Start time must be in the future");
      return;
    }

    const parsedLimit = studentLimit ? parseInt(studentLimit, 10) : null;
    if (studentLimit && (isNaN(parsedLimit!) || parsedLimit! <= 0)) {
      setError("Student limit must be a positive number");
      return;
    }

    // Validate student limit is not below current participant count
    if (parsedLimit !== null && parsedLimit < minStudentLimit) {
      setError(
        `Student limit cannot be less than ${minStudentLimit} (current number of participants)`
      );
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
      setIsSubmitting(false);
    }
  };

  // Minimum date is today
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
    <div className="create-form-overlay">
      <div className="create-form">
        <div className="create-form__header">
          <h2 className="create-form__title">Edit Study Group</h2>
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
            <label htmlFor="edit-organizer-name" className="create-form__label">
              Your Name
            </label>
            <input
              type="text"
              id="edit-organizer-name"
              className="create-form__input"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="edit-subject" className="create-form__label">
              Subject <span className="create-form__required">*</span>
            </label>
            <select
              id="edit-subject"
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
              <label
                htmlFor="edit-subject-other"
                className="create-form__label"
              >
                Specify Subject <span className="create-form__required">*</span>
              </label>
              <input
                type="text"
                id="edit-subject-other"
                className="create-form__input"
                value={subjectOther}
                onChange={(e) => setSubjectOther(e.target.value)}
                placeholder="Enter subject name"
                required
              />
            </div>
          )}

          <div className="create-form__field">
            <label htmlFor="edit-description" className="create-form__label">
              Description
            </label>
            <textarea
              id="edit-description"
              className="create-form__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Studying for Multivariable Calculus midterm, focusing on partial derivatives and multiple integrals"
              rows={3}
            />
            <p className="create-form__hint">
              Specify the course name (e.g., &quot;Multivariable Calculus&quot;
              for Mathematics) and what you hope to accomplish.
            </p>
          </div>

          <div className="create-form__field">
            <label htmlFor="edit-professor" className="create-form__label">
              Professor Name
            </label>
            <input
              type="text"
              id="edit-professor"
              className="create-form__input"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              placeholder="Enter professor name (optional)"
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="edit-date" className="create-form__label">
              Date <span className="create-form__required">*</span>
            </label>
            <input
              type="date"
              id="edit-date"
              className="create-form__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              required
            />
          </div>

          <div className="create-form__row">
            <div className="create-form__field create-form__field--half">
              <label htmlFor="edit-start-time" className="create-form__label">
                Start Time <span className="create-form__required">*</span>
              </label>
              <input
                type="time"
                id="edit-start-time"
                className="create-form__input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="create-form__field create-form__field--half">
              <label htmlFor="edit-end-time" className="create-form__label">
                End Time <span className="create-form__required">*</span>
              </label>
              <input
                type="time"
                id="edit-end-time"
                className="create-form__input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="create-form__field">
            <label htmlFor="edit-location" className="create-form__label">
              Location <span className="create-form__required">*</span>
            </label>
            <input
              type="text"
              id="edit-location"
              className="create-form__input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Butler Library Room 301"
              required
            />
          </div>

          <div className="create-form__field">
            <label htmlFor="edit-student-limit" className="create-form__label">
              Student Limit
            </label>
            <input
              type="number"
              id="edit-student-limit"
              className="create-form__input"
              value={studentLimit}
              onChange={(e) => setStudentLimit(e.target.value)}
              placeholder="Leave empty for no limit"
              min={minStudentLimit > 0 ? minStudentLimit : 1}
            />
            {minStudentLimit > 0 && (
              <p className="create-form__hint">
                Minimum: {minStudentLimit} (current participants)
              </p>
            )}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
