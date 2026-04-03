import { Logger } from "@nestjs/common";

// Silence all NestJS logger output during tests to keep the output clean.
Logger.overrideLogger(false);
