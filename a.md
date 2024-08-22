To set up the queue for background processing in your NestJS application using Bull, you'll follow these structured steps. Here we will leverage the existing structure you provided and focus on the essential parts required to achieve background task processing.

### Step-by-Step Implementation

#### 1. Install Dependencies

Make sure you install the necessary packages first:

```sh
npm install @nestjs/bull bull redis
```

#### 2. Update Configuration

Add your Redis configuration so Bull can connect to Redis. You can place this in `config/app.config.ts`:

```typescript
// config/app.config.ts
export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});
```

#### 3. Create Queue Module

Create the queue module in the `processor` directory to manage your Bull queue:

```typescript
// processor/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkerService } from './services/worker.service';
import { MessengerStrategy } from './services/messeger.strategy';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'messenger',
    }),
  ],
  providers: [WorkerService, MessengerStrategy],
  exports: [BullModule],
})
export class QueueModule {}
```

#### 4. Worker Service

Create a worker service to process tasks from the queue:

```typescript
// processor/services/worker.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class WorkerService {
  constructor(@InjectQueue('messenger') private readonly messengerQueue: Queue) {}

  async addJob(data: any) {
    await this.messengerQueue.add('process-messenger', data);
  }
}
```

#### 5. Define Processor

Define how to process the queue in `messeger.strategy.ts`:

```typescript
// processor/services/messeger.strategy.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('messenger')
export class MessengerStrategy {
  @Process('process-messenger')
  async handleAsync(job: Job) {
    console.log('Processing job', job.data);

    // Add your processing logic here
    // For example, you might interact with the Facebook API or another service

    return {};
  }
}
```

#### 6. Push to Queue from Controller

Update your webhook controller to append jobs to the queue:

```typescript
// facebook/controllers/webhook.controller.ts
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { WorkerService } from 'processor/services/worker.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const { body } = req;

    // Add the received event to the queue
    await this.workerService.addJob(body);

    // Acknowledge the request
    res.sendStatus(200);
  }
}
```

#### 7. Import Queue Module

Finally, ensure that your `AppModule` imports the `QueueModule`:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { FacebookModule } from './facebook/facebook.module';
import { QueueModule } from './processor/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    FacebookModule,
    QueueModule,
  ],
})
export class AppModule {}
```

### Deploying on Heroku

You would need to define two separate dynos in Heroku:
- A `web` dyno to handle the API requests and push jobs to the queue.
- A `worker` dyno to process the queue.

Your `Procfile` might look something like this:

```
web: npm run start:prod
worker: npm run start:worker
```

You will need to add a command in your `package.json` to start the worker:

```json
"scripts": {
  "start": "nest start",
  "start:prod": "nest start --prod",
  "start:worker": "node dist/worker.js"
}
```

Create a `worker.js` file at the root level to bootstrap only the worker:

```javascript
// worker.js
import { NestFactory } from '@nestjs/core';
import { QueueModule } from './processor/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  await app.init();
}

bootstrap();
```

And that's it! With this setup, your webhook events are handled immediately, and the processing is delegated to a worker running in a separate dyno, ensuring your responses stay prompt and your background tasks run efficiently.




To add the worker-related scripts to your existing `scripts` section in `package.json`, you can follow these steps:

1. **Add the `start:worker` script**: This will start the worker dyno.

2. **Add the `build:worker` script**: This will ensure the worker files are built when deploying.

Here's how you can modify your `scripts` section in `package.json`:

```json
"scripts": {
  "build": "nest build",
  "build:worker": "nest build && cp dist/main.js dist/worker.js",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "start:worker": "node dist/worker",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

Let's break down the changes:

- **`build:worker`**:
  ```json
  "build:worker": "nest build && cp dist/main.js dist/worker.js"
  ```
  This ensures that after the NestJS build command runs, it will copy `dist/main.js` to `dist/worker.js`. Since Heroku builds everything before running, this ensures `worker.js` is generated from `main.js` but only runs the necessary parts.

- **`start:worker`**:
  ```json
  "start:worker": "node dist/worker"
  ```
  This starts the worker process by running `worker.js`.

### Procfile

Update or create a `Procfile` at the root of your project to tell Heroku how to run your application:

```
web: npm run start:prod
worker: npm run start:worker
```

This configuration will make sure that:
- The `web` dyno uses the `start:prod` script.
- The `worker` dyno uses the `start:worker` script.

### Worker Entry File

Create a `worker.js` file at the root level of your project to start and bootstrap the worker context:

```javascript
// worker.js
import { NestFactory } from '@nestjs/core';
import { QueueModule } from './processor/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  await app.init();
}

bootstrap();
```

That's it! Your `worker.js` will be built along with your main application, and your `Procfile` tells Heroku how to run both the web server and the worker.

Upon deployment to Heroku:
1. The `web` dyno will run `npm run start:prod`.
2. The `worker` dyno will run `npm run start:worker`.

This setup effectively separates your request handling and background processing into different dynos, ensuring better performance and scalability.




Got it. Since you're using TypeScript, you'll want to ensure that the worker entry point is also in TypeScript and properly compiled. Here's how you can set this up:

### Adjusting the File Structure
First, let’s place the new worker initialization code in a TypeScript file within your `src` directory. We will create a `worker.main.ts` to handle the worker bootstrap, similar to how `main.ts` handles the web server bootstrap.

### Creating `worker.main.ts`
Create a new file named `worker.main.ts` under your `src` directory:

```typescript
// src/worker.main.ts
import { NestFactory } from '@nestjs/core';
import { QueueModule } from './processor/queue.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(QueueModule);
  await app.init();
}

bootstrap();
```

### Updating `tsconfig.json`
Ensure that your TypeScript configuration (`tsconfig.json`) includes the necessary paths and settings to compile the new worker entry file.

Check `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2017",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    // Other settings...
  },
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### Updating `package.json`
Modify the `scripts` section in `package.json` to include build and start commands for the worker:

```json
"scripts": {
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "start:worker": "node dist/worker.main",   // Adjusted line
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

### Updating Procfile
Make sure your `Procfile` reflects the correct start commands:

```
web: npm run start:prod
worker: npm run start:worker
```

### Building the Project
When you build your project using the `nest build` command, it will compile `src/worker.main.ts` into `dist/worker.main.js`.

### Running on Heroku
Deploy your updated codebase to Heroku. Heroku will follow the instructions in the `Procfile`:
- The `web` dyno will run `npm run start:prod`, which starts the NestJS server.
- The `worker` dyno will run `npm run start:worker`, which starts the worker process.

This setup cleanly separates your web server and worker logic, allowing your application to handle background jobs efficiently.