/**
 * ABOUTME: Google Apps Script webhook for CU Study Groups
 * ABOUTME: Posts form submissions to Supabase and handles duplicate detection
 *
 * Setup:
 * 1. Open the Google Sheet linked to your form
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Set the script properties (see setScriptProperties function)
 * 5. Run setScriptProperties() once to configure
 * 6. Create a trigger: onFormSubmit on form submission
 */

// Column indices (0-based) - adjust if your form columns differ
const COLUMNS = {
  TIMESTAMP: 0,
  NAME: 1,
  SUBJECT: 2,
  SUBJECT_OTHER: 3,
  DATE: 4,
  LOCATION: 5,
  START_TIME: 6,
  END_TIME: 7,
  STUDENT_LIMIT: 8,
  EMAIL: 9,
  PROFESSOR_NAME: 10
};

/**
 * Run this function once to set up script properties.
 * Edit the values below before running.
 */
function setScriptProperties() {
  const props = PropertiesService.getScriptProperties();

  // IMPORTANT: Replace these with your actual values
  props.setProperties({
    'SUPABASE_URL': 'https://qmosxdzmvzfusgxhditg.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': 'YOUR_SERVICE_ROLE_KEY_HERE'
  });

  Logger.log('Script properties set successfully');
}

/**
 * Main trigger function - called when form is submitted.
 * @param {Object} e - The form submission event
 */
function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Parse form data
    const formData = parseFormData(rowData);

    // Validate email domain
    if (!isColumbiaEmail(formData.organizer_email)) {
      Logger.log('Invalid email domain: ' + formData.organizer_email);
      return;
    }

    // Check for duplicates and send warning if found
    const duplicates = checkForDuplicates(formData);
    if (duplicates && duplicates.length > 0) {
      sendDuplicateWarningEmail(formData, duplicates);
    }

    // Insert into Supabase
    const result = insertStudyGroup(formData);
    Logger.log('Study group created: ' + JSON.stringify(result));

  } catch (error) {
    Logger.log('Error in onFormSubmit: ' + error.message);
    throw error;
  }
}

/**
 * Parse form row data into a structured object.
 * @param {Array} rowData - Array of cell values from the form response row
 * @returns {Object} Parsed form data
 */
function parseFormData(rowData) {
  // Get subject - use "Other" field if subject is "Other"
  let subject = rowData[COLUMNS.SUBJECT];
  if (subject === 'Other' && rowData[COLUMNS.SUBJECT_OTHER]) {
    subject = rowData[COLUMNS.SUBJECT_OTHER];
  }

  // Parse date and times
  const dateValue = rowData[COLUMNS.DATE];
  const startTimeValue = rowData[COLUMNS.START_TIME];
  const endTimeValue = rowData[COLUMNS.END_TIME];

  // Combine date and time into ISO timestamps
  const startTime = combineDateAndTime(dateValue, startTimeValue);
  const endTime = combineDateAndTime(dateValue, endTimeValue);

  // Parse student limit (can be empty)
  let studentLimit = rowData[COLUMNS.STUDENT_LIMIT];
  if (studentLimit === '' || studentLimit === null || studentLimit === undefined) {
    studentLimit = null;
  } else {
    studentLimit = parseInt(studentLimit, 10);
    if (isNaN(studentLimit) || studentLimit <= 0) {
      studentLimit = null;
    }
  }

  return {
    subject: subject,
    professor_name: rowData[COLUMNS.PROFESSOR_NAME] || null,
    location: rowData[COLUMNS.LOCATION],
    start_time: startTime,
    end_time: endTime,
    student_limit: studentLimit,
    organizer_name: rowData[COLUMNS.NAME] || null,
    organizer_email: rowData[COLUMNS.EMAIL]
  };
}

/**
 * Combine a date and time value into an ISO 8601 timestamp.
 * Assumes Eastern Time (America/New_York) for Columbia.
 * @param {Date|string} dateValue - The date from the form
 * @param {Date|string} timeValue - The time from the form
 * @returns {string} ISO 8601 timestamp
 */
