import { Module } from '@nestjs/common';
import { TicketController } from './ticket/ticket.controller';
import { ChatTestController } from './chat-test/chat-test.controller';
import { TicketService } from './ticket/ticket.service';
import { ChatTestService } from './chat-test/chat-test.service';

@Module({
  controllers: [TicketController, ChatTestController],
  providers: [TicketService, ChatTestService]
})
export class WebModule {}
