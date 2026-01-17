# ABOUTME: Schema validation tests for CU Study Groups database
# ABOUTME: Tests table constraints, RLS policies, and database functions

import pytest
from datetime import datetime, timedelta, timezone
from supabase import Client


class TestStudyGroupsTable:
    """Tests for study_groups table constraints."""

    def test_create_valid_study_group(self, supabase_client: Client, clean_test_data):
        """Test creating a valid study group."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Calculus I",
            "professor_name": "Dr. Smith",
            "location": "Butler Library Room 301",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "student_limit": 10,
            "organizer_name": "John Doe",
            "organizer_email": "jd1234@columbia.edu",
        }).execute()

        assert len(result.data) == 1
        group = result.data[0]
        assert group["subject"] == "test-Calculus I"
        assert group["organizer_email"] == "jd1234@columbia.edu"
        assert group["expires_at"] is not None

    def test_expires_at_is_computed(self, supabase_client: Client, clean_test_data):
        """Test that expires_at is automatically computed as min(created_at + 24h, end_time)."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        # End time is only 2 hours from now (less than 24 hours)
        end_time = now + timedelta(hours=2)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Short Session",
            "location": "Mudd Building",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "organizer_email": "short@columbia.edu",
        }).execute()

        group = result.data[0]
        expires_at = datetime.fromisoformat(group["expires_at"].replace("Z", "+00:00"))
        end_time_parsed = datetime.fromisoformat(group["end_time"].replace("Z", "+00:00"))

        # expires_at should equal end_time since it's sooner than created_at + 24h
        assert abs((expires_at - end_time_parsed).total_seconds()) < 2

    def test_reject_invalid_columbia_email(self, supabase_client: Client, clean_test_data):
        """Test that non-columbia.edu emails are rejected."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        with pytest.raises(Exception) as exc_info:
            supabase_client.table("study_groups").insert({
                "subject": "test-Invalid Email",
                "location": "Butler Library",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "organizer_email": "test@gmail.com",
            }).execute()

        assert "valid_organizer_email" in str(exc_info.value).lower() or "check" in str(exc_info.value).lower()

    def test_reject_end_time_before_start_time(self, supabase_client: Client, clean_test_data):
        """Test that end_time must be after start_time."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=3)
        end_time = now + timedelta(hours=1)  # Before start_time

        with pytest.raises(Exception) as exc_info:
            supabase_client.table("study_groups").insert({
                "subject": "test-Bad Time Range",
                "location": "Butler Library",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "organizer_email": "test@columbia.edu",
            }).execute()

        assert "valid_time_range" in str(exc_info.value).lower() or "check" in str(exc_info.value).lower()

    def test_student_limit_must_be_positive(self, supabase_client: Client, clean_test_data):
        """Test that student_limit must be positive if set."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        with pytest.raises(Exception):
            supabase_client.table("study_groups").insert({
                "subject": "test-Zero Limit",
                "location": "Butler Library",
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "student_limit": 0,
                "organizer_email": "test@columbia.edu",
            }).execute()

    def test_null_student_limit_allowed(self, supabase_client: Client, clean_test_data):
        """Test that null student_limit (unlimited) is allowed."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Unlimited",
            "location": "Butler Library",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "student_limit": None,
            "organizer_email": "unlimited@columbia.edu",
        }).execute()

        assert result.data[0]["student_limit"] is None


