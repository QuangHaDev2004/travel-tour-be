import jwt from "jsonwebtoken"

export interface JwtPayloadCustom extends jwt.JwtPayload {
  id: string;
}