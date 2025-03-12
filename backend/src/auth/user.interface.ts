export interface User {
  id: string;
  email: string;
  groups: string[];
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
