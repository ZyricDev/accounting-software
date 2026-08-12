import  createRequireAuth  from "./createRequireAuth.js";
import authService from "../../modules/auth/auth.service.js";

const requireAuth = createRequireAuth(authService.validateSession);

export default  requireAuth ;
