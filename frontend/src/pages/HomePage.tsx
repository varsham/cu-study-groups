// ABOUTME: Main homepage displaying all available study groups
// ABOUTME: Includes search, filtering, and join functionality

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUserEmail } from "../contexts/UserEmailContext";
import { useStudyGroups } from "../hooks/useStudyGroups";
import { SearchBar } from "../components/SearchBar";
import { StudyGroupCard } from "../components/StudyGroupCard";
import { JoinModal } from "../components/JoinModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { EmptyState } from "../components/EmptyState";
import type { StudyGroupWithCounts } from "../lib/database.types";
import "./HomePage.css";

export function HomePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { userEmail, setUserEmail } = useUserEmail();
  const [searchQuery, setSearchQuery] = useState("");
  const { groups, isLoading, error, refetch, joinGroup } =
    useStudyGroups(searchQuery);

  // Get effective email (from auth or from localStorage after joining)
  const effectiveEmail = user?.email || userEmail;

  // Redirect logged-in organizers to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [joinTarget, setJoinTarget] = useState<StudyGroupWithCounts | null>(
    null,
  );

  const handleJoin = async (data: { name: string; email: string }) => {
    if (!joinTarget) return;
    await joinGroup(joinTarget.id, data.name, data.email);
    // Save the email so user can see participants in groups they've joined
    setUserEmail(data.email);
  };

  return (
    <div className="home-page">
      <section className="home-page__hero">
        <h1 className="home-page__title">CU Study Groups</h1>
        <p className="home-page__subtitle">
          Find and join study groups with fellow Columbia students
        </p>
      </section>

      <section className="home-page__search">
        <SearchBar onSearch={setSearchQuery} />
      </section>

      <section className="home-page__content">
        {isLoading && (
          <div className="home-page__loading">
            <LoadingSpinner size="large" message="Loading study groups..." />
          </div>
        )}

        {error && (
          <div className="home-page__error">
            <ErrorMessage message={error} onRetry={refetch} />
          </div>
        )}

        {!isLoading && !error && groups.length === 0 && (
          <EmptyState
            title={
              searchQuery
                ? "No matching study groups"
                : "No study groups available"
            }
            description={
              searchQuery
                ? "Try a different search term or check back later."
                : "Check back later or create your own using the Google Form."
            }
          />
        )}

        {!isLoading && !error && groups.length > 0 && (
          <div className="home-page__groups">
            <p className="home-page__count">
              {groups.length} study group{groups.length !== 1 ? "s" : ""}{" "}
              {searchQuery ? "found" : "available"}
            </p>
            <div className="home-page__grid">
              {groups.map((group) => (
                <StudyGroupCard
                  key={group.id}
                  group={group}
                  onJoin={() => setJoinTarget(group)}
                  userEmail={effectiveEmail}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {joinTarget && (
        <JoinModal
          groupId={joinTarget.id}
          groupSubject={joinTarget.subject}
          onClose={() => setJoinTarget(null)}
          onJoin={handleJoin}
        />
      )}
    </div>
  );
}
