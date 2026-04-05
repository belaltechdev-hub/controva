// OWNER SIGNUP REQUEST
export interface OwnerSignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}


// OWNER LOGIN REQUEST
export interface OwnerLoginRequest {
  email: string;
  password: string;
}


// TOKEN RESPONSE (FastAPI response)
export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}


// GENERIC API SUCCESS RESPONSE
export interface ApiSuccessResponse {
  success?: boolean;
  message?: string;
}