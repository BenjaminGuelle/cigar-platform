import { UserModel } from './user.model';

export interface AuthResponseModel {
  user: UserModel;
  accessToken: string;
}
