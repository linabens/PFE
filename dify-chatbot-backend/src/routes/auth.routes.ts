import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { RegisterSchema, LoginSchema } from '../models/schemas';

const router = Router();

router.post('/register', validate(RegisterSchema), register);
router.post('/login', validate(LoginSchema), login);

export default router;
