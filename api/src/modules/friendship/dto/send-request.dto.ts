import { IsUUID } from 'class-validator';

export class SendRequestDto {
  @IsUUID()
  addresseeId: string;
}