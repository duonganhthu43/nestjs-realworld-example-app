import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { DocumentService } from './document.service';
import { AuthMiddleware } from '../user/auth.middleware';
import { UserModule } from '../user/user.module';
import { DocumentController } from './document.controller';
import { FabricService } from '../user/fabric.client';

@Module({
  imports: [UserModule],
  providers: [DocumentService],
  controllers: [
    DocumentController
  ]
})
export class DocumentModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('documents');
  }
}
