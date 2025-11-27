import { createContainer, asFunction, asValue } from "awilix";
import prisma from "./infra/db/index.js";
import { logger } from "./infra/logger/index.js";
import { env } from "./config/index.js";
import { makeMailerService } from "./infra/mailer/index.js";
import { makeAuthService } from "./core/services/auth.service.js";
import { makeUserService } from "./core/services/user.service.js";
import { makeRoleService } from "./core/services/role.service.js";
import { makeStatsService } from "./core/services/stats.service.js";
import { makeProfilingService } from "./core/services/profiling.service.js";
import { makePlaceService } from "./core/services/place.service.js";
import { makeUserRepository } from "./core/repositories/user.repository.js";
import { makeAuthRepository } from "./core/repositories/auth.repository.js";
import { makeRbacRepository } from "./core/repositories/rbac.repository.js";
import { makeUserLogRepository } from "./core/repositories/userLog.repository.js";
import { makePreferenceRepository } from "./core/repositories/preference.repository.js";
import { makeRoomRepository } from "./core/repositories/room.repository.js";
import { makeQuestionerRepository } from "./core/repositories/questioner.repository.js";
import { makeProfileService } from "./core/services/profile.service.js";
import { makeScheduleService } from "./core/services/schedule.service.js";
import { makeCategoryRepository } from "./core/repositories/category.repository.js";
import { makeCategoryService } from "./core/services/category.service.js";
import { makeRoomService } from "./core/services/room.service.js";
import { makeCountryRepository } from "./core/repositories/country.repository.js";
import { makeRegionRepository } from "./core/repositories/region.repository.js";
import { makeCityRepository } from "./core/repositories/city.repository.js";
import { makeAuthenticationLogRepository } from "./core/repositories/authenticationLog.repository.js";
import { makeConversationService } from "./core/services/conversation.service.js";
import { makeCurrentSessionRepository } from "./core/repositories/currentSession.repository.js";

const container = createContainer();

// Register infrastructure
container.register({
  prisma: asValue(prisma),
  logger: asValue(logger),
  env: asValue(env),
});

// Register services
container.register({
  mailerService: asFunction(makeMailerService).singleton(),
  authService: asFunction(makeAuthService).singleton(),
  userService: asFunction(makeUserService).singleton(),
  roleService: asFunction(makeRoleService).singleton(),
  profileService: asFunction(makeProfileService).singleton(),
  roomService: asFunction(makeRoomService).singleton(),
  statsService: asFunction(makeStatsService).singleton(),
  conversationService: asFunction(makeConversationService).singleton(),
  categoryService: asFunction(makeCategoryService).singleton(),
  currentSessionRepository: asFunction(makeCurrentSessionRepository).singleton(),
  profilingService: asFunction(makeProfilingService).singleton(),
  placeService: asFunction(makePlaceService).singleton(),
  scheduleService: asFunction(makeScheduleService).singleton(),
});

// Register repositories
container.register({
  userRepository: asFunction(makeUserRepository).singleton(),
  countryRepository: asFunction(makeCountryRepository).singleton(),
  regionRepository: asFunction(makeRegionRepository).singleton(),
  cityRepository: asFunction(makeCityRepository).singleton(),
  preferenceRepository: asFunction(makePreferenceRepository).singleton(),
  roomRepository: asFunction(makeRoomRepository).singleton(),
  questionRepository: asFunction(makeQuestionerRepository).singleton(),
  authRepository: asFunction(makeAuthRepository).singleton(),
  rbacRepository: asFunction(makeRbacRepository).singleton(),
  categoryRepository: asFunction(makeCategoryRepository).singleton(),
  authenticationLogRepository: asFunction(makeAuthenticationLogRepository).singleton(),
  userLogRepository: asFunction(makeUserLogRepository).singleton(),
});

export default container;
