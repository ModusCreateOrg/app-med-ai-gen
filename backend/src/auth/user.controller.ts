import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from './user.interface';

@ApiTags('users')
@Controller('users')
export class UserController {
  // This is a mock implementation - in a real app, you'd inject a service
  private users: User[] = [
    { id: '1', username: 'user1', email: 'user1@example.com', groups: ['users'] },
    { id: '2', username: 'user2', email: 'user2@example.com', groups: ['users', 'admin'] },
  ];

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users', type: [User] })
  @Get()
  findAll(): Promise<User[]> {
    // Return mock data - in a real app, this would come from a service
    return Promise.resolve(this.users);
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return a user by ID', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    const user = this.users.find(user => user.id === id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return Promise.resolve(user);
  }

  // You can add more endpoints as needed
}
