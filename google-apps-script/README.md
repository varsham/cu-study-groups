# Google Apps Script Webhook Setup

This script connects your Google Form to Supabase, automatically creating study groups when students submit the form.

## Prerequisites

- A Google Form linked to a Google Sheet
- Supabase project with the database schema deployed
- Resend API key (for duplicate warning emails)

## Setup Instructions

### 1. Open Apps Script Editor

1. Open your Google Sheet (the one linked to the form)
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor

### 2. Add the Webhook Code

1. Copy the contents of `webhook.gs`
2. Paste it into the Apps Script editor
3. Save the project (Ctrl+S or Cmd+S)
4. Name the project (e.g., "CU Study Groups Webhook")

### 3. Configure Script Properties

1. In the Apps Script editor, find the `setScriptProperties()` function
2. Replace the placeholder values:
   ```javascript
   props.setProperties({
     'SUPABASE_URL': 'https://qmosxdzmvzfusgxhditg.supabase.co',
     'SUPABASE_SERVICE_ROLE_KEY': 'your-actual-service-role-key'
   });
   ```
3. Run the `setScriptProperties()` function once:
   - Click the function dropdown (next to "Debug")
   - Select `setScriptProperties`
   - Click **Run**
   - Authorize the script when prompted

**Note:** Duplicate warning emails are sent using Google's built-in GmailApp service, so no external email API key is needed.

### 4. Verify Column Mapping

The script expects these columns in order (adjust `COLUMNS` constant if different):

| Index | Column Name |
|-------|-------------|
| 0 | Timestamp |
| 1 | Email |
| 2 | Name |
| 3 | Study Group Subject |
| 4 | If Other, enter subject |
| 5 | Professor Name |
| 6 | Date |
| 7 | Location |
| 8 | Start Time |
| 9 | End Time |
| 10 | Student Limit |

**To check your column order:**
1. Open your Google Sheet
2. Look at the header row
3. If columns differ, update the `COLUMNS` constant in the script

### 5. Test the Connection

1. In Apps Script, select `testConnection` from the function dropdown
2. Click **Run**
3. Check the **Execution log** (View → Logs)
4. You should see "SUCCESS: Connection to Supabase works!"

### 6. Create the Form Submit Trigger

1. In Apps Script, click the clock icon (⏰) on the left sidebar ("Triggers")
2. Click **+ Add Trigger**
3. Configure:
   - Function: `onFormSubmit`
   - Event source: `From spreadsheet`
   - Event type: `On form submit`
4. Click **Save**
5. Authorize the script when prompted

## Testing

### Manual Test

1. Submit a test response through your Google Form
2. Check the Apps Script execution log for any errors
3. Verify the study group appears in Supabase:
   - Go to Supabase Dashboard → Table Editor → study_groups

### Duplicate Detection Test

1. Submit two forms with:
   - Same subject
   - Same professor (or both empty)
   - Overlapping times
2. The second submission should trigger a warning email

## Troubleshooting

### "Supabase insert failed: 400"
- Check that all required fields are filled
- Verify the email ends with `@columbia.edu`
- Check that end_time is after start_time

### "Supabase insert failed: 401"
- Verify the `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure you ran `setScriptProperties()` after updating the key

### "Connection failed"
- Check the `SUPABASE_URL` is correct
- Verify your Supabase project is active

### Emails not sending
- Authorize the script to send emails when prompted
- Check the Apps Script execution log for errors
- Gmail may block emails if sent too frequently

## Security Notes

- The service role key has full database access - keep it secret
- Script properties are stored securely by Google
- Never commit actual keys to version control
