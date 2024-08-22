import dotenv from 'dotenv';
import process from 'node:process';

dotenv.config();

const environment = process.env.NODE_ENV;
console.log(environment);
type Config = {
  appConfig: {
    PORT: number;
  };

  dbConfig: {
    DATABASE_URL: string;
  };

  redisConfig: {
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_PASSWORD: string | undefined;
  };

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: string;
    VERIFY_TOKEN: string;
  };

  openAIConfig: {
    OPENAI_API_KEY: string;
  };
};

const devConfig: Config = {
  appConfig: {
    PORT: parseInt(process.env.PORT),
  },

  dbConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
  },

  redisConfig: {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: parseInt(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  },

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: process.env.FACEBOOK_MESSAGE_URI,
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  },

  openAIConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

const prodConfig: Config = {
  appConfig: {
    PORT: parseInt(process.env.PORT),
  },

  dbConfig: {
    DATABASE_URL: process.env.DATABASE_URL,
  },

  redisConfig: {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: parseInt(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  },

  facebookConfig: {
    FACEBOOK_MESSAGE_URI: process.env.FACEBOOK_MESSAGE_URI,
    VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  },

  openAIConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
};

export const config = environment === 'production' ? prodConfig : devConfig;
