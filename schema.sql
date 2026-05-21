-- ============================================
-- DeadlinePay - Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS deadlinepay;
USE deadlinepay;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Income Sources Table
CREATE TABLE income_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  type ENUM('salary', 'freelance', 'business', 'rental', 'other') DEFAULT 'salary',
  amount DECIMAL(12, 2) NOT NULL,
  received_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence ENUM('monthly', 'weekly', 'yearly') DEFAULT 'monthly',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment Deadlines Table
CREATE TABLE deadlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  category ENUM('rent', 'loan', 'credit_card', 'utility', 'subscription', 'insurance', 'tax', 'other') NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue', 'partially_paid') DEFAULT 'pending',
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence ENUM('monthly', 'weekly', 'yearly') DEFAULT 'monthly',
  reminder_days INT DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoices Table (money owed TO user)
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(150),
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('pending', 'paid', 'overdue', 'partially_paid') DEFAULT 'pending',
  paid_amount DECIMAL(12, 2) DEFAULT 0,
  invoice_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Loans Table
CREATE TABLE loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lender_name VARCHAR(100) NOT NULL,
  loan_type ENUM('home', 'car', 'education', 'personal', 'other') DEFAULT 'personal',
  principal_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 0,
  emi_amount DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  total_paid DECIMAL(12, 2) DEFAULT 0,
  status ENUM('active', 'completed', 'defaulted') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment History Table
CREATE TABLE payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reference_type ENUM('deadline', 'invoice', 'loan') NOT NULL,
  reference_id INT NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other') DEFAULT 'bank_transfer',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  type ENUM('reminder', 'overdue', 'payment_received', 'info') DEFAULT 'reminder',
  reference_type ENUM('deadline', 'invoice', 'loan') DEFAULT 'deadline',
  reference_id INT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_deadlines_user_due ON deadlines(user_id, due_date);
CREATE INDEX idx_deadlines_status ON deadlines(status);
CREATE INDEX idx_income_user_date ON income_sources(user_id, received_date);
CREATE INDEX idx_invoices_user_due ON invoices(user_id, due_date);
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