class TestParticipantsTable:
    """Tests for participants table constraints."""

    @pytest.fixture
    def test_study_group(self, supabase_client: Client, clean_test_data):
        """Create a test study group for participant tests."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Participant Tests",
            "location": "Mudd Building",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "student_limit": 2,
            "organizer_email": "organizer@columbia.edu",
        }).execute()

        return result.data[0]

    def test_join_study_group(self, supabase_client: Client, test_study_group):
        """Test joining a study group."""
        result = supabase_client.table("participants").insert({
            "study_group_id": test_study_group["id"],
            "name": "Jane Student",
            "email": "js1234@columbia.edu",
        }).execute()

        assert len(result.data) == 1
        assert result.data[0]["name"] == "Jane Student"

    def test_reject_duplicate_join(self, supabase_client: Client, test_study_group):
        """Test that same email cannot join same group twice."""
        # First join succeeds
        supabase_client.table("participants").insert({
            "study_group_id": test_study_group["id"],
            "name": "Duplicate Test",
            "email": "duplicate@columbia.edu",
        }).execute()

        # Second join with same email fails
        with pytest.raises(Exception) as exc_info:
            supabase_client.table("participants").insert({
                "study_group_id": test_study_group["id"],
                "name": "Duplicate Test 2",
                "email": "duplicate@columbia.edu",
            }).execute()

        assert "unique" in str(exc_info.value).lower() or "duplicate" in str(exc_info.value).lower()

    def test_reject_non_columbia_participant_email(self, supabase_client: Client, test_study_group):
        """Test that non-columbia.edu participant emails are rejected."""
        with pytest.raises(Exception) as exc_info:
            supabase_client.table("participants").insert({
                "study_group_id": test_study_group["id"],
                "name": "External Person",
                "email": "external@gmail.com",
            }).execute()

        assert "valid_participant_email" in str(exc_info.value).lower() or "check" in str(exc_info.value).lower()

    def test_capacity_check_blocks_full_group(self, supabase_client: Client, test_study_group):
        """Test that joining a full group is blocked."""
        # Fill the group (limit is 2)
        supabase_client.table("participants").insert({
            "study_group_id": test_study_group["id"],
            "name": "Student 1",
            "email": "student1@columbia.edu",
        }).execute()

        supabase_client.table("participants").insert({
            "study_group_id": test_study_group["id"],
            "name": "Student 2",
            "email": "student2@columbia.edu",
        }).execute()

        # Third student should be blocked
        with pytest.raises(Exception) as exc_info:
            supabase_client.table("participants").insert({
                "study_group_id": test_study_group["id"],
                "name": "Student 3",
                "email": "student3@columbia.edu",
            }).execute()

        assert "full" in str(exc_info.value).lower()

    def test_cascade_delete_participants(self, supabase_client: Client, clean_test_data):
        """Test that deleting a study group cascades to participants."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        # Create group
        group_result = supabase_client.table("study_groups").insert({
            "subject": "test-Cascade Delete",
            "location": "Butler Library",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "organizer_email": "cascade@columbia.edu",
        }).execute()
        group_id = group_result.data[0]["id"]

        # Add participant
        supabase_client.table("participants").insert({
            "study_group_id": group_id,
            "name": "Will Be Deleted",
            "email": "deleted@columbia.edu",
        }).execute()

        # Delete group
        supabase_client.table("study_groups").delete().eq("id", group_id).execute()

        # Verify participant is also deleted
        participants = supabase_client.table("participants").select("*").eq("study_group_id", group_id).execute()
        assert len(participants.data) == 0


class TestDatabaseFunctions:
    """Tests for database functions."""

    @pytest.fixture
    def test_study_group_with_participants(self, supabase_client: Client, clean_test_data):
        """Create a test study group with some participants."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        group_result = supabase_client.table("study_groups").insert({
            "subject": "test-Function Tests",
            "location": "Mudd Building",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "student_limit": 5,
            "organizer_email": "functions@columbia.edu",
        }).execute()
        group = group_result.data[0]

        # Add 2 participants
        supabase_client.table("participants").insert({
            "study_group_id": group["id"],
            "name": "Participant 1",
            "email": "p1@columbia.edu",
        }).execute()

        supabase_client.table("participants").insert({
            "study_group_id": group["id"],
            "name": "Participant 2",
            "email": "p2@columbia.edu",
        }).execute()

        return group

    def test_get_participant_count(self, supabase_client: Client, test_study_group_with_participants):
        """Test get_participant_count function."""
        group_id = test_study_group_with_participants["id"]

        result = supabase_client.rpc("get_participant_count", {"p_study_group_id": group_id}).execute()
        assert result.data == 2

    def test_is_study_group_full_false(self, supabase_client: Client, test_study_group_with_participants):
        """Test is_study_group_full returns false when not full."""
        group_id = test_study_group_with_participants["id"]

        result = supabase_client.rpc("is_study_group_full", {"p_study_group_id": group_id}).execute()
        assert result.data is False

    def test_get_study_groups_with_counts(self, supabase_client: Client, test_study_group_with_participants):
        """Test get_study_groups_with_counts function."""
        result = supabase_client.rpc("get_study_groups_with_counts").execute()

        # Find our test group
        test_group = next(
            (g for g in result.data if g["id"] == test_study_group_with_participants["id"]),
            None
        )

        assert test_group is not None
        assert test_group["participant_count"] == 2
        assert test_group["is_full"] is False
