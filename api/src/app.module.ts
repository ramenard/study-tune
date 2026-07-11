import {Module} from '@nestjs/common';
import {ChatModule} from "./modules/chat/chat.module";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {MusicModule} from "./modules/music/music.module";
import {DocumentModule} from "./modules/document/document.module";
import {AuthModule} from "./modules/auth/auth.module";
import {PlaylistModule} from "./modules/playlist/playlist.module";
import {FriendshipModule} from "./modules/friendship/friendship.module";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
  imports: [
    ChatModule,
    MusicModule,
    DocumentModule,
    AuthModule,
    PlaylistModule,
    FriendshipModule,
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
      autoLoadEntities: true,
      synchronize: false,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: config.get('NODE_ENV') === 'production',
    }),
  }),],
})
export class AppModule {
}
