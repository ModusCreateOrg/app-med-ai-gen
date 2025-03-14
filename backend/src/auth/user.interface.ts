export interface User {
  id: string;
  email: string;
  groups: string[];
}

// Extend Express Request interface to include user property
// Using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: User;
  }
}
