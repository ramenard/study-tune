import { IsIn } from 'class-validator';
import { FriendshipStatus } from '../entities/friendship.entity';

export class RespondRequestDto {
  @IsIn([FriendshipStatus.ACCEPTED, FriendshipStatus.DECLINED])
  status: FriendshipStatus.ACCEPTED | FriendshipStatus.DECLINED;
}
