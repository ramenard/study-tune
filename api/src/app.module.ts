import {Module} from '@nestjs/common';
import {ChatModule} from "./modules/chat/chat.module";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MusicModule} from "./modules/music/music.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Music} from "./modules/music/entities/music.entity";

@Module({
  imports: [
    ChatModule,
    MusicModule,
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      type: 'postgres',
      host: config.get('DB_HOST', 'localhost'),
      port: config.get<number>('DB_PORT', 5432),
      username: config.get('DB_USER', 'user'),
      password: config.get('DB_PASSWORD', 'password'),
      database: config.get('DB_NAME', 'musicdb'),
      entities: [Music],
      synchronize: config.get('NODE_ENV') !== 'production', // ⚠️ false en prod
    }),
  }),],
})
export class AppModule {
}