function combineDateAndTime(dateValue, timeValue) {
  // Handle Date objects from Google Forms
  let date, hours, minutes;

  if (dateValue instanceof Date) {
    date = new Date(dateValue);
  } else {
    date = new Date(dateValue);
  }

  if (timeValue instanceof Date) {
    hours = timeValue.getHours();
    minutes = timeValue.getMinutes();
  } else {
    // Parse time string like "3:00 PM" or "15:00"
    const timeStr = String(timeValue);
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      if (match[3]) {
        if (match[3].toUpperCase() === 'PM' && hours !== 12) {
          hours += 12;
        } else if (match[3].toUpperCase() === 'AM' && hours === 12) {
          hours = 0;
        }
      }
    } else {
      hours = 0;
      minutes = 0;
    }
  }

  // Set the time on the date
  date.setHours(hours, minutes, 0, 0);

  // Convert to ISO string
  return date.toISOString();
}

/**
 * Check if an email is a valid Columbia email.
 * @param {string} email - The email to check
 * @returns {boolean} True if valid Columbia email
 */
function isColumbiaEmail(email) {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return lowerEmail.endsWith('@columbia.edu') || lowerEmail.endsWith('@barnard.edu');
}

/**
 * Insert a study group into Supabase.
 * @param {Object} formData - The parsed form data
 * @returns {Object} The created study group
 */
function insertStudyGroup(formData) {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceRoleKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  const url = supabaseUrl + '/rest/v1/study_groups';

  const options = {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(formData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 201) {
    throw new Error('Supabase insert failed: ' + statusCode + ' - ' + responseText);
  }

  return JSON.parse(responseText);
}

/**
 * Check for similar/duplicate study groups.
 * @param {Object} formData - The parsed form data
 * @returns {Array} Array of similar study groups
 */
function checkForDuplicates(formData) {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceRoleKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  const url = supabaseUrl + '/rest/v1/rpc/find_similar_study_groups';

  const options = {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      p_subject: formData.subject,
      p_professor_name: formData.professor_name,
      p_start_time: formData.start_time,
      p_end_time: formData.end_time
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    Logger.log('Duplicate check failed: ' + response.getContentText());
    return [];
  }

  return JSON.parse(response.getContentText());
}

/**
 * Send a warning email about duplicate study groups using Gmail.
 * Uses the built-in GmailApp service - no external API needed.
 * @param {Object} formData - The new study group data
 * @param {Array} duplicates - Array of similar existing study groups
 */
function sendDuplicateWarningEmail(formData, duplicates) {
  // Format duplicate info
  const duplicateList = duplicates.map(d => {
    const startTime = new Date(d.start_time);
    return `- ${d.subject} with ${d.professor_name || 'unknown professor'} at ${startTime.toLocaleString()}`;
  }).join('\n');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #003366;">Similar Study Groups Found</h2>
      <p>Hi${formData.organizer_name ? ' ' + formData.organizer_name : ''},</p>
      <p>We noticed there are similar study groups already scheduled:</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${duplicateList}</pre>
      <p>Your study group for <strong>${formData.subject}</strong> has still been created.
         You may want to consider joining one of the existing groups or coordinating with other organizers.</p>
      <p>Best,<br>CU Study Groups</p>
    </div>
  `;

  try {
    GmailApp.sendEmail(
      formData.organizer_email,
      'Similar Study Groups Found - ' + formData.subject,
      // Plain text fallback
      `Similar study groups found:\n${duplicateList}\n\nYour study group for ${formData.subject} has still been created.`,
      {
        htmlBody: emailHtml,
        name: 'CU Study Groups'
      }
    );
    Logger.log('Duplicate warning email sent to ' + formData.organizer_email);
  } catch (error) {
    Logger.log('Failed to send duplicate warning email: ' + error.message);
  }
}

/**
 * Test function to verify the setup works.
 * Run this manually to test the connection.
 */
function testConnection() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceRoleKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    Logger.log('ERROR: Script properties not set. Run setScriptProperties() first.');
    return;
  }

  // Test by fetching study groups
  const url = supabaseUrl + '/rest/v1/study_groups?limit=1';

  const options = {
    method: 'GET',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': 'Bearer ' + serviceRoleKey
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();

  if (statusCode === 200) {
    Logger.log('SUCCESS: Connection to Supabase works!');
    Logger.log('Response: ' + response.getContentText());
  } else {
    Logger.log('ERROR: Connection failed with status ' + statusCode);
    Logger.log('Response: ' + response.getContentText());
  }
}
