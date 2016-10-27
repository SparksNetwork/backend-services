import {λ} from "../../lib/lambda";
import {profileCreate} from "./create";
import {profileUpdate} from "./update";
import {profileRemove} from "./remove";

export default λ('gatewayCustomer',
  profileCreate, profileUpdate, profileRemove
)