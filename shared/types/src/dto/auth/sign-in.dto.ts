import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for user sign-in with email/password
 */
export class SignInDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}