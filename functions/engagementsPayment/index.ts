import {λ} from "../../lib/lambda";
import {pay} from "./pay";
import {confirm} from "./confirm";

export default λ('engagementsPayment',
  pay,
  confirm
);