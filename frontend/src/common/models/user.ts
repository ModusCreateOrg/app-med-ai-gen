/**
 * The `Address` type.
 */
export type Address = {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: {
    lat: string;
    lng: string;
  };
};

/**
 * The `Company` type.
 */
export type Company = {
  name: string;
  catchPhrase: string;
  bs: string;
};

/**
 * The `User` type.
 */
export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  address: Address;
  company: Company;
};

/**
 * Login details from Cognito
 */
export type SignInDetails = {
  loginId?: string;
  // Add any other properties that might be needed
};

/**
 * Cognito User type aligned with AWS Cognito attributes
 */
export type CognitoUser = {
  // Unique identifier (sub from Cognito)
  id: string;
  // Username (usually email in our case)
  username: string;
  // Email address
  email: string;
  // Full name composed of given_name and family_name
  name?: string;
  // First name from Cognito given_name attribute
  firstName?: string;
  // Last name from Cognito family_name attribute
  lastName?: string;
  // Phone number
  phone?: string;
  // Whether email is verified
  emailVerified?: boolean;
  // Whether phone is verified
  phoneVerified?: boolean;
  // User groups/roles
  groups?: string[];
  // Created date
  createdAt?: string;
  // Updated date
  updatedAt?: string;
  // Sign-in details (optional)
  signInDetails?: SignInDetails;
};
