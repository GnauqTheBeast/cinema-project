CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "FullName" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Users" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  discriminator VARCHAR(255) NOT NULL,
  "fullNameId" UUID NOT NULL REFERENCES "FullName"(id),
  address VARCHAR(255),
  "walletAddress" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "Customers" (
  "userId" UUID PRIMARY KEY REFERENCES "Users"(id),
  "loyaltyPoint" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Staffs" (
  "userId" UUID PRIMARY KEY REFERENCES "Users"(id),
  salary DOUBLE PRECISION NOT NULL,
  position VARCHAR(255) NOT NULL,
  "managerCode" VARCHAR(255),
  title VARCHAR(255)
); 