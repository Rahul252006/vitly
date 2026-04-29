CREATE TABLE IF NOT EXISTS papers (
    courseCode VARCHAR(50) NOT NULL,
    slot VARCHAR(20) NOT NULL,
    year VARCHAR(20) NOT NULL,
    examType VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    uploadedBy VARCHAR(255) NOT NULL,
    displayName BOOLEAN DEFAULT TRUE,
    fileUrl LONGTEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (courseCode, slot, year, examType)
);
