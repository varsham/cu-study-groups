# ABOUTME: Pytest configuration and fixtures for CU Study Groups tests
# ABOUTME: Provides Supabase client fixture with service role access

import os
import pytest
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture(scope="session")
def supabase_client() -> Client:
    """Create a Supabase client with service role access for testing."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        pytest.skip("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")

    return create_client(url, key)


@pytest.fixture
def clean_test_data(supabase_client: Client):
    """Fixture to clean up test data after each test."""
    yield
    # Clean up any test study groups (those with test- prefix in subject)
    supabase_client.table("study_groups").delete().like("subject", "test-%").execute()
