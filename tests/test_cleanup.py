# ABOUTME: Tests for the cleanup_expired_groups function
# ABOUTME: Verifies that expired groups are properly deleted

import pytest
from datetime import datetime, timedelta, timezone
from supabase import Client


class TestCleanupExpiredGroups:
    """Tests for the cleanup_expired_groups database function."""

    def test_cleanup_deletes_expired_groups_with_no_participants(
        self, supabase_client: Client, clean_test_data
    ):
        """Test that expired groups with no participants are deleted."""
        # Create an expired group (end_time in the past)
        past_time = datetime.now(timezone.utc) - timedelta(hours=2)
        past_end = datetime.now(timezone.utc) - timedelta(hours=1)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Expired Group",
            "location": "Library",
            "start_time": past_time.isoformat(),
            "end_time": past_end.isoformat(),
            "organizer_email": "expired@columbia.edu",
            "expires_at": past_end.isoformat(),  # Already expired
        }).execute()

        group_id = result.data[0]["id"]

        # Run cleanup
        cleanup_result = supabase_client.rpc("cleanup_expired_groups").execute()
        deleted_count = cleanup_result.data

        # Verify the group was deleted
        check = supabase_client.table("study_groups").select("*").eq("id", group_id).execute()
        assert len(check.data) == 0
        assert deleted_count >= 1

    def test_cleanup_keeps_active_groups(
        self, supabase_client: Client, clean_test_data
    ):
        """Test that active (non-expired) groups are kept."""
        # Create an active group (end_time in the future)
        future_start = datetime.now(timezone.utc) + timedelta(hours=1)
        future_end = datetime.now(timezone.utc) + timedelta(hours=3)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Active Group",
            "location": "Library",
            "start_time": future_start.isoformat(),
            "end_time": future_end.isoformat(),
            "organizer_email": "active@columbia.edu",
        }).execute()

        group_id = result.data[0]["id"]

        # Run cleanup
        supabase_client.rpc("cleanup_expired_groups").execute()

        # Verify the group still exists
        check = supabase_client.table("study_groups").select("*").eq("id", group_id).execute()
        assert len(check.data) == 1

    def test_cleanup_deletes_past_end_time_groups(
        self, supabase_client: Client, clean_test_data
    ):
        """Test that groups past their end_time are deleted regardless of participants."""
        # Create a group that has ended
        past_start = datetime.now(timezone.utc) - timedelta(hours=3)
        past_end = datetime.now(timezone.utc) - timedelta(hours=1)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Past End Time",
            "location": "Library",
            "start_time": past_start.isoformat(),
            "end_time": past_end.isoformat(),
            "organizer_email": "past@columbia.edu",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=20)).isoformat(),
        }).execute()

        group_id = result.data[0]["id"]

        # Add a participant
        supabase_client.table("participants").insert({
            "study_group_id": group_id,
            "name": "Late Joiner",
            "email": "late@columbia.edu",
        }).execute()

        # Run cleanup - should still delete because end_time has passed
        supabase_client.rpc("cleanup_expired_groups").execute()

        # Verify the group was deleted (along with participant via cascade)
        check = supabase_client.table("study_groups").select("*").eq("id", group_id).execute()
        assert len(check.data) == 0

    def test_cleanup_returns_count(self, supabase_client: Client, clean_test_data):
        """Test that cleanup returns the number of deleted groups."""
        # Create multiple expired groups
        past_time = datetime.now(timezone.utc) - timedelta(hours=2)
        past_end = datetime.now(timezone.utc) - timedelta(hours=1)

        for i in range(3):
            supabase_client.table("study_groups").insert({
                "subject": f"test-Expired {i}",
                "location": "Library",
                "start_time": past_time.isoformat(),
                "end_time": past_end.isoformat(),
                "organizer_email": f"expired{i}@columbia.edu",
                "expires_at": past_end.isoformat(),
            }).execute()

        # Run cleanup
        result = supabase_client.rpc("cleanup_expired_groups").execute()

        # Should have deleted at least 3 groups
        assert result.data >= 3
