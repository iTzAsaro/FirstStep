import type { CompanyAuthUser } from "@features/company-auth/login/model/companyAuthApi"
import type { UserAuthUser } from "../../../features/user-auth/login/model/userAuthApi"

export type Session = {
  user: CompanyAuthUser | UserAuthUser
}
