/**
 * CSV Validator utility
 * Validates CSV rows for required fields and correct data types
 */

/**
 * Validates a single CSV row
 * @param {Object} row - The CSV row object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validateRow(row) {
  const errors = [];

  // Check required fields
  if (!row.name || row.name.trim() === "") {
    errors.push("Name is required");
  }

  // Validate age (optional but must be number if provided)
  if (row.age !== undefined && row.age !== "" && row.age !== null) {
    const age = parseInt(row.age);
    if (isNaN(age) || age < 0 || age > 150) {
      errors.push("Age must be a valid number between 0 and 150");
    }
  }

  // Validate email (optional but must be valid format if provided)
  if (row.email && row.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.trim())) {
      errors.push("Email must be a valid email format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates multiple CSV rows
 * @param {Array} rows - Array of CSV row objects
 * @returns {Object} - { validRows: Array, invalidRows: Array, summary: Object }
 */
function validateRows(rows) {
  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const validation = validateRow(row);

    if (validation.isValid) {
      // Clean and format the valid row
      validRows.push({
        name: row.name.trim(),
        age: row.age && row.age !== "" ? parseInt(row.age) : null,
        email: row.email && row.email.trim() !== "" ? row.email.trim() : null,
      });
    } else {
      invalidRows.push({
        rowNumber: index + 1,
        data: row,
        errors: validation.errors,
      });
    }
  });

  return {
    validRows,
    invalidRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
    },
  };
}

module.exports = {
  validateRow,
  validateRows,
};
