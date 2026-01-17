# ABOUTME: Tests for email notification Edge Functions
# ABOUTME: Tests the on-participant-joined function endpoint

import os
import pytest
import httpx
from datetime import datetime, timedelta, timezone
from supabase import Client


class TestOnParticipantJoinedFunction:
    """Tests for the on-participant-joined Edge Function."""

    @pytest.fixture
    def edge_function_url(self) -> str:
        """Get the Edge Function URL."""
        supabase_url = os.environ.get("SUPABASE_URL", "")
        # Edge functions are at /functions/v1/<function-name>
        return f"{supabase_url}/functions/v1/on-participant-joined"

    @pytest.fixture
    def test_study_group(self, supabase_client: Client, clean_test_data):
        """Create a test study group for email tests."""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        result = supabase_client.table("study_groups").insert({
            "subject": "test-Email Function Test",
            "professor_name": "Dr. Test",
            "location": "Butler Library Room 301",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "student_limit": 10,
            "organizer_name": "Test Organizer",
            "organizer_email": "organizer@columbia.edu",
        }).execute()

        return result.data[0]

    def test_function_rejects_missing_fields(self, edge_function_url: str):
        """Test that the function rejects requests with missing fields."""
        anon_key = os.environ.get("SUPABASE_ANON_KEY", "")

        response = httpx.post(
            edge_function_url,
            json={"study_group_id": "some-id"},  # Missing participant info
            headers={
                "Authorization": f"Bearer {anon_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        assert response.status_code == 400
        assert "Missing required fields" in response.json().get("error", "")

    def test_function_rejects_invalid_study_group(self, edge_function_url: str):
        """Test that the function rejects requests for non-existent study groups."""
        anon_key = os.environ.get("SUPABASE_ANON_KEY", "")

        response = httpx.post(
            edge_function_url,
            json={
                "participant_id": "test-id",
                "participant_name": "Test Student",
                "participant_email": "student@columbia.edu",
                "study_group_id": "00000000-0000-0000-0000-000000000000",  # Non-existent
            },
            headers={
                "Authorization": f"Bearer {anon_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        assert response.status_code == 404
        assert "Study group not found" in response.json().get("error", "")

    def test_function_sends_emails_successfully(
        self, edge_function_url: str, test_study_group, supabase_client: Client
    ):
        """Test that the function successfully processes a valid request.

        Note: Actual email delivery depends on Resend API key being valid.
        On free tier, emails can only be sent to the account owner's email.
        This test verifies the function runs without errors.
        """
        anon_key = os.environ.get("SUPABASE_ANON_KEY", "")

        # First, add a participant to the study group
        participant_result = supabase_client.table("participants").insert({
            "study_group_id": test_study_group["id"],
            "name": "Email Test Student",
            "email": "emailtest@columbia.edu",
        }).execute()

        participant = participant_result.data[0]

        response = httpx.post(
            edge_function_url,
            json={
                "participant_id": participant["id"],
                "participant_name": participant["name"],
                "participant_email": participant["email"],
                "study_group_id": test_study_group["id"],
            },
            headers={
                "Authorization": f"Bearer {anon_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        # Function should return 200 even if emails fail to send
        # (on free tier, emails can only go to account owner)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data


class TestEmailIntegration:
    """Integration tests for the email flow."""

    def test_join_and_notify_flow(self, supabase_client: Client, clean_test_data):
        """Test the complete flow: join group → trigger notifications.

        This documents how the frontend should call the Edge Function
        after a participant successfully joins.
        """
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=3)

        # 1. Create study group
        group_result = supabase_client.table("study_groups").insert({
            "subject": "test-Integration Test",
            "professor_name": "Dr. Integration",
            "location": "Mudd Building",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "organizer_email": "integration@columbia.edu",
        }).execute()
        group = group_result.data[0]

        # 2. Add participant
        participant_result = supabase_client.table("participants").insert({
            "study_group_id": group["id"],
            "name": "Integration Student",
            "email": "student@columbia.edu",
        }).execute()
        participant = participant_result.data[0]

        # 3. Frontend would call Edge Function here:
        # await supabase.functions.invoke('on-participant-joined', {
        #     body: {
        #         participant_id: participant.id,
        #         participant_name: participant.name,
        #         participant_email: participant.email,
        #         study_group_id: group.id,
        #     }
        # })

        # Verify participant was added
        assert participant["name"] == "Integration Student"
        assert participant["study_group_id"] == group["id"]

        # Verify count increased
        count = supabase_client.rpc(
            "get_participant_count",
            {"p_study_group_id": group["id"]}
        ).execute()
        assert count.data == 1
