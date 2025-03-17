import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The username of the user' })
  username: string;

  @ApiProperty({ description: 'The email of the user' })
  email: string;

  @ApiProperty({ description: 'The groups the user belongs to' })
  groups: string[];
}

// Extend Express Request interface to include user property
// Using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: User;
  }
}
